import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import type { Construct } from 'constructs';

export interface CollectorConstructProps {
  vpc: ec2.IVpc;
  articlesTable: dynamodb.Table;
  contentBucket: s3.Bucket;
  dbCluster: rds.DatabaseCluster;
}

export class CollectorConstruct extends Construct {
  constructor(scope: Construct, id: string, props: CollectorConstructProps) {
    super(scope, id);

    // Collector Orchestrator Lambda
    const orchestratorFunction = new lambda.Function(this, 'OrchestratorFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/collector-orchestrator'),
      vpc: props.vpc,
      timeout: cdk.Duration.minutes(1),
      environment: {
        ARTICLES_TABLE: props.articlesTable.tableName,
        CONTENT_BUCKET: props.contentBucket.bucketName,
        DB_SECRET_ARN: props.dbCluster.secret!.secretArn,
      },
    });

    // Grant permissions
    props.articlesTable.grantReadWriteData(orchestratorFunction);
    props.contentBucket.grantReadWrite(orchestratorFunction);
    props.dbCluster.secret!.grantRead(orchestratorFunction);
    props.dbCluster.connections.allowDefaultPortFrom(orchestratorFunction);

    // EventBridge Schedule (every 15 minutes)
    new events.Rule(this, 'CollectionSchedule', {
      schedule: events.Schedule.rate(cdk.Duration.minutes(15)),
      targets: [new targets.LambdaFunction(orchestratorFunction)],
    });

    // TODO: Implement individual collectors (RSS, Twitter, Reddit, etc.)
  }
}
