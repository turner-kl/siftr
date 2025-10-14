# siftr Infrastructure (CDK)

AWS CDK infrastructure definitions for siftr backend and frontend.

## Structure

```
cdk/
├── bin/
│   └── app.ts                          # CDK app entry point
├── lib/
│   ├── stacks/
│   │   ├── siftr-backend-stack.ts     # Backend stack
│   │   └── siftr-frontend-stack.ts    # Frontend stack
│   └── constructs/                     # Reusable constructs
│       ├── auth-construct.ts           # Cognito authentication
│       ├── storage-construct.ts        # S3 buckets
│       ├── database-construct.ts       # DynamoDB + Aurora
│       ├── api-construct.ts            # API Gateway + Lambda
│       ├── collector-construct.ts      # Content collector
│       ├── analyzer-construct.ts       # Content analyzer
│       └── frontend-construct.ts       # Next.js frontend
├── test/                               # CDK tests
├── package.json
├── tsconfig.json
├── biome.json
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

### Backend Stack (SiftrBackendStack)

#### AuthConstruct
- Cognito User Pool
- User Pool Client
- User Pool Domain

#### StorageConstruct
- S3 Content Bucket
- S3 Raw Content Bucket (with lifecycle rules)

#### DatabaseConstruct
- DynamoDB Articles Table (with GSIs)
- DynamoDB User Interactions Table
- DynamoDB Cache Table
- Aurora Serverless v2 (PostgreSQL)

#### ApiConstruct
- Lambda function (Docker image with Lambda Web Adapter)
- HTTP API Gateway
- Cognito JWT Authorizer

#### CollectorConstruct
- Collector Orchestrator Lambda
- EventBridge Schedule (every 15 minutes)

#### AnalyzerConstruct
- Analyzer Lambda
- SQS Analysis Queue
- DynamoDB Stream trigger

### Frontend Stack (SiftrFrontendStack)

#### FrontendConstruct
- **Lambda Function**: Next.js 15 SSR with Lambda Web Adapter
- **Function URL**: Direct Lambda access endpoint
- **S3 Bucket**: Static assets (_next/static, public files)
- **CloudFront Distribution**: CDN with caching and security headers
  - Origin: Lambda Function URL for SSR
  - Additional behaviors: S3 for static assets
  - Price Class: US, Canada, Europe
  - Security: TLS 1.2+, HSTS, CSP headers

## Outputs

### Backend Stack Outputs
- `UserPoolId`: Cognito User Pool ID
- `UserPoolClientId`: Cognito Client ID
- `ApiUrl`: API Gateway URL
- `ArticlesTableName`: DynamoDB table name
- `ContentBucketName`: S3 bucket name

### Frontend Stack Outputs
- `FrontendUrl`: CloudFront distribution URL (https://xxx.cloudfront.net)
- `DistributionId`: CloudFront distribution ID (for cache invalidation)
- `AssetsBucket`: S3 bucket for static assets
- `FunctionUrl`: Lambda Function URL (direct access)

## Environment Variables

Set these before deployment:

### Backend Stack
```bash
export FRONTEND_URL=https://your-frontend-domain.com
```

### Frontend Stack
```bash
# Path to Next.js build output (optional, defaults to ../frontend/.next/standalone)
export FRONTEND_BUILD_PATH=/path/to/frontend/.next/standalone

# Or use CDK context
cdk deploy -c frontendBuildPath=/path/to/frontend/.next/standalone
```

## Cost Estimation

See `docs/backend_design.md` for detailed cost breakdown.

Estimated monthly cost: **$82-235 USD**

## Frontend Deployment Workflow

### 1. Build Next.js Application

```bash
cd ../frontend
npm run build
```

This creates:
- `.next/standalone/` - Server code for Lambda
- `.next/static/` - Static assets for S3
- `public/` - Public assets for S3

### 2. Deploy Frontend Stack

```bash
cd ../cdk

# Option 1: Using environment variable
export FRONTEND_BUILD_PATH=../frontend/.next/standalone
npm run deploy SiftrFrontendStack

# Option 2: Using CDK context
cdk deploy SiftrFrontendStack -c frontendBuildPath=../frontend/.next/standalone

# Option 3: Use default path (../frontend/.next/standalone)
npm run deploy SiftrFrontendStack
```

### 3. Upload Static Assets to S3

```bash
# Get the S3 bucket name from stack outputs
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name siftr-frontend \
  --query 'Stacks[0].Outputs[?OutputKey==`AssetsBucket`].OutputValue' \
  --output text)

# Upload _next/static
aws s3 sync ../frontend/.next/static s3://$BUCKET_NAME/_next/static/

# Upload public assets
aws s3 sync ../frontend/public s3://$BUCKET_NAME/static/
```

### 4. Invalidate CloudFront Cache

```bash
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name siftr-frontend \
  --query 'Stacks[0].Outputs[?OutputKey==`DistributionId`].OutputValue' \
  --output text)

aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"
```

## Deployment Strategy

### Option 1: Deploy Both Stacks Together
```bash
npm run deploy
```

### Option 2: Deploy Stacks Separately
```bash
# Deploy backend first
cdk deploy SiftrBackendStack

# Deploy frontend (depends on backend outputs)
cdk deploy SiftrFrontendStack
```

### Option 3: Deploy Only Frontend
```bash
cdk deploy SiftrFrontendStack
```

## Notes

### Backend
- All resources have retention policies set to RETAIN for safety
- Database credentials are stored in Secrets Manager
- VPC is created with NAT Gateway for Lambda functions
- DynamoDB tables use On-Demand billing mode

### Frontend
- Next.js 15 standalone output is used for Lambda deployment
- Lambda Web Adapter enables running Next.js server on Lambda
- CloudFront provides global CDN with edge caching
- Static assets are served directly from S3 via CloudFront
- Function URL provides direct Lambda access (for testing/debugging)
