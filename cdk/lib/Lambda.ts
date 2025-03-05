
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as path from "path";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import { Duration, RemovalPolicy } from "aws-cdk-lib";
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';

export class LambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create S3 buckets
    const trainingBucket = new s3.Bucket(this, "TrainingDataBucket", {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Add this output bucket
    const outputBucket = new s3.Bucket(this, "SageMakerOutputBucket", {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const sagemakerRole = new iam.Role(this, "SageMakerExecutionRole", {
      assumedBy: new iam.ServicePrincipal("sagemaker.amazonaws.com")
    });

    trainingBucket.grantRead(sagemakerRole);
    outputBucket.grantReadWrite(sagemakerRole);
    

    const dockerImageAsset = new DockerImageAsset(this, 'TrainingLambdaImage', {
      directory: path.join(__dirname, '../trainingjob'),
    });
    
    const trainingLambda = new lambda.DockerImageFunction(this, 'TrainingLambda', {
      code: lambda.DockerImageCode.fromEcr(dockerImageAsset.repository, {
        tag: dockerImageAsset.imageTag,
      }),
      environment: {
        S3_BUCKET_NAME: trainingBucket.bucketName,
        SAGEMAKER_ROLE: sagemakerRole.roleArn,
        SAGEMAKER_OUTPUT_BUCKET: outputBucket.bucketName, // Now using valid reference
      },
      timeout: Duration.minutes(15),
      memorySize: 1024,
    });

    // Add permissions
    trainingLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'sagemaker:CreateTrainingJob',
        'sagemaker:DescribeTrainingJob',
        's3:GetObject',
        's3:PutObject'
      ],
      resources: ['*']
    }));

    trainingLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ["iam:PassRole"],
      resources: [sagemakerRole.roleArn], // Only allow passing this specific role
      conditions: {
        StringEquals: {
          "iam:PassedToService": "sagemaker.amazonaws.com"
        }
      }
    }));

    
    // Cloudwatch

    // For Lambda Role
    trainingLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ["logs:DescribeLogStreams", "logs:GetLogEvents"],
      resources: [`arn:aws:logs:${this.region}:${this.account}:log-group:/aws/sagemaker/TrainingJobs:*`]
    }));
    // For SageMaker Role
    sagemakerRole.addToPolicy(new iam.PolicyStatement({
      actions: ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
      resources: ["*"]
    }));




    // Grant permissions to both buckets
    trainingBucket.grantReadWrite(trainingLambda);
    outputBucket.grantReadWrite(trainingLambda);

    trainingLambda.addEventSource(
      new lambdaEventSources.S3EventSource(trainingBucket, {
        events: [s3.EventType.OBJECT_CREATED],
      })
    );

    // Output the bucket names
    new cdk.CfnOutput(this, "TrainingBucketName", {
      value: trainingBucket.bucketName,
    });

    new cdk.CfnOutput(this, "OutputBucketName", {
      value: outputBucket.bucketName,
    });

    new cdk.CfnOutput(this, "TrainingLambdaArn", {
      value: trainingLambda.functionArn,
    });
  }
}
