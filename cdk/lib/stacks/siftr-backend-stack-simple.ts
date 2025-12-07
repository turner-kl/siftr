import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import type { Construct } from "constructs";
import * as path from "node:path";

export interface SiftrBackendStackSimpleProps extends cdk.StackProps {
  /**
   * Path to the backend build directory
   * Default: '../backend/dist'
   */
  buildPath?: string;

  /**
   * Environment variables for the Lambda function
   */
  environment?: Record<string, string>;
}

export class SiftrBackendStackSimple extends cdk.Stack {
  public readonly functionUrl: string;

  constructor(
    scope: Construct,
    id: string,
    props?: SiftrBackendStackSimpleProps
  ) {
    super(scope, id, props);

    // Lambda function with Hono app
    const honoFunction = new nodejs.NodejsFunction(this, "BackendNodejsFunction", {
      entry: path.join(__dirname, '../../../backend/src/api/index.ts'),
      handler: "run.sh",
      runtime: lambda.Runtime.NODEJS_24_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(15),
      layers: [
        // Lambda Web Adapter
        lambda.LayerVersion.fromLayerVersionArn(
          this,
          'WebAdapter',
          `arn:aws:lambda:${this.region}:753240598075:layer:LambdaAdapterLayerArm64:20`
        ),
      ],
      bundling: {
        minify: true,
        commandHooks: {
          beforeInstall: () => [],
          beforeBundling: () => [],
          // shファイルをコピーする
          afterBundling: (_inputDir: string, outputDir: string) => {
            const backendDir = path.join(__dirname, '../../../backend');
            return [`cp ${backendDir}/run.sh ${outputDir}`];
          },
        },
      },
      environment: {
        AWS_LAMBDA_EXEC_WRAPPER: "/opt/bootstrap",
        PORT: "3000",
        NODE_ENV: "production",
        USE_IN_MEMORY: "true",
        ...props?.environment,
      },
    });

    // Lambda Function URL with CORS
    const functionUrl = honoFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ["*"],
        allowedMethods: [lambda.HttpMethod.ALL],
        allowedHeaders: ["*"],
      },
    });

    this.functionUrl = functionUrl.url;

    // Outputs
    new cdk.CfnOutput(this, "FunctionUrl", {
      value: functionUrl.url,
      description: "Lambda Function URL",
      exportName: "SiftrBackendFunctionUrl",
    });
  }
}
