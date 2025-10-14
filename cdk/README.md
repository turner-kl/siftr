# siftr Infrastructure (CDK)

AWS CDK infrastructure definitions for siftr backend.

## Structure

```
cdk/
├── bin/
│   └── app.ts                 # CDK app entry point
├── lib/
│   ├── stacks/
│   │   └── siftr-stack.ts    # Main stack
│   └── constructs/           # Reusable constructs
│       ├── auth-construct.ts
│       ├── storage-construct.ts
│       ├── database-construct.ts
│       ├── api-construct.ts
│       ├── collector-construct.ts
│       └── analyzer-construct.ts
├── test/                      # CDK tests
├── package.json
├── tsconfig.json
└── cdk.json
```

## Prerequisites

- AWS CLI configured with credentials
- Node.js 20+
- CDK CLI: `npm install -g aws-cdk`

## Deployment

### 1. Bootstrap (first time only)

```bash
cd cdk
npm install
npm run bootstrap
```

### 2. Deploy

```bash
# Check what will be deployed
npm run diff

# Deploy all stacks
npm run deploy
```

### 3. Destroy (cleanup)

```bash
cdk destroy
```

## Stack Components

### AuthConstruct
- Cognito User Pool
- User Pool Client
- User Pool Domain

### StorageConstruct
- S3 Content Bucket
- S3 Raw Content Bucket (with lifecycle rules)

### DatabaseConstruct
- DynamoDB Articles Table (with GSIs)
- DynamoDB User Interactions Table
- DynamoDB Cache Table
- Aurora Serverless v2 (PostgreSQL)

### ApiConstruct
- Lambda function (Docker image with Lambda Web Adapter)
- HTTP API Gateway
- Cognito JWT Authorizer

### CollectorConstruct
- Collector Orchestrator Lambda
- EventBridge Schedule (every 15 minutes)

### AnalyzerConstruct
- Analyzer Lambda
- SQS Analysis Queue
- DynamoDB Stream trigger

## Outputs

After deployment, you'll see:
- `UserPoolId`: Cognito User Pool ID
- `UserPoolClientId`: Cognito Client ID
- `ApiUrl`: API Gateway URL
- `ArticlesTableName`: DynamoDB table name
- `ContentBucketName`: S3 bucket name

## Environment Variables

Set these before deployment:
```bash
export FRONTEND_URL=https://your-frontend-domain.com
```

## Cost Estimation

See `docs/backend_design.md` for detailed cost breakdown.

Estimated monthly cost: **$82-235 USD**

## Notes

- All resources have retention policies set to RETAIN for safety
- Database credentials are stored in Secrets Manager
- VPC is created with NAT Gateway for Lambda functions
- DynamoDB tables use On-Demand billing mode
