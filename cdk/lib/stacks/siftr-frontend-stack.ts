import * as cdk from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import { FrontendConstruct } from '../constructs/frontend-construct';

export interface SiftrFrontendStackProps extends cdk.StackProps {
  /**
   * Path to the Next.js build output directory (required)
   */
  readonly buildPath: string;

  /**
   * API Gateway URL from the backend stack
   */
  readonly apiUrl?: string;

  /**
   * Cognito User Pool ID from the backend stack
   */
  readonly userPoolId?: string;

  /**
   * Cognito User Pool Client ID from the backend stack
   */
  readonly userPoolClientId?: string;

  /**
   * Domain name for the frontend (optional)
   */
  readonly domainName?: string;

  /**
   * Certificate ARN for CloudFront (required if domainName is provided)
   */
  readonly certificateArn?: string;
}

export class SiftrFrontendStack extends cdk.Stack {
  public readonly frontend: FrontendConstruct;

  constructor(scope: Construct, id: string, props: SiftrFrontendStackProps) {
    super(scope, id, props);

    // Frontend Infrastructure
    this.frontend = new FrontendConstruct(this, 'Frontend', {
      buildPath: props.buildPath,
      domainName: props.domainName,
      certificateArn: props.certificateArn,
      environment: {
        // Backend API configuration
        NEXT_PUBLIC_API_URL: props.apiUrl || '',
        NEXT_PUBLIC_USER_POOL_ID: props.userPoolId || '',
        NEXT_PUBLIC_USER_POOL_CLIENT_ID: props.userPoolClientId || '',

        // AWS Region
        NEXT_PUBLIC_AWS_REGION: this.region,

        // Additional environment variables can be added here
      },
    });

    // Stack Outputs
    new cdk.CfnOutput(this, 'FrontendUrl', {
      value: `https://${this.frontend.distribution.distributionDomainName}`,
      description: 'Frontend URL (CloudFront)',
      exportName: 'SiftrFrontendUrl',
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: this.frontend.distribution.distributionId,
      description: 'CloudFront Distribution ID (for cache invalidation)',
    });

    new cdk.CfnOutput(this, 'AssetsBucket', {
      value: this.frontend.assetsBucket.bucketName,
      description: 'S3 Bucket for static assets',
    });
  }
}
