import os
import boto3
import sagemaker
sagemaker_client = boto3.client('sagemaker')
# from sagemaker_client import image_uris


def lambda_handler(event, context):
    bucket = os.environ['MODEL_BUCKET']
    key = os.environ['MODEL_KEY']
    role_arn = os.environ['SAGEMAKER_EXECUTION_ROLE']

    model_name = 'my-sagemaker-model'
    endpoint_config_name = 'my-endpoint-config'
    endpoint_name = 'medical-inference-endpoint'

    # Dynamically get region and image URI
    region = boto3.Session().region_name
    
    # Retrieve region-specific SageMaker image URI dynamically.
    # Docs: https://docs.aws.amazon.com/sagemaker/latest/dg/ecr-paths.html
    image_uri = sagemaker.image_uris.retrieve(
        framework='sklearn',
        region=region,
        version='1.2-1',
        image_scope='inference'
    )
    
    # Create a SageMaker model that points to your model data in S3.
    sagemaker_client.create_model(
        ModelName=model_name,
        PrimaryContainer={
            'Image': image_uri,
            'ModelDataUrl': f's3://{bucket}/{key}',
            'Environment': {
                'SAGEMAKER_SUBMIT_DIRECTORY': '/opt/ml/model/',
                'SAGEMAKER_PROGRAM': 'inference.py'  # Tell SageMaker to use inference.py
                }
        },
        ExecutionRoleArn=role_arn
    )
    
    
    print(" SageMaker model started:")

    # Create an endpoint configuration using Serverless Inference settings.
    # sagemaker_client.create_endpoint_config(
    #     EndpointConfigName=endpoint_config_name,
    #     ProductionVariants=[
    #         {
    #             'VariantName': 'AllTraffic',
    #             'ModelName': model_name,
    #             'ServerlessConfig': {
    #                 'MemorySizeInMB': 2048,   # Adjust memory as needed
    #                 'MaxConcurrency': 5       # Adjust concurrency as needed
    #             }
    #         }
    #     ]
    # )

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
