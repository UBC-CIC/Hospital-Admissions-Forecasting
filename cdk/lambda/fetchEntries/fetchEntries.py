import json
import os
import boto3
import psycopg2
import psycopg2.extras
from datetime import datetime

# Initialize AWS Clients
secrets_manager = boto3.client('secretsmanager')

# Read environment variables
DB_SECRET_ARN = os.getenv("DB_SECRET_ARN")
DB_NAME = os.getenv("DB_NAME")

def get_db_credentials():
    """Fetch database credentials from AWS Secrets Manager."""
    secret_value = secrets_manager.get_secret_value(SecretId=DB_SECRET_ARN)
    secret = json.loads(secret_value['SecretString'])
    return secret['username'], secret['password'], secret['host'], secret['port']

def fetch_today_entries():
    """Fetch all records from Aurora for today's date."""
    print(" Step 1: Fetching database credentials...")
    username, password, host, port = get_db_credentials()
    
    # Connect to the Aurora Database
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=username,
            password=password,
            host=host,
            port=port,
            connect_timeout=10  # Add a 10s timeout to prevent hanging
        )
        print(" Step 3: Successfully connected to database!")
    except Exception as e:
        print(f" Database Connection Failed: {str(e)}")
        return []
    
    today_date = datetime.now().date()  # Get today's date
    print(today_date)
    print(f"Fetching entries for date: {today_date}")

    # with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
    #     cursor.execute("""
    #         SELECT * FROM predictions
    #         WHERE DATE(LastUpdated) = %s;
    #     """, (today_date,))
        
    #     rows = cursor.fetchall()
    #     print(f"Query executed successfully, fetched {len(rows)} records.")  # Debugging output

    #     results = [dict(row) for row in rows]  # Convert to list of dicts

    # conn.close()
    
    # return results

    with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
        try:
            cursor.execute("SELECT * FROM predictions WHERE DATE(LastUpdated) = %s;", (today_date,))
            rows = cursor.fetchall()
            
            print(f"Query executed successfully, fetched {len(rows)} records.")  # Debugging output
            if not rows:
                print("⚠️ No records found for today's date!")

            results = [dict(row) for row in rows]  # Convert to list of dicts
        except Exception as query_error:
            print(f"SQL Query Error: {query_error}")
            results = []

    conn.close()
    
    return results


def lambda_handler(event, context):
    """Lambda function triggered via API Gateway."""
    try:
        print("Fetching today's database entries...")
        entries = fetch_today_entries()
        print(f"Entries Retrieved: {entries}")
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",  # Enable CORS for frontend
            },
            "body": json.dumps(entries, default=str)
        }
    except Exception as e:
        print(f"Error fetching entries: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }



# import json
# import os
# import boto3
# import psycopg2
# import psycopg2.extras

# # Initialize AWS clients
# secrets_manager = boto3.client('secretsmanager')

# # Read environment variables
# DB_HOST = os.getenv("DB_HOST")
# DB_PORT = os.getenv("DB_PORT")
# DB_NAME = os.getenv("DB_NAME")
# DB_SECRET_ARN = os.getenv("DB_SECRET_ARN")

# def get_db_credentials():
#     """Fetch database credentials from AWS Secrets Manager."""
#     secret_value = secrets_manager.get_secret_value(SecretId=DB_SECRET_ARN)
#     secret = json.loads(secret_value['SecretString'])
#     return secret['username'], secret['password']

# def fetch_today_entries():
#     """Fetch all records from Aurora for today's date."""
#     username, password = get_db_credentials()
    
#     conn = psycopg2.connect(
#         dbname=DB_NAME,
#         user=username,
#         password=password,
#         host=DB_HOST,
#         port=DB_PORT
#     )

#     with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
#         cursor.execute("SELECT * FROM predictions WHERE DATE(LastUpdated) = CURRENT_DATE;")
#         rows = cursor.fetchall()
#         results = [dict(row) for row in rows]

#     conn.close()
#     return results

# def lambda_handler(event, context):
#     try:
#         entries = fetch_today_entries()
#         return {"statusCode": 200, "body": json.dumps(entries)}
#     except Exception as e:
#         return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
