#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SiftrStack } from '../lib/stacks/siftr-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'ap-northeast-1',
};

new SiftrStack(app, 'SiftrStack', {
  env,
  stackName: 'siftr',
  description: 'siftr - AI-driven personalized information curation system',
  tags: {
    Project: 'siftr',
    Environment: process.env.NODE_ENV || 'development',
  },
});

app.synth();
