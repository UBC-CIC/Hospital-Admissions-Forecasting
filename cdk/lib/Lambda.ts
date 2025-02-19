// import * as cdk from "aws-cdk-lib";
// import { Construct } from "constructs";
// import * as lambda from "aws-cdk-lib/aws-lambda";
// import * as s3assets from "aws-cdk-lib/aws-s3-assets";
// import * as s3 from "aws-cdk-lib/aws-s3";
// import * as path from "path";
// import * as iam from "aws-cdk-lib/aws-iam";
// import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";

// export class LambdaStack extends cdk.Stack {
//   constructor(scope: Construct, id: string, props?: cdk.StackProps) {
//     super(scope, id, props);

//     //  Create an S3 bucket for storing training data
//     const trainingBucket = new s3.Bucket(this, "TrainingDataBucket", {
//       removalPolicy: cdk.RemovalPolicy.DESTROY, // Prevents accidental deletion
//       autoDeleteObjects: true, // Ensures data is not auto-deleted
//     });

//     const sagemakerRole = new iam.Role(this, "SageMakerExecutionRole", {
//       assumedBy: new iam.ServicePrincipal("sagemaker.amazonaws.com"),
//     });
    
//     // Add policies to the role
//     sagemakerRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess"));
//     sagemakerRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSageMakerFullAccess"));

//     // const pythonLayer = new lambda.LayerVersion(this, "PythonLayer", {
//     //   code: lambda.Code.fromAsset(path.join(__dirname, "../python-layer/python-layer.zip")),
//     //   compatibleRuntimes: [lambda.Runtime.PYTHON_3_8],
//     // });

//     // //  Define the Lambda function
//     // const trainingLambda = new lambda.Function(this, "TrainingLambda", {
//     //   runtime: lambda.Runtime.PYTHON_3_8,
//     //   handler: "training_lambda.lambda_handler",  
//     //   code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/trainingjob")),
//     //   layers: [pythonLayer],
//     //   environment: {
//     //     S3_BUCKET_NAME: trainingBucket.bucketName, // Pass bucket name as env variable
//     //     SAGEMAKER_ROLE: sagemakerRole.roleArn,
//     //   },
//     // });


    
//     const trainingLambda = new lambda.Function(this, "TrainingLambda", {
//       runtime: lambda.Runtime.PYTHON_3_8,
//       handler: "training_lambda.lambda_handler",  
//       code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/trainingjob"), {
//         bundling: {
//           image: lambda.Runtime.PYTHON_3_8.bundlingImage,
//           command: [
//             "bash", "-c",
//             "pip install -r requirements.txt -t /asset-output && cp -r . /asset-output"
//           ],
//         },
//       }),
//       environment: {
//         S3_BUCKET_NAME: trainingBucket.bucketName, // Pass bucket name as env variable
//         SAGEMAKER_ROLE: sagemakerRole.roleArn,
//       },
//     });


//     //  Grant the Lambda function permissions to read from the S3 bucket
//     trainingBucket.grantReadWrite(trainingLambda);

//     // Set up S3 event trigger (when a new file is uploaded)
//     trainingLambda.addEventSource(
//       new lambdaEventSources.S3EventSource(trainingBucket, {
//         events: [s3.EventType.OBJECT_CREATED],
//       })
//     );

//     // 🌟 Output the bucket name (useful for debugging/deployment)
//     new cdk.CfnOutput(this, "TrainingBucketName", {
//       value: trainingBucket.bucketName,
//     });

//     new cdk.CfnOutput(this, "TrainingLambdaArn", {
//       value: trainingLambda.functionArn,
//     });
//   }
// }

import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3assets from "aws-cdk-lib/aws-s3-assets";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as path from "path";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";

export class LambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //  Create an S3 bucket for storing training data
    const trainingBucket = new s3.Bucket(this, "TrainingDataBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Prevents accidental deletion
      autoDeleteObjects: true, // Ensures data is not auto-deleted
    });

    const sagemakerRole = new iam.Role(this, "SageMakerExecutionRole", {
      assumedBy: new iam.ServicePrincipal("sagemaker.amazonaws.com"),
    });
    
    // Add policies to the role
    sagemakerRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess"));
    sagemakerRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSageMakerFullAccess"));


    //  Define the Lambda function
    const trainingLambda = new lambda.Function(this, "TrainingLambda", {
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: "training_lambda.lambda_handler",  
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/trainingjob")),
      environment: {
        S3_BUCKET_NAME: trainingBucket.bucketName, // Pass bucket name as env variable
        SAGEMAKER_ROLE: sagemakerRole.roleArn,
      },
    });

    //  Grant the Lambda function permissions to read from the S3 bucket
    trainingBucket.grantReadWrite(trainingLambda);

    // Set up S3 event trigger (when a new file is uploaded)
    trainingLambda.addEventSource(
      new lambdaEventSources.S3EventSource(trainingBucket, {
        events: [s3.EventType.OBJECT_CREATED],
      })
    );

    // 🌟 Output the bucket name (useful for debugging/deployment)
    new cdk.CfnOutput(this, "TrainingBucketName", {
      value: trainingBucket.bucketName,
    });

    new cdk.CfnOutput(this, "TrainingLambdaArn", {
      value: trainingLambda.functionArn,
    });
  }
}
