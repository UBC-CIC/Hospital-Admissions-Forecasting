import os
import boto3
sagemaker_client = boto3.client('sagemaker')
# from sagemaker_client import image_uris


def lambda_handler(event, context):
    bucket = os.environ['MODEL_BUCKET']
    key = os.environ['MODEL_KEY']
    role_arn = os.environ['SAGEMAKER_EXECUTION_ROLE']

    model_name = 'my-sagemaker-model'
    endpoint_config_name = 'my-endpoint-config'
    endpoint_name = 'medical-inference-endpoint'

    
    # Create a SageMaker model that points to your model data in S3.
    sagemaker_client.create_model(
        ModelName=model_name,
        PrimaryContainer={
            'Image': '341280168497.dkr.ecr.ca-central-1.amazonaws.com/sagemaker-scikit-learn:1.2-1-cpu-py3',  # Replace with your container image URI
            'ModelDataUrl': f's3://{bucket}/{key}',
            'Environment': {
                'SAGEMAKER_SUBMIT_DIRECTORY': '/opt/ml/model/',
                'SAGEMAKER_PROGRAM': 'inference.py'  # Tell SageMaker to use inference.py
                }
        },
        ExecutionRoleArn=role_arn
    )
    
    
    print(" SageMaker model started:")

    sagemaker_client.create_endpoint_config(
    EndpointConfigName=endpoint_config_name,
    ProductionVariants=[
        {
            'VariantName': 'AllTraffic',
            'ModelName': model_name,
            'InstanceType': 'ml.m5.large',  # Change from Serverless to Real-Time
            'InitialInstanceCount': 1
        }
    ]
)

    
    # Create the SageMaker endpoint.
    sagemaker_client.create_endpoint(
        EndpointName=endpoint_name,
        EndpointConfigName=endpoint_config_name,
    )
    
    return {
        'statusCode': 200,
        'body': f'SageMaker serverless endpoint {endpoint_name} creation initiated.'
    }
