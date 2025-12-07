#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SiftrBackendStackSimple } from '../lib/stacks/siftr-backend-stack-simple';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'ap-northeast-1',
};

const environmentName = process.env.NODE_ENV || 'development';
const projectTags = {
  Project: 'siftr',
  Environment: environmentName,
};

// Simple Backend Stack (CloudFront + Lambda Function URL)
new SiftrBackendStackSimple(app, 'SiftrBackendStack', {
  env,
  stackName: 'siftr-backend',
  description: 'siftr - Backend API (CloudFront + Lambda Function URL)',
  tags: projectTags,
  environment: {
    NODE_ENV: 'production',
    USE_IN_MEMORY: 'true',
  },
});
