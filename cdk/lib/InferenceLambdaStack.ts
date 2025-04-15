
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface InferenceLambdaStackProps extends cdk.StackProps {
  sagemakerEndpointName: string;
  dbCluster: rds.DatabaseCluster;
  dbSecret: secretsmanager.Secret;
  vpc: ec2.Vpc;  // 🔹 Accept VPC from the database stack
}

export class InferenceLambdaStack extends cdk.Stack {
  public readonly inferenceBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: InferenceLambdaStackProps) {
    super(scope, id, props);

    // 🔹 Create an S3 bucket for inference inputs
    this.inferenceBucket = new s3.Bucket(this, 'InferenceDataBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });


    const psycopg2Layer = new lambda.LayerVersion(this, 'Psycopg2Layer', {
      code: lambda.Code.fromAsset('layers/psycopg2.zip'),  // 🔹 Use locally bundled psycopg2
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_9],
      description: "Psycopg2 Lambda Layer",
    });


    const pandasLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      'PandasLayer',
      'arn:aws:lambda:ca-central-1:336392948345:layer:AWSSDKPandas-Python39:2'
    );

    // 🔹 Create the Inference Lambda Function (inside VPC)
    const inferenceLambda = new lambda.Function(this, 'InferenceLambda', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'resolver.lambda_handler',
      code: lambda.Code.fromAsset('lambda/inferencing'),
      layers: [pandasLayer, psycopg2Layer],  // Attach both layers
      environment: {
        SAGEMAKER_ENDPOINT_NAME: props.sagemakerEndpointName,
        DB_SECRET_ARN: props.dbSecret.secretArn,
        DB_NAME: 'PredictionsDB',
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      vpc: props.vpc,  // 🔹 Ensure Lambda is inside the VPC
      securityGroups: [props.dbCluster.connections.securityGroups[0]], // 🔹 Connect to Aurora's security group
    });

    // 🔹 Grant Lambda permission to read from inference S3 bucket
    this.inferenceBucket.grantRead(inferenceLambda);

    // 🔹 Grant Lambda permission to invoke the SageMaker endpoint
    inferenceLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['sagemaker:InvokeEndpoint'],
      resources: [`arn:aws:sagemaker:${this.region}:${this.account}:endpoint/${props.sagemakerEndpointName}`],
    }));

    // 🔹 Grant Lambda access to Secrets Manager and the Database
    props.dbSecret.grantRead(inferenceLambda);
    props.dbCluster.connections.allowDefaultPortFrom(inferenceLambda);

    // 🔹 Configure S3 event notification to trigger Lambda on new CSV files
    this.inferenceBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(inferenceLambda),
      { suffix: '.csv' }
    );

    // Outputs
    new cdk.CfnOutput(this, 'InferenceLambdaFunctionName', {
      value: inferenceLambda.functionName,
    });

    new cdk.CfnOutput(this, 'InferenceBucketName', {
      value: this.inferenceBucket.bucketName,
    });
  }
}

