import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import type { Construct } from 'constructs';

export class StorageConstruct extends Construct {
  public readonly contentBucket: s3.Bucket;
  public readonly rawContentBucket: s3.Bucket;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Content Bucket (processed content)
    this.contentBucket = new s3.Bucket(this, 'ContentBucket', {
      bucketName: `siftr-content-${cdk.Stack.of(this).account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'DeleteOldContent',
          expiration: cdk.Duration.days(90),
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 3600,
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    // Raw Content Bucket (original HTML)
    this.rawContentBucket = new s3.Bucket(this, 'RawContentBucket', {
      bucketName: `siftr-raw-content-${cdk.Stack.of(this).account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'TransitionToIA',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
        {
          id: 'DeleteOldRawContent',
          expiration: cdk.Duration.days(180),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    // Outputs
    new cdk.CfnOutput(this, 'ContentBucketNameOutput', {
      value: this.contentBucket.bucketName,
      exportName: 'SiftrContentBucketName',
    });

    new cdk.CfnOutput(this, 'RawContentBucketNameOutput', {
      value: this.rawContentBucket.bucketName,
      exportName: 'SiftrRawContentBucketName',
    });
  }
}
