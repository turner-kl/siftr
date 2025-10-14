import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import type * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface DatabaseConstructProps {
  vpc: ec2.IVpc;
}

export class DatabaseConstruct extends Construct {
  public readonly articlesTable: dynamodb.Table;
  public readonly interactionsTable: dynamodb.Table;
  public readonly cacheTable: dynamodb.Table;
  public readonly dbCluster: rds.DatabaseCluster;
  public readonly dbSecret: secretsmanager.ISecret;

  constructor(scope: Construct, id: string, props: DatabaseConstructProps) {
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

    // Aurora Serverless v2 (DSQL alternative)
    // Note: Aurora DSQL is not yet available in CDK, using Serverless v2 instead

    // DB Security Group
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DBSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for Aurora database',
      allowAllOutbound: true,
    });

    dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from VPC',
    );

    // DB Credentials
    const dbCredentials = rds.Credentials.fromGeneratedSecret('postgres', {
      secretName: 'siftr/db/credentials',
    });

    // Aurora Cluster
    this.dbCluster = new rds.DatabaseCluster(this, 'DBCluster', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_16_4,
      }),
      credentials: dbCredentials,
      defaultDatabaseName: 'siftr',
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [dbSecurityGroup],
      writer: rds.ClusterInstance.serverlessV2('writer', {
        autoMinorVersionUpgrade: true,
      }),
      readers: [
        rds.ClusterInstance.serverlessV2('reader1', {
          scaleWithWriter: true,
          autoMinorVersionUpgrade: true,
        }),
      ],
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: 2,
      backup: {
        retention: cdk.Duration.days(7),
        preferredWindow: '03:00-04:00',
      },
      cloudwatchLogsExports: ['postgresql'],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Verify that the database secret was created
    if (!this.dbCluster.secret) {
      throw new Error('Database cluster secret was not created');
    }
    this.dbSecret = this.dbCluster.secret;

    // Outputs
    new cdk.CfnOutput(this, 'ArticlesTableNameOutput', {
      value: this.articlesTable.tableName,
      exportName: 'SiftrArticlesTableName',
    });

    new cdk.CfnOutput(this, 'DBClusterEndpointOutput', {
      value: this.dbCluster.clusterEndpoint.hostname,
      exportName: 'SiftrDBClusterEndpoint',
    });

    new cdk.CfnOutput(this, 'DBSecretArnOutput', {
      value: this.dbSecret.secretArn,
      exportName: 'SiftrDBSecretArn',
    });
  }
}
