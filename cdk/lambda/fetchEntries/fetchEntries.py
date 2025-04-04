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
    try:
        secret_value = secrets_manager.get_secret_value(SecretId=DB_SECRET_ARN)
        secret = json.loads(secret_value['SecretString'])
        return secret['username'], secret['password'], secret['host'], secret['port']
    except Exception as e:
        print(f"Error fetching DB credentials: {str(e)}")
        raise  # Re-raise to be caught in the parent function

def fetch_today_entries():
    """Fetch all records from Aurora for today's date."""
    print("Step 1: Fetching database credentials...")
    
    try:
        username, password, host, port = get_db_credentials()
    except Exception as e:
        print(f"Failed to retrieve DB credentials: {e}")
        return []

    # Connect to the Aurora Database
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=username,
            password=password,
            host=host,
            port=port,
            connect_timeout=10  # Added a 10s timeout to prevent hanging
        )
        print("Step 3: Successfully connected to database!")
    except Exception as e:
        print(f"Database Connection Failed: {str(e)}")
        return []

    today_date = datetime.now().date()
    print(f"Fetching entries for date: {today_date}")

    try:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
            cursor.execute("SELECT * FROM predictions WHERE DATE(LastUpdated) = %s;", (today_date,))
            rows = cursor.fetchall()
            print(f"Query executed successfully, fetched {len(rows)} records.")
            if not rows:
                print("⚠️ No records found for today's date!")
            results = [dict(row) for row in rows]
    except Exception as query_error:
        print(f"SQL Query Error: {query_error}")
        results = []
    finally:
        try:
            conn.close()
        except Exception as e:
            print(f"Error closing DB connection: {e}")

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
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "OPTIONS, GET, POST",
                "Access-Control-Allow-Headers": "Content-Type, Authorization"
            },
            "body": json.dumps(entries, default=str)
        }
    except Exception as e:
        print(f"Unhandled error in lambda_handler: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
