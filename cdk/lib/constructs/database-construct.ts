import * as cdk from 'aws-cdk-lib';
import * as dsql from 'aws-cdk-lib/aws-dsql';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export type DatabaseConstructProps = Record<string, never>;

export class DatabaseConstruct extends Construct {
  public readonly articlesTable: dynamodb.Table;
  public readonly interactionsTable: dynamodb.Table;
  public readonly cacheTable: dynamodb.Table;
  public readonly dsqlCluster: dsql.CfnCluster;
  public readonly dsqlClusterId: string;

  constructor(scope: Construct, id: string, _props: DatabaseConstructProps) {
    super(scope, id);

    // DynamoDB Tables

    // Articles Table
    this.articlesTable = new dynamodb.Table(this, 'ArticlesTable', {
      tableName: 'siftr-articles',
      partitionKey: {
        name: 'article_id',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'collected_at',
        type: dynamodb.AttributeType.NUMBER,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      stream: dynamodb.StreamViewType.NEW_IMAGE,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    this.articlesTable.addGlobalSecondaryIndex({
      indexName: 'UserCategoryIndex',
      partitionKey: {
        name: 'user_id',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'collected_at',
        type: dynamodb.AttributeType.NUMBER,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.articlesTable.addGlobalSecondaryIndex({
      indexName: 'UserPriorityIndex',
      partitionKey: {
        name: 'user_id',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'priority_score',
        type: dynamodb.AttributeType.NUMBER,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // User Interactions Table
    this.interactionsTable = new dynamodb.Table(this, 'InteractionsTable', {
      tableName: 'siftr-user-interactions',
      partitionKey: {
        name: 'user_id',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'interaction_id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    this.interactionsTable.addGlobalSecondaryIndex({
      indexName: 'ArticleInteractionIndex',
      partitionKey: {
        name: 'article_id',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'interacted_at',
        type: dynamodb.AttributeType.NUMBER,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Cache Table
    this.cacheTable = new dynamodb.Table(this, 'CacheTable', {
      tableName: 'siftr-cache',
      partitionKey: {
        name: 'cache_key',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Aurora DSQL Cluster
    // Note: DSQL is serverless and doesn't require VPC, security groups, or manual scaling
    this.dsqlCluster = new dsql.CfnCluster(this, 'DSQLCluster', {
      deletionProtectionEnabled: true,
      tags: [
        {
          key: 'Name',
          value: 'siftr-dsql-cluster',
        },
        {
          key: 'Environment',
          value: cdk.Stack.of(this).stackName,
        },
      ],
    });

    // Store cluster ID for use in other constructs
    this.dsqlClusterId = this.dsqlCluster.ref;

    // Outputs
    new cdk.CfnOutput(this, 'ArticlesTableNameOutput', {
      value: this.articlesTable.tableName,
      exportName: 'SiftrArticlesTableName',
    });

    new cdk.CfnOutput(this, 'DSQLClusterIdOutput', {
      value: this.dsqlClusterId,
      description: 'Aurora DSQL Cluster ID',
      exportName: 'SiftrDSQLClusterId',
    });
  }
}
