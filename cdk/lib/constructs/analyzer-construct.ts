import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as eventsources from 'aws-cdk-lib/aws-lambda-event-sources';
import type { Construct } from 'constructs';

export interface AnalyzerConstructProps {
  vpc: ec2.IVpc;
  articlesTable: dynamodb.Table;
  contentBucket: s3.Bucket;
  dbCluster: rds.DatabaseCluster;
}

export class AnalyzerConstruct extends Construct {
  constructor(scope: Construct, id: string, props: AnalyzerConstructProps) {
    super(scope, id);

    // Analysis Queue
    const analysisQueue = new sqs.Queue(this, 'AnalysisQueue', {
      queueName: 'siftr-analysis-queue',
      visibilityTimeout: cdk.Duration.minutes(5),
      retentionPeriod: cdk.Duration.days(7),
      deadLetterQueue: {
        queue: new sqs.Queue(this, 'AnalysisDLQ', {
          queueName: 'siftr-analysis-dlq',
          retentionPeriod: cdk.Duration.days(14),
        }),
        maxReceiveCount: 3,
      },
    });

    // Analyzer Lambda
    const analyzerFunction = new lambda.Function(this, 'AnalyzerFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/analyzer'),
      vpc: props.vpc,
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
      environment: {
        ARTICLES_TABLE: props.articlesTable.tableName,
        CONTENT_BUCKET: props.contentBucket.bucketName,
        DB_SECRET_ARN: props.dbCluster.secret!.secretArn,
        OPENAI_API_KEY_SECRET: 'siftr/openai-api-key',
        ANTHROPIC_API_KEY_SECRET: 'siftr/anthropic-api-key',
      },
    });

    // Grant permissions
    props.articlesTable.grantReadWriteData(analyzerFunction);
    props.contentBucket.grantRead(analyzerFunction);
    props.dbCluster.secret!.grantRead(analyzerFunction);
    props.dbCluster.connections.allowDefaultPortFrom(analyzerFunction);

    // SQS trigger
    analyzerFunction.addEventSource(
      new eventsources.SqsEventSource(analysisQueue, {
        batchSize: 1,
        maxBatchingWindow: cdk.Duration.seconds(10),
      })
    );

    // DynamoDB Stream trigger (new articles)
    analyzerFunction.addEventSource(
      new eventsources.DynamoEventSource(props.articlesTable, {
        startingPosition: lambda.StartingPosition.LATEST,
        filters: [
          lambda.FilterCriteria.filter({
            eventName: lambda.FilterRule.isEqual('INSERT'),
          }),
        ],
        batchSize: 10,
        maxBatchingWindow: cdk.Duration.seconds(30),
      })
    );

    // TODO: Implement individual analyzers (Summarizer, Categorizer, etc.)
  }
}
