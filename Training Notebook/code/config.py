model = "RF"
# model = "XGB"

training_s3_path = 's3://my-bucket/model/' #change the path to the S3 bucket for model artifact output (same bucket that should trigger the endpoint creation lambda in deployment guide)

data_bucket = 'my-bucket'#where your training data is stored
training_path = 'data/'#folder inside data bucket for training data csv


xgb_parameters = {"tree_method":"hist", 'max_depth':10,'n_estimators': 100}
rf_parameters = {"n_estimators": 100, 'max_features': 5, 'max_depth': 10}

if model == "RF":
    script_name = "rf_script.py"
elif model == "XGB":
    script_name = "xgb_script.py"
else:
    print("Warning: You have not chosen an RF or XGB model - please create a custom script accordingly and change parameters")