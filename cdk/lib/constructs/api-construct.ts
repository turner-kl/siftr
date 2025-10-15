import * as path from 'node:path';
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as authorizers from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import type * as cognito from 'aws-cdk-lib/aws-cognito';
import type * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import type * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface ApiConstructProps {
  userPool: cognito.UserPool;
  articlesTable: dynamodb.Table;
  interactionsTable: dynamodb.Table;
  cacheTable: dynamodb.Table;
  contentBucket: s3.Bucket;
  dsqlClusterId: string;
}

export class ApiConstruct extends Construct {
  public readonly apiUrl: string;
  public readonly apiFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: ApiConstructProps) {
    super(scope, id);

    // Lambda Web Adapter Layer (ARM64)
    const lambdaAdapterLayerArn = `arn:aws:lambda:${cdk.Stack.of(this).region}:753240598075:layer:LambdaAdapterLayerArm64:25`;
    const lambdaAdapterLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      'LambdaAdapterLayer',
      lambdaAdapterLayerArn,
    );

    // Lambda function (Node.js runtime + ZIP package)
    // Note: DSQL doesn't require VPC, so Lambda runs without VPC
    this.apiFunction = new lambda.Function(this, 'ApiFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'run.sh',
      code: lambda.Code.fromAsset(
        path.join(__dirname, '../../../../backend/dist/api'),
        {
          bundling: {
            image: lambda.Runtime.NODEJS_20_X.bundlingImage,
            command: [
              'bash',
              '-c',
              'cp -r /asset-input/* /asset-output/ && cd /asset-output && npm ci --omit=dev',
            ],
          },
        },
      ),
      layers: [lambdaAdapterLayer],
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      architecture: lambda.Architecture.ARM_64,
      environment: {
        // Lambda Web Adapter configuration
        AWS_LAMBDA_EXEC_WRAPPER: '/opt/bootstrap',
        AWS_LWA_INVOKE_MODE: 'response_stream',
        PORT: '3001',

        // Application configuration
        NODE_ENV: 'production',
        COGNITO_USER_POOL_ID: props.userPool.userPoolId,
        COGNITO_CLIENT_ID: props.userPool.userPoolProviderName,
        COGNITO_REGION: cdk.Stack.of(this).region,
        ARTICLES_TABLE: props.articlesTable.tableName,
        INTERACTIONS_TABLE: props.interactionsTable.tableName,
        CACHE_TABLE: props.cacheTable.tableName,
        CONTENT_BUCKET: props.contentBucket.bucketName,
        DSQL_CLUSTER_ID: props.dsqlClusterId,
      },
    });

    // Grant permissions
    props.articlesTable.grantReadWriteData(this.apiFunction);
    props.interactionsTable.grantReadWriteData(this.apiFunction);
    props.cacheTable.grantReadWriteData(this.apiFunction);
    props.contentBucket.grantReadWrite(this.apiFunction);

    // HTTP API Gateway
    const httpApi = new apigateway.HttpApi(this, 'HttpApi', {
      apiName: 'siftr-api',
      description: 'siftr API Gateway',
      corsPreflight: {
        allowOrigins: [process.env.FRONTEND_URL || '*'],
        allowMethods: [
          apigateway.CorsHttpMethod.GET,
          apigateway.CorsHttpMethod.POST,
          apigateway.CorsHttpMethod.PUT,
          apigateway.CorsHttpMethod.DELETE,
          apigateway.CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: ['Authorization', 'Content-Type'],
        allowCredentials: true,
      },
    });

    // Cognito JWT Authorizer
    const authorizer = new authorizers.HttpUserPoolAuthorizer(
      'CognitoAuthorizer',
      props.userPool,
      {
        // Note: HttpUserPoolAuthorizer expects IUserPoolClient[], but we only have the provider name
        // This is a known CDK limitation. Using type assertion is acceptable here.
        userPoolClients: [
          props.userPool
            .userPoolProviderName as unknown as cognito.IUserPoolClient,
        ],
        identitySource: ['$request.header.Authorization'],
      },
    );

    // Lambda integration
    const lambdaIntegration = new integrations.HttpLambdaIntegration(
      'LambdaIntegration',
      this.apiFunction,
    );

    // Routes
    httpApi.addRoutes({
      path: '/{proxy+}',
      methods: [apigateway.HttpMethod.ANY],
      integration: lambdaIntegration,
      authorizer,
    });

    // Health check route (no auth)
    httpApi.addRoutes({
      path: '/health',
      methods: [apigateway.HttpMethod.GET],
      integration: lambdaIntegration,
    });

    if (!httpApi.url) {
      throw new Error('HTTP API URL is not available');
    }
    this.apiUrl = httpApi.url;

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrlOutput', {
      value: this.apiUrl,
      exportName: 'SiftrApiUrl',
    });
  }
}
