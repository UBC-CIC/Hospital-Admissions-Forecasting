# print("Resolver module loaded")
# import json
# import os
# import boto3
# import pandas as pd
# import io

# # Initialize AWS clients
# s3_client = boto3.client('s3')
# sagemaker_runtime = boto3.client('sagemaker-runtime')

# # Read SageMaker endpoint name from environment variables
# SAGEMAKER_ENDPOINT_NAME = os.getenv("SAGEMAKER_ENDPOINT_NAME")

# def lambda_handler(event, context):
#     try:
#         print(f"Event received: {json.dumps(event)}")  # Debugging log

#         # 🔹 Extract S3 bucket and key from event
#         if "Records" in event:
#             bucket_name = event["Records"][0]["s3"]["bucket"]["name"]
#             object_key = event["Records"][0]["s3"]["object"]["key"]
#         else:
#             raise ValueError("Invalid event structure: No 'Records' key found.")

#         print(f"Fetching file from S3: {bucket_name}/{object_key}")

#         # 🔹 Retrieve the CSV file from S3
#         response = s3_client.get_object(Bucket=bucket_name, Key=object_key)
#         file_content = response["Body"].read().decode("utf-8")

#         # 🔹 Convert CSV to DataFrame
#         df = pd.read_csv(io.StringIO(file_content))
#         print(f"CSV Data:\n{df.head()}")  # Debugging log

#         # 🔹 Convert DataFrame back to CSV string for SageMaker
#         csv_input = df.to_csv(index=False)

#         # 🔹 Invoke SageMaker endpoint with CSV input
#         inference_response = sagemaker_runtime.invoke_endpoint(
#             EndpointName=SAGEMAKER_ENDPOINT_NAME,
#             ContentType="text/csv",   # Changed from JSON
#             Body=csv_input
#         )

#         # 🔹 Read the response from SageMaker
#         result = inference_response["Body"].read().decode("utf-8")
#         print(f"SageMaker prediction response: {result}")

#         return {
#             "statusCode": 200,
#             "body": result
#         }

#     except Exception as e:
#         print(f"Error: {str(e)}")
#         return {
#             "statusCode": 500,
#             "error": str(e)
#         }
import json
import os
import boto3
import psycopg2
import psycopg2.extras
import pandas as pd
import io
import datetime

# Initialize AWS clients
s3_client = boto3.client('s3')
sagemaker_runtime = boto3.client('sagemaker-runtime')
secrets_manager = boto3.client('secretsmanager')

# Read environment variables
SAGEMAKER_ENDPOINT_NAME = os.getenv("SAGEMAKER_ENDPOINT_NAME")
DB_SECRET_ARN = os.getenv("DB_SECRET_ARN")
DB_NAME = os.getenv("DB_NAME")

def get_db_credentials():
    """Fetch database credentials from AWS Secrets Manager."""
    secret_value = secrets_manager.get_secret_value(SecretId=DB_SECRET_ARN)
    secret = json.loads(secret_value['SecretString'])
    return secret['username'], secret['password'], secret['host'], secret['port']


def store_prediction_in_db(v_guid, facility_id, reg_datetime, model_score):
    """Stores the prediction in Aurora PostgreSQL."""
    username, password, host, port = get_db_credentials()
    print("Connecting to Aurora Database...")

    conn = psycopg2.connect(
        dbname=DB_NAME,
        user=username,
        password=password,
        host=host,
        port=port
    )

    print("Connected to database.")


    with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
        print("Ensuring table exists...")

        # 🔹 Create the table if it doesn't exist, including `LastUpdated`
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS predictions (
                V_GUID TEXT PRIMARY KEY,
                Facility_ID TEXT,
                RegistrationDateTime TIMESTAMP,
                ModelScore FLOAT,
                LastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP

            );
        """)
        conn.commit()
        print("Table check complete.")


        # 🔹 Insert or update data (update timestamp automatically)
        print(f"Inserting/updating record: {v_guid}, {facility_id}, {reg_datetime}, {model_score}")
        cursor.execute("""
            INSERT INTO predictions (V_GUID, Facility_ID, RegistrationDateTime, ModelScore, LastUpdated)
            VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP)
            ON CONFLICT (V_GUID) 
            DO UPDATE SET 
                ModelScore = EXCLUDED.ModelScore,
                Facility_ID = EXCLUDED.Facility_ID,
                RegistrationDateTime = EXCLUDED.RegistrationDateTime,
                LastUpdated = CURRENT_TIMESTAMP;
        """, (v_guid, facility_id, reg_datetime, model_score))

        conn.commit()
        print(f"Record saved: {v_guid}")

    conn.close()
    print("Database connection closed.")



def lambda_handler(event, context):
    try:
        print(f"Event received: {json.dumps(event)}")  

        # Extract S3 bucket and object key
        if "Records" in event:
            bucket_name = event["Records"][0]["s3"]["bucket"]["name"]
            object_key = event["Records"][0]["s3"]["object"]["key"]
        else:
            raise ValueError("Invalid event structure: No 'Records' key found.")

        print(f"Fetching file from S3: {bucket_name}/{object_key}")

        # Retrieve the CSV file from S3
        response = s3_client.get_object(Bucket=bucket_name, Key=object_key)
        file_content = response["Body"].read().decode("utf-8")

        # Convert CSV to DataFrame
        df = pd.read_csv(io.StringIO(file_content))
        print(f"CSV Data:\n{df.head()}")

        # Convert DataFrame back to CSV string for SageMaker
        csv_input = df.to_csv(index=False)

        # Invoke SageMaker endpoint
        inference_response = sagemaker_runtime.invoke_endpoint(
            EndpointName=SAGEMAKER_ENDPOINT_NAME,
            ContentType="text/csv",
            Body=csv_input
        )

        # Read SageMaker response
        result = inference_response["Body"].read().decode("utf-8").strip()
        print(f"SageMaker raw response: {result}")

        try:
            parsed_result = json.loads(result)  # Parse JSON response
            predictions = parsed_result["predictions"]  # Extract predictions list
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse SageMaker response as JSON: {str(e)}")

        # Error Handling: Ensure Predictions Are Valid
        if len(predictions) < len(df):
            raise ValueError("SageMaker returned fewer predictions than expected!")

        for index, row in df.iterrows():
            v_guid = row["V_GUID"]
            facility_id = row["EDVisit.Facility_MisFacID"]
            reg_datetime = row["EDVisit.RegistrationDateTime"]
            
            try:
                model_score = float(predictions[index]) if index < len(predictions) else None
            except ValueError:
                model_score = None  # Handle case where prediction is not a valid float
            
            print(f"Saving to Aurora: {v_guid}, {facility_id}, {reg_datetime}, {model_score}")


            store_prediction_in_db(v_guid, facility_id, reg_datetime, model_score)
            print(f"Successfully saved: {v_guid}")


        response = {
            "statusCode": 200,
            "body": "Predictions stored successfully."
        }
        print(f"Lambda return: {response}")  # Explicitly log the return value
        return response

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            "statusCode": 500,
            "error": str(e)
        }