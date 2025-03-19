model = "RF"
# model = "XGB"

xgb_parameters = {"tree_method":"hist", 'max_depth':10,'n_estimators': 100}
rf_parameters = {"n_estimators": 100, 'max_features': 5, 'max_depth': 10}

if model == "RF":
    script_name = "rf_script.py"
elif model == "XGB":
    script_name = "xgb_script.py"
else:
    print("Warning: You have not chosen an RF or XGB model - please create a custom script accordingly and change parameters")