#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SiftrBackendStack } from '../lib/stacks/siftr-backend-stack';
import { SiftrFrontendStack } from '../lib/stacks/siftr-frontend-stack';

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

// Backend Stack
const backendStack = new SiftrBackendStack(app, 'SiftrBackendStack', {
  env,
  stackName: 'siftr-backend',
  description: 'siftr - Backend infrastructure (API, Database, Auth)',
  tags: projectTags,
});

// Frontend Stack
const frontendStack = new SiftrFrontendStack(app, 'SiftrFrontendStack', {
  env,
  stackName: 'siftr-frontend',
  description: 'siftr - Frontend infrastructure (Next.js, CloudFront, Lambda)',
  tags: projectTags,
  // Build path (should be provided via environment variable or context)
  buildPath:
    process.env.FRONTEND_BUILD_PATH ||
    app.node.tryGetContext('frontendBuildPath') ||
    '../frontend/.next/standalone',
  // Pass backend outputs to frontend (can be retrieved via CloudFormation exports or cross-stack references)
  apiUrl: backendStack.apiUrl,
  userPoolId: backendStack.userPoolId,
  userPoolClientId: backendStack.userPoolClientId,
});

// Frontend depends on backend
frontendStack.addDependency(backendStack);

app.synth();
