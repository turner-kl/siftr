import * as cdk from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import { AnalyzerConstruct } from '../constructs/analyzer-construct';
import { ApiConstruct } from '../constructs/api-construct';
import { AuthConstruct } from '../constructs/auth-construct';
import { CollectorConstruct } from '../constructs/collector-construct';
import { DatabaseConstruct } from '../constructs/database-construct';
import { StorageConstruct } from '../constructs/storage-construct';

export class SiftrBackendStack extends cdk.Stack {
  public readonly apiUrl: string;
  public readonly userPoolId: string;
  public readonly userPoolClientId: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Note: Aurora DSQL doesn't require VPC - it's a fully managed serverless database

    // Authentication
    const auth = new AuthConstruct(this, 'Auth', {
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    });

    // Storage
    const storage = new StorageConstruct(this, 'Storage');

    // Database (Aurora DSQL)
    const database = new DatabaseConstruct(this, 'Database', {});

    // API
    const api = new ApiConstruct(this, 'API', {
      userPool: auth.userPool,
      articlesTable: database.articlesTable,
      interactionsTable: database.interactionsTable,
      cacheTable: database.cacheTable,
      contentBucket: storage.contentBucket,
      dsqlClusterId: database.dsqlClusterId,
    });

    // Collector
    new CollectorConstruct(this, 'Collector', {
      articlesTable: database.articlesTable,
      contentBucket: storage.contentBucket,
      dsqlClusterId: database.dsqlClusterId,
    });

    // Analyzer
    new AnalyzerConstruct(this, 'Analyzer', {
      articlesTable: database.articlesTable,
      contentBucket: storage.contentBucket,
      dsqlClusterId: database.dsqlClusterId,
    });

    // Store values for cross-stack references
    this.apiUrl = api.apiUrl;
    this.userPoolId = auth.userPool.userPoolId;
    this.userPoolClientId = auth.userPoolClient.userPoolClientId;

    // Outputs
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: auth.userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: 'SiftrUserPoolId',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: auth.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: 'SiftrUserPoolClientId',
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.apiUrl,
      description: 'API Gateway URL',
      exportName: 'SiftrApiUrl',
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
