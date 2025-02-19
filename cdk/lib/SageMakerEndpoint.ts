import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as sagemaker from "aws-cdk-lib/aws-sagemaker";
import * as iam from "aws-cdk-lib/aws-iam";

export class SageMakerEndpointStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create IAM Role for SageMaker (Ensuring Correct Account)
    const sagemakerRole = new iam.Role(this, "SageMakerExecutionRole", {
      assumedBy: new iam.ServicePrincipal("sagemaker.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSageMakerFullAccess"),
      ],
    });

    // Allow SageMaker to Pass the Role
    sagemakerRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["iam:PassRole"],
        resources: [sagemakerRole.roleArn],
      })
    );

    //  Create SageMaker Model
    const sagemakerModel = new sagemaker.CfnModel(this, "SageMakerModel", {
      executionRoleArn: sagemakerRole.roleArn,
      primaryContainer: {
        image: "341280168497.dkr.ecr.ca-central-1.amazonaws.com/sagemaker-scikit-learn:0.23-1-cpu-py3",
        modelDataUrl: "s3://my-bucket/model.tar.gz",
      },
    });

    // Create SageMaker Endpoint Config
    const endpointConfig = new sagemaker.CfnEndpointConfig(this, "SageMakerEndpointConfig", {
      productionVariants: [
        {
          modelName: sagemakerModel.attrModelName,
          instanceType: "ml.m5.large",
          initialInstanceCount: 1,
          variantName: "AllTraffic",
        },
      ],
    });

    // Create SageMaker Endpoint
    new sagemaker.CfnEndpoint(this, "SageMakerEndpoint", {
      endpointConfigName: endpointConfig.attrEndpointConfigName,
    });
  }
}
