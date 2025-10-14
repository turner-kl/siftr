import * as cdk from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import { AuthConstruct } from '../constructs/auth-construct';
import { DatabaseConstruct } from '../constructs/database-construct';
import { StorageConstruct } from '../constructs/storage-construct';
import { ApiConstruct } from '../constructs/api-construct';
import { CollectorConstruct } from '../constructs/collector-construct';
import { AnalyzerConstruct } from '../constructs/analyzer-construct';

export class SiftrStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC (optional - for Aurora DSQL if needed)
    const vpc = new cdk.aws_ec2.Vpc(this, 'VPC', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: cdk.aws_ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'Isolated',
          subnetType: cdk.aws_ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // Authentication
    const auth = new AuthConstruct(this, 'Auth', {
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    });

    // Storage
    const storage = new StorageConstruct(this, 'Storage');

    // Database
    const database = new DatabaseConstruct(this, 'Database', {
      vpc,
    });

    // API
    const api = new ApiConstruct(this, 'API', {
      vpc,
      userPool: auth.userPool,
      articlesTable: database.articlesTable,
      interactionsTable: database.interactionsTable,
      cacheTable: database.cacheTable,
      contentBucket: storage.contentBucket,
      dbCluster: database.dbCluster,
    });

    // Collector
    const collector = new CollectorConstruct(this, 'Collector', {
      vpc,
      articlesTable: database.articlesTable,
      contentBucket: storage.contentBucket,
      dbCluster: database.dbCluster,
    });

    // Analyzer
    const analyzer = new AnalyzerConstruct(this, 'Analyzer', {
      vpc,
      articlesTable: database.articlesTable,
      contentBucket: storage.contentBucket,
      dbCluster: database.dbCluster,
    });

    // Outputs
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: auth.userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: auth.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.apiUrl,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'ArticlesTableName', {
      value: database.articlesTable.tableName,
      description: 'DynamoDB Articles Table Name',
    });

    new cdk.CfnOutput(this, 'ContentBucketName', {
      value: storage.contentBucket.bucketName,
      description: 'S3 Content Bucket Name',
    });
  }
}
