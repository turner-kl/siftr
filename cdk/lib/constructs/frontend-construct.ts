import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface FrontendConstructProps {
  /**
   * Path to the Next.js build output directory (required)
   */
  readonly buildPath: string;

  /**
   * Domain name for the frontend (optional)
   */
  readonly domainName?: string;

  /**
   * Certificate ARN for CloudFront (required if domainName is provided)
   */
  readonly certificateArn?: string;

  /**
   * Environment variables for the Lambda function
   */
  readonly environment?: Record<string, string>;
}

export class FrontendConstruct extends Construct {
  public readonly distribution: cloudfront.Distribution;
  public readonly assetsBucket: s3.Bucket;
  public readonly serverFunction: lambda.Function;
  public readonly functionUrl: lambda.FunctionUrl;

  constructor(scope: Construct, id: string, props: FrontendConstructProps) {
    super(scope, id);

    // S3 Bucket for static assets (_next/static, public files)
    this.assetsBucket = new s3.Bucket(this, 'AssetsBucket', {
      bucketName: `siftr-frontend-assets-${cdk.Stack.of(this).account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 3600,
        },
      ],
    });

    // Lambda function with Next.js 15 + Lambda Web Adapter
    this.serverFunction = new lambda.Function(this, 'ServerFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'run.sh',
      code: lambda.Code.fromAsset(props.buildPath, {
        bundling: {
          image: lambda.Runtime.NODEJS_20_X.bundlingImage,
          command: ['bash', '-c', 'cp -r /asset-input/* /asset-output/'],
        },
      }),
      memorySize: 1024,
      timeout: cdk.Duration.seconds(30),
      environment: {
        NODE_ENV: 'production',
        // Lambda Web Adapter environment variables
        AWS_LAMBDA_EXEC_WRAPPER: '/opt/bootstrap',
        PORT: '3000',
        ...props?.environment,
      },
      layers: [
        // Lambda Web Adapter Layer
        lambda.LayerVersion.fromLayerVersionArn(
          this,
          'LambdaAdapterLayer',
          `arn:aws:lambda:${cdk.Stack.of(this).region}:753240598075:layer:LambdaAdapterLayerX86:24`,
        ),
      ],
    });

    // Grant S3 read access to Lambda
    this.assetsBucket.grantRead(this.serverFunction);

    // Function URL for direct Lambda access
    this.functionUrl = this.serverFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: [lambda.HttpMethod.ALL],
        allowedHeaders: ['*'],
      },
    });

    // CloudFront Distribution
    const cachePolicy = new cloudfront.CachePolicy(this, 'CachePolicy', {
      cachePolicyName: `siftr-frontend-cache-${cdk.Stack.of(this).account}`,
      comment: 'Cache policy for siftr frontend',
      defaultTtl: cdk.Duration.days(1),
      minTtl: cdk.Duration.seconds(0),
      maxTtl: cdk.Duration.days(365),
      cookieBehavior: cloudfront.CacheCookieBehavior.none(),
      headerBehavior: cloudfront.CacheHeaderBehavior.none(),
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
    });

    // Origin Request Policy for Lambda Function URL
    const originRequestPolicy = new cloudfront.OriginRequestPolicy(
      this,
      'OriginRequestPolicy',
      {
        originRequestPolicyName: `siftr-frontend-origin-${cdk.Stack.of(this).account}`,
        comment: 'Origin request policy for siftr frontend',
        cookieBehavior: cloudfront.OriginRequestCookieBehavior.all(),
        headerBehavior: cloudfront.OriginRequestHeaderBehavior.allowList(
          'Accept',
          'Accept-Language',
          'Content-Type',
          'Referer',
          'User-Agent',
        ),
        queryStringBehavior: cloudfront.OriginRequestQueryStringBehavior.all(),
      },
    );

    // Response Headers Policy
    const responseHeadersPolicy = new cloudfront.ResponseHeadersPolicy(
      this,
      'ResponseHeadersPolicy',
      {
        responseHeadersPolicyName: `siftr-frontend-headers-${cdk.Stack.of(this).account}`,
        comment: 'Security headers for siftr frontend',
        securityHeadersBehavior: {
          contentTypeOptions: { override: true },
          frameOptions: {
            frameOption: cloudfront.HeadersFrameOption.DENY,
            override: true,
          },
          referrerPolicy: {
            referrerPolicy:
              cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
            override: true,
          },
          strictTransportSecurity: {
            accessControlMaxAge: cdk.Duration.seconds(31536000),
            includeSubdomains: true,
            override: true,
          },
          xssProtection: { protection: true, modeBlock: true, override: true },
        },
      },
    );

    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      comment: 'siftr frontend distribution',
      defaultBehavior: {
        origin: new origins.HttpOrigin(
          cdk.Fn.select(2, cdk.Fn.split('/', this.functionUrl.url)),
          {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
            customHeaders: {
              'X-Forwarded-Host': props?.domainName || '',
            },
          },
        ),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cachePolicy,
        originRequestPolicy: originRequestPolicy,
        responseHeadersPolicy: responseHeadersPolicy,
        compress: true,
      },
      additionalBehaviors: {
        // Static assets from S3
        '_next/static/*': {
          origin: new origins.S3Origin(this.assetsBucket),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          compress: true,
        },
        'static/*': {
          origin: new origins.S3Origin(this.assetsBucket),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          compress: true,
        },
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // US, Canada, Europe
      enableIpv6: true,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
    });

    // Outputs
    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: this.distribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name',
      exportName: 'SiftrFrontendDomain',
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: this.distribution.distributionId,
      description: 'CloudFront Distribution ID',
    });

    new cdk.CfnOutput(this, 'FunctionUrl', {
      value: this.functionUrl.url,
      description: 'Lambda Function URL',
    });

    new cdk.CfnOutput(this, 'AssetsBucketName', {
      value: this.assetsBucket.bucketName,
      description: 'S3 Assets Bucket Name',
    });
  }
}
