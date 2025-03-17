import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class SageMakerEndpointStack extends cdk.Stack {
  public readonly sagemakerEndpointName: string;  // Expose SageMaker endpoint name

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


       //  Define the SageMaker endpoint name (Replace this with actual logic if needed)
       this.sagemakerEndpointName = 'medical-inference-endpoint'; //  Replace with actual endpoint name

       // Output the endpoint name so it can be used in InferenceLambdaStack
       new cdk.CfnOutput(this, 'SageMakerEndpointOutput', {
         value: this.sagemakerEndpointName,
         exportName: 'SageMakerEndpointName',  //  Allows other stacks to reference this
       });

    // Create (or reference) the S3 bucket that will store your model file.
    const modelBucket = new s3.Bucket(this, 'ModelBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });


    const sagemakerExecutionRole = new iam.Role(this, 'SageMakerExecutionRole', {
      assumedBy: new iam.ServicePrincipal('sagemaker.amazonaws.com'),
    });

    sagemakerExecutionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'));
    sagemakerExecutionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSageMakerFullAccess'));
    sagemakerExecutionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryReadOnly'));

    // Ensure SageMaker can assume the role
    sagemakerExecutionRole.assumeRolePolicy?.addStatements(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('sagemaker.amazonaws.com')],
        actions: ['sts:AssumeRole'],
      })
    );
    


    // Define the Lambda function that deploys the model to SageMaker.
    const deployModelLambda = new lambda.Function(this, 'DeployModelLambda', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'deploy_model.lambda_handler'
      , // The file deploy_model.py with lambda_handler function
      code: lambda.Code.fromAsset('lambda/createEndpoint')
      , // Directory containing your Lambda code
      environment: {
        MODEL_BUCKET: modelBucket.bucketName,
        MODEL_KEY: 'model.tar.gz',
        SAGEMAKER_EXECUTION_ROLE: sagemakerExecutionRole.roleArn,
        AWS_SDK_LOAD_CONFIG: '1',
        SAGEMAKER_PROGRAM: 'inference.py',
      },
      timeout: cdk.Duration.minutes(5)
    });

    // Grant Lambda read access to the S3 bucket.
    modelBucket.grantRead(deployModelLambda);

    // Allow Lambda to call SageMaker APIs.
    deployModelLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'sagemaker:CreateModel',
        'sagemaker:CreateEndpointConfig',
        'sagemaker:CreateEndpoint',
        'sagemaker:DescribeEndpoint',
        'iam:PassRole',
      ],
      resources: ['*'],
    }));

    deployModelLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['iam:PassRole'],
      resources: [sagemakerExecutionRole.roleArn],
    }));
    

    // Configure an S3 event notification to trigger the Lambda when a new model file is uploaded.
    modelBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(deployModelLambda),
      { suffix: 'model.tar.gz' }
    );
  }
}

