import joblib
import io
import os
import json
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import xgboost as xgb
import joblib
import os
import json
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import xgboost as xgb
from datetime import datetime
# Define the model path (SageMaker expects models in /opt/ml/model)
MODEL_PATH = "/opt/ml/model/model.joblib"
# Load the model when the SageMaker container starts
def model_fn(model_dir):
    """ Load model from the specified directory """
    model = joblib.load(MODEL_PATH)
    return model
# Custom imputation for specific variables
def custom_impute(df):
    print("Applying custom imputations...")

    # Null = ZERO rules
    zero_cols = [
        "Blood_Pressure", "Pulse_Oximetry", "Pulse_Rate", "Temperature", "Respiratory_Rate"
    ]
    df[zero_cols] = df[zero_cols].fillna(0)

    # Null = ZERO IF ALL OTHER VITALS ARE NULL, ELSE MEDIAN for Glasgow_Coma_Scale
    vital_cols = zero_cols + ["Glasgow_Coma_Scale"]
    df["Glasgow_Coma_Scale"] = df["Glasgow_Coma_Scale"].where(
        ~df[vital_cols].isnull().all(axis=1), 0
    )
    df["Glasgow_Coma_Scale"].fillna(df["Glasgow_Coma_Scale"].median(), inplace=True)

    # Median imputation for Capillary_Refill and Pain_Severity_Scale
    median_cols = ["Capillary_Refill", "Pain_Severity_Scale"]
    for col in median_cols:
        df[col].fillna(df[col].median(), inplace=True)

    # Triage DateTime imputation for related DateTime columns
    datetime_cols = [
        "Blood_Pressure.DateTime",
        "Capillary_Refill.DateTime",
        "Glasgow_Coma_Scale.DateTime",
        "Pain_Severity_Scale.DateTime",
        "Pulse_Oximetry.DateTime",
        "Pulse_Rate.DateTime",
        "Temperature.DateTime",
        "Respiratory_Rate.DateTime",
    ]
    for col in datetime_cols:
        df[col].fillna(df["EDAcctCanadianAbs.TriageDateTime"], inplace=True)

    return df
def pre_process_data(df):
    df.drop(['rowupdated'],axis=1,inplace=True)
    # df = df[df['EDVisit.Age']>=18]
    # Convert the 'EDVisit.RegistrationDateTime' column to a datetime format
    df['EDVisit.RegistrationDateTime'] = pd.to_datetime(
    df['EDVisit.RegistrationDateTime'],
    errors='coerce',  # Avoids crashing on invalid dates
    infer_datetime_format=True  # Automatically detects format
    )
    # Extract year, month, day, and time into new columns
    df['Registration Year'] = df['EDVisit.RegistrationDateTime'].dt.year
    df['Registration Month'] = df['EDVisit.RegistrationDateTime'].dt.month
    df['Registration Day'] = df['EDVisit.RegistrationDateTime'].dt.day
    df['Registration Time'] = df['EDVisit.RegistrationDateTime'].dt.time
    # Display the dataframe with the new columns
    print(df[['EDVisit.RegistrationDateTime', 'Registration Year', 'Registration Month', 'Registration Day', 'Registration Time']])
    # Convert 'Registration Time' to string format if it's not already
    df['Registration Time'] = df['Registration Time'].astype(str)
    # Define a function to parse time and categorize into 'Morning' or 'Afternoon'
    def categorize_time(time_value):
        if pd.isna(time_value):
            return None
        try:
            if isinstance(time_value, str):
                time_obj = datetime.strptime(time_value, '%H:%M:%S').time()
            else:
                time_obj = time_value  # Already a time object
            return 'Morning' if time_obj.hour < 12 else 'Afternoon'
        except ValueError:
            print(f"Failed to parse time: {time_value}")
            return None
    # def categorize_time(time_str):
    #     try:
    #         # Parse the time using the format '%H:%M:%S'
    #         time_obj = datetime.strptime(time_str, '%H:%M:%S').time()
    #     except ValueError:
    #         # Handle cases where parsing fails
    #         print("failing")
    #         return None
    #     # Categorize time based on hour
    #     if time_obj.hour < 12:
    #         return 'Morning'
    #     else:
    #         return 'Afternoon'
    # Apply the function to create a new column 'Time of Day'
    df['Range of Day'] = df['Registration Time'].apply(categorize_time)
    # Drop rows where 'Time of Day' is None (invalid times)
    print("Null values in Range of Day: ", df['Range of Day'].isnull().sum())
    #print V_GUID for null values in range of day
    print("V_GUID for null values in Range of Day: ", df[df['Range of Day'].isnull()]['V_GUID'])
    # df = df.dropna(subset=['Range of Day'])
    df.set_index('V_GUID',inplace=True)
    df.drop(['Registration Time'], axis = 1, inplace = True)
    from pandas.api.types import is_datetime64_any_dtype as is_datetime
    from pandas.api.types import is_object_dtype
    cat_columns = []
    for series_name, series in df.items():
    #     if 'Time' in series_name and not is_datetime(series.dtype):
        if 'Time' in series_name:
            df[series_name]= pd.to_datetime(df[series_name]).view(int)
        if is_object_dtype(series.dtype):
            cat_columns.append(series_name)
    df[cat_columns] = df[cat_columns].astype('category').apply(lambda x: x.cat.codes)
    # Capillary Refill
    df['Abnormal_Capillary_Refill'] = np.where(df['Capillary_Refill'] > 2, 2,
                                                np.where(df['Capillary_Refill'] < 2, 1, np.nan))
    # Glasgow Coma Scale
    df['Glasgow_Coma_Scale_Severe'] = np.where(df['Glasgow_Coma_Scale'] < 9, 2,
                                                np.where((df['Glasgow_Coma_Scale'] >= 9) & (df['Glasgow_Coma_Scale'] <= 11), 1,
                                                        np.where(df['Glasgow_Coma_Scale'] >= 12, 0, np.nan)))
    # Handle impossible values
    df.loc[(df['Glasgow_Coma_Scale'] < 3) | (df['Glasgow_Coma_Scale'] > 15), 'Glasgow_Coma_Scale_Severe'] = np.nan
    df.loc[(df['Glasgow_Coma_Scale'] < 3) | (df['Glasgow_Coma_Scale'] > 15), 'Glasgow_Coma_Scale'] = np.nan
    # Pain Severity Scale
    df['Severe_Pain'] = np.where(df['Pain_Severity_Scale'] > 6, 2,
                                np.where(df['Pain_Severity_Scale'] <= 6, 1, np.nan))
    # Handle impossible values
    df.loc[df['Pain_Severity_Scale'] > 10, 'Severe_Pain'] = np.nan
    df.loc[df['Pain_Severity_Scale'] > 10, 'Pain_Severity_Scale'] = np.nan
    # Pulse Oximetry
    df['Abnormal_Pulse_Oximetry'] = np.where(df['Pulse_Oximetry'] < 88, 2,
                                            np.where((df['Pulse_Oximetry'] > 88) & (df['Pulse_Oximetry'] <= 97), 1,
                                                    np.where(df['Pulse_Oximetry'] >= 98, 0, np.nan)))
    # Handle impossible values
    df.loc[df['Pulse_Oximetry'] > 100, 'Abnormal_Pulse_Oximetry'] = np.nan
    df.loc[df['Pulse_Oximetry'] > 100, 'Pulse_Oximetry'] = np.nan
    # High Pulse Rate
    df['High_Pulse_Rate'] = np.where(df['Pulse_Rate'] > 100, 2,
                                    np.where(df['Pulse_Rate'] <= 100, 1, np.nan))
    # Handle impossible values
    df.loc[df['Pulse_Rate'] > 300, 'High_Pulse_Rate'] = np.nan
    df.loc[df['Pulse_Rate'] > 300, 'Pulse_Rate'] = np.nan
    # Low Pulse Rate
    df['Low_Pulse_Rate'] = np.where(df['Pulse_Rate'] < 60, 2,
                                    np.where(df['Pulse_Rate'] >= 60, 1, np.nan))
    # Handle impossible values
    df.loc[df['Pulse_Rate'] < 0, 'Low_Pulse_Rate'] = np.nan
    df.loc[df['Pulse_Rate'] < 0, 'Pulse_Rate'] = np.nan
    # Fever
    df['Fever'] = np.where(df['Temperature'] > 38.1, 2,
                            np.where((df['Temperature'] > 37.3) & (df['Temperature'] <= 38.1), 1,
                                    np.where(df['Temperature'] <= 37.2, 0, np.nan)))
    # Handle impossible values
    df.loc[df['Temperature'] > 48, 'Fever'] = np.nan
    df.loc[df['Temperature'] > 48, 'Temperature'] = np.nan
    # Hypothermia
    df['Hypothermia'] = np.where(df['Temperature'] < 35, 2,
                                np.where((df['Temperature'] >= 35) & (df['Temperature'] <= 35.4), 1,
                                        np.where(df['Temperature'] >= 35.5, 0, np.nan)))
    # Handle impossible values
    df.loc[df['Temperature'] < 4, 'Hypothermia'] = np.nan
    df.loc[df['Temperature'] < 4, 'Temperature'] = np.nan
    # High Respiratory Rate
    df['High_Respiratory_Rate'] = np.where(df['Respiratory_Rate'] > 24, 2,
                                            np.where(df['Respiratory_Rate'] > 18, 1,
                                                    np.where(df['Respiratory_Rate'] <= 18, 0, np.nan)))
    # Handle impossible values
    df.loc[df['Respiratory_Rate'] > 100, 'High_Respiratory_Rate'] = np.nan
    df.loc[df['Respiratory_Rate'] > 100, 'Respiratory_Rate'] = np.nan
    print(df.dtypes)
    print("Pre-processed data, imputing now")
    df = custom_impute(df)
    # Now apply the SimpleImputer for any remaining columns
    from sklearn.impute import SimpleImputer
    imputer = SimpleImputer(missing_values=np.nan, strategy='median')
    df = pd.DataFrame(imputer.fit_transform(df), columns=df.columns, index=df.index)
    print("Imputation complete")
    return df
# SageMaker calls this function when making predictions
def input_fn(request_body, request_content_type):
    """ Parse and preprocess input data """
    # if request_content_type == "application/json":
    #     data = json.loads(request_body)  # Convert JSON string to dictionary
    #     df = pd.json_normalize(data['results'])
    #     #pre-process data
    #     df = pre_process(df)
    #     invalid_columns = ["V_GUID", "Admitted", "Age Range", "EDVisit.AdmitDateTime", "TotalAdmitted", "EDVisit.Expired"]
    #     data = df.drop(columns=invalid_columns, errors="ignore")
    #     return data.to_numpy()  # Convert to NumPy array for prediction
    # else:
    #     raise ValueError(f"Unsupported content type: {request_content_type}")
    print(f"Received request with content_type: {request_content_type}")
    try:
        if request_content_type == "text/csv":
            # Read CSV from request body
            df = pd.read_csv(io.StringIO(request_body))
            print(f"Parsed DataFrame:\n{df.head()}")  # Debugging log
            print("Shape of the data after reading from csv: ", df.shape)
            # Apply preprocessing
            df = pre_process_data(df)
            print("Shape of the data after pre-processing: ", df.shape)
            invalid_columns = ["V_GUID", "Admitted", "Age Range", "EDVisit.AdmitDateTime", "TotalAdmitted", "EDVisit.Expired"]
            data = df.drop(columns=invalid_columns, errors="ignore")
            print("Shape of the data after dropping invalid columns: ", data.shape)
            return data.to_numpy()  # Convert to NumPy array for prediction
        else:
            raise ValueError(f"Unsupported content type: {request_content_type}. Expected 'text/csv'.")
    except Exception as e:
        print(f"Error in input_fn: {str(e)}")
        raise
def predict_fn(input_data, model):
    """ Perform inference using the trained model """
    print("Numpy shape of the input data before predictions: ", input_data.shape)
    predictions = model.predict_proba(input_data)[:, 1]
    return predictions.tolist()  # Convert NumPy array to list for JSON response

def output_fn(prediction_output, response_content_type):
    """ Format prediction output for the response """
    if response_content_type == "application/json":
        return json.dumps({"predictions": prediction_output})
    elif response_content_type == "text/csv":
        return "\n".join(map(str, prediction_output))
    else:
        raise ValueError(f"Unsupported content type: {response_content_type}")
    # if response_content_type == "application/json":
    #     return json.dumps({"predictions": prediction_output})
    # else:
    #     raise ValueError(f"Unsupported content type: {response_content_type}")