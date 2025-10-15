import * as cdk from 'aws-cdk-lib';
import type * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import type * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface CollectorConstructProps {
  articlesTable: dynamodb.Table;
  contentBucket: s3.Bucket;
  dsqlClusterId: string;
}

export class CollectorConstruct extends Construct {
  constructor(scope: Construct, id: string, props: CollectorConstructProps) {
    super(scope, id);

    // Collector Orchestrator Lambda
    const orchestratorFunction = new lambda.Function(
      this,
      'OrchestratorFunction',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset('lambda/collector-orchestrator'),
        timeout: cdk.Duration.minutes(1),
        environment: {
          ARTICLES_TABLE: props.articlesTable.tableName,
          CONTENT_BUCKET: props.contentBucket.bucketName,
          DSQL_CLUSTER_ID: props.dsqlClusterId,
        },
      },
    );

    // Grant permissions
    props.articlesTable.grantReadWriteData(orchestratorFunction);
    props.contentBucket.grantReadWrite(orchestratorFunction);

    // EventBridge Schedule (every 15 minutes)
    new events.Rule(this, 'CollectionSchedule', {
      schedule: events.Schedule.rate(cdk.Duration.minutes(15)),
      targets: [new targets.LambdaFunction(orchestratorFunction)],
    });

    // TODO: Implement individual collectors (RSS, Twitter, Reddit, etc.)
  }
}
