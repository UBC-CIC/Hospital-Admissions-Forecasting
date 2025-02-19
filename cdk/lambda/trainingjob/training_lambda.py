import json
import urllib.parse
import boto3
import os
from sagemaker.sklearn.estimator import SKLearn

s3 = boto3.client("s3")
sagemaker = boto3.client("sagemaker")

import json
import urllib.parse
import boto3
import os
from sagemaker.sklearn.estimator import SKLearn

s3 = boto3.client("s3")
sagemaker = boto3.client("sagemaker")

def lambda_handler(event, context):
    """Lambda function triggered by S3 to start a SageMaker training job."""

    # Get the bucket and file name from the event
    bucket_name = os.environ["S3_BUCKET_NAME"]
    key = urllib.parse.unquote_plus(event["Records"][0]["s3"]["object"]["key"], encoding="utf-8")

    print(f" New training file uploaded: s3://{bucket_name}/{key}")

    # ✅ Define SageMaker Training Job parameters
    training_job_name = f"rf-training-{context.aws_request_id}"
    s3_train_path = f"s3://{bucket_name}/{key}"
    s3_output_path = f"s3://{os.environ['SAGEMAKER_OUTPUT_BUCKET']}/training_output"

    # ✅ Set Environment Variables
    FRAMEWORK_VERSION = "0.23-1"
    env = {
        "SAGEMAKER_REQUIREMENTS": "requirements.txt",  # Path relative to `source_dir`
    }

    # ✅ Initialize SageMaker SKLearn Estimator
    sklearn_estimator = SKLearn(
        entry_point="script.py",  # ✅ This should match your actual training script
        role=os.environ["SAGEMAKER_ROLE"],
        env=env,
        instance_count=1,
        source_dir="/opt/ml/code",  # ✅ SageMaker expects the script inside /opt/ml/code
        instance_type="ml.c5.18xlarge",
        framework_version=FRAMEWORK_VERSION,
        py_version="py3",
        base_job_name="rf-scikit",
        code_location=s3_output_path,  # ✅ Stores training job code
        output_path=s3_output_path,  # ✅ Where the trained model is saved
    )

    #  Start the Training Job
    sklearn_estimator.fit({"training": s3_train_path})

    print(f" SageMaker training job started: {training_job_name}")
    
    return {
        "statusCode": 200,
        "body": json.dumps(f"Training job {training_job_name} launched successfully!"),
    }
