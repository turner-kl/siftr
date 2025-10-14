#!/bin/bash
set -e

echo "🚀 Setting up local development environment..."

# Create .env if it doesn't exist
if [ ! -f .env ]; then
  echo "📝 Creating .env from .env.example..."
  cp .env.example .env
fi

# Start Docker services
echo "🐳 Starting Docker services..."
docker compose up -d postgres dynamodb localstack

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 5

# Setup DynamoDB tables
echo "📊 Creating DynamoDB tables..."
docker compose exec -T dynamodb aws dynamodb create-table \
  --table-name siftr-articles \
  --attribute-definitions \
    AttributeName=article_id,AttributeType=S \
    AttributeName=collected_at,AttributeType=N \
    AttributeName=user_id,AttributeType=S \
    AttributeName=priority_score,AttributeType=N \
  --key-schema \
    AttributeName=article_id,KeyType=HASH \
    AttributeName=collected_at,KeyType=RANGE \
  --global-secondary-indexes \
    "[{\"IndexName\":\"UserCategoryIndex\",\"KeySchema\":[{\"AttributeName\":\"user_id\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"collected_at\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"},\"ProvisionedThroughput\":{\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}}]" \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --endpoint-url http://localhost:8000 \
  --region ap-northeast-1 || echo "Table may already exist"

docker compose exec -T dynamodb aws dynamodb create-table \
  --table-name siftr-user-interactions \
  --attribute-definitions \
    AttributeName=user_id,AttributeType=S \
    AttributeName=interaction_id,AttributeType=S \
  --key-schema \
    AttributeName=user_id,KeyType=HASH \
    AttributeName=interaction_id,KeyType=RANGE \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --endpoint-url http://localhost:8000 \
  --region ap-northeast-1 || echo "Table may already exist"

docker compose exec -T dynamodb aws dynamodb create-table \
  --table-name siftr-cache \
  --attribute-definitions \
    AttributeName=cache_key,AttributeType=S \
  --key-schema \
    AttributeName=cache_key,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --endpoint-url http://localhost:8000 \
  --region ap-northeast-1 || echo "Table may already exist"

# Setup S3 buckets
echo "🪣 Creating S3 buckets..."
docker compose exec -T localstack awslocal s3 mb s3://siftr-content || echo "Bucket may already exist"
docker compose exec -T localstack awslocal s3 mb s3://siftr-raw-content || echo "Bucket may already exist"

echo "✅ Local environment setup complete!"
echo ""
echo "📌 Services running:"
echo "  - PostgreSQL:       http://localhost:5432"
echo "  - DynamoDB:         http://localhost:8000"
echo "  - DynamoDB Admin:   http://localhost:8001"
echo "  - LocalStack:       http://localhost:4566"
echo "  - pgAdmin:          http://localhost:5050 (admin@siftr.local / admin)"
echo ""
echo "🔧 Next steps:"
echo "  1. Install dependencies:  npm install"
echo "  2. Start API server:      npm run dev"
echo "  3. Run tests:             npm test"
