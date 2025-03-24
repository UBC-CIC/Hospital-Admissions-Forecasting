import argparse
import joblib
import os
import json

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.model_selection import cross_val_score
from imblearn.over_sampling import SMOTE
from imblearn.under_sampling import RandomUnderSampler
from imblearn.pipeline import Pipeline


from sklearn.impute import SimpleImputer
from sklearn.impute import KNNImputer
from sklearn.inspection import permutation_importance
from sklearn.metrics import auc
from sklearn.metrics import confusion_matrix
from sklearn.model_selection import StratifiedKFold
from sklearn.base import clone
from sklearn.model_selection import GridSearchCV
from sklearn import tree
from sklearn.tree import export_graphviz
from sklearn.metrics import roc_auc_score
from sklearn.ensemble import RandomForestClassifier
import xgboost as xgb
import pickle
from datetime import datetime


def _parse_args():
    parser = argparse.ArgumentParser()
    #these arguments are always automatically passed by sagemaker, so the following block of code should essentially stay as is in your code.,→
    # Data, model, and output directories
    # model_dir is always passed in from SageMaker.
    #By default this is a S3 path under the default bucket.
    parser.add_argument("--model_dir", type=str)
    parser.add_argument("--sm_model_dir", type=str, default=os.environ.get("SM_MODEL_DIR"))
    parser.add_argument("--train", type=str, default=os.environ.get("SM_CHANNEL_TRAINING"))
    parser.add_argument("--hosts", type=list, default=json.loads(os.environ.get("SM_HOSTS")))
    parser.add_argument("--current-host", type=str, default=os.environ.get("SM_CURRENT_HOST"))
    parser.add_argument("--file_name", type=str, default="ED_UBC_20240924_ImagingAdded.csv")#change the file name accordingly
    #passed manually, you can add whatever custom arguments you want and pass them through the Jupyter notebook.,
    parser.add_argument('--test_version',type=str)
    return parser.parse_known_args()

def _load_training_data(base_dir):
    df = pd.read_csv(base_dir + args.file_name,index_col = 'V_GUID',encoding='utf-8')
    df.set_index('V_GUID',inplace=True)
    return df

    
def train_model_cv(m,parameters,x,y):
    #store output of this function
    cf=[]
    
    #store feature importances
    fis=[]

    ### NEW list to store AUCs
    aucs=[]
    print(x.shape)
    print(y.shape)
    #3 runs of cross-validation
#     for rs in [1,2,3,4,5]:
    for rs in [1]:
        #8-fold cross validation
        skf = StratifiedKFold(n_splits=8,shuffle=True,random_state=rs)
        skf.get_n_splits(x, y)
        for train_index, test_index in skf.split(np.zeros(x.shape[0]), y):
            print(train_index)
            x_train, x_test = x.iloc[train_index,:], x.iloc[test_index,:]
            y_train, y_test = y[train_index], y[test_index]


            #
            empty_train_columns =  []
            miss_mean_columns = x.columns
            for col in x_train.columns.values:
                # all the values for this feature are null
                if sum(x_train[col].isnull()) == x_train.shape[0]:
                    empty_train_columns.append(col)
            imputed_train_columns=[c for c in x_train.columns if c not in empty_train_columns]
    #         x_train = x_train.dropna(axis=1,how='all').values
    
#             empty_test_columns =  []
#             for col in x_test.columns.values:
#                 # all the values for this feature are null
#                 if sum(x_test[col].isnull()) == x_test.shape[0]:
#                     empty_test_columns.append(col)
#             imputed_test_columns=[c for c in x_test.columns if c not in empty_test_columns]
            
            print('empty training columns - ', empty_train_columns)
#             print(empty_test_columns)
            #impute missing
#             imp_knn = KNNImputer(missing_values=np.nan)
            
            print("Imputing missing data")

#             imp_knn_x_train=pd.DataFrame(imp_knn.fit_transform(x_train),index=x_train.index,columns=imputed_train_columns)
#             print("imputed knn x train")
#             imp_knn_x_test=pd.DataFrame(imp_knn.transform(x_test),index=x_test.index,columns=imputed_train_columns)
#             print("imputed knn x test")
            
            imp_mean = SimpleImputer(missing_values=np.nan, strategy='median')

            imp_mean_x_train=pd.DataFrame(imp_mean.fit_transform(x_train),index=x_train.index,columns=imputed_train_columns)
            print("imputed mean x train")
            imp_mean_x_test=pd.DataFrame(imp_mean.transform(x_test),index=x_test.index,columns=imputed_train_columns)
            print("imputed mean x test")
            
    #         print("Imputated training data - iron lvl",imp_knn_x_train['LabAdm_Iron'])
    #         print(x_train['LabAdm_Iron'])
    #         print(imp_mean_x_train.shape)

#             for col in miss_knn_columns:
#                 x_train[col]=imp_knn_x_train[col]
#                 x_test[col]=imp_knn_x_test[col]
                
#                 #check if there are null values after imputing. should ideally not run
#                 if pd.isnull(x_train[col]).sum() > 0:
#                     print(col,x_train.shape)
#                     print('Null values for col, ',col,' are',pd.isnull(x_train[col]).sum())
#                     print(x_train[col])
            for col in miss_mean_columns:
                x_train[col]=imp_mean_x_train[col]
                x_test[col]=imp_mean_x_test[col]
    #         print(x_train.shape)
    #         print(pd.isnull(x_train).sum())
    #         print(pd.isnull(imp_mean_x_train).sum())

        #smote
            over = SMOTE()
            under = RandomUnderSampler()
            steps = [('o', over),('u',under)]
            pipeline = Pipeline(steps=steps)
            print(x_train.isna().sum())
            x_train, y_train = pipeline.fit_resample(x_train, y_train)

        #model fit and prediction
        #create model
            model = clone(m)
        #fit

            clf = GridSearchCV(model, parameters,cv=5) #n_jobs=None
            clf.fit(x_train, y_train)


            model = clf.best_estimator_
            
    #         #shap feature importance - runs too slow so it is commented out
    #         import shap
    #         explainer = shap.KernelExplainer(model.predict,x_train)
    #         shap_test = explainer.shap_values(x_test,n_samples=1000)
    #         print(f"Shap values length: {len(shap_test)}\n")
    #         print(f"Sample shap value:\n{shap_test[0]}")
    #         shap_df = pd.DataFrame(shap_test.values, 
    #                        columns=shap_test.feature_names, 
    #                        index=x_test.index)
    #         print(np.isclose(model.predict(x_test), explainer.expected_value[0] + shap_df.sum(axis=1)))

    #         columns = shap_df.apply(np.abs).mean()\
    #                          .sort_values(ascending=False).index
    #         fig, ax = plt.subplots(1, 2, figsize=(11,4))
    #         sns.barplot(data=shap_df[columns].apply(np.abs), orient='h', 
    #                     ax=ax[0])
    #         ax[0].set_title("Mean absolute shap value")
    #         sns.boxplot(data=shap_df[columns], orient='h', ax=ax[1])
    #         ax[1].set_title("Distribution of shap values");
    #         plt.show()

            result = permutation_importance(model, x_test, y_test, n_repeats=10, random_state=42, n_jobs=1)
            feature_importances = pd.DataFrame(result.importances_mean, index =x_test.columns,  columns=['importance']).sort_values('importance', ascending=False)

            print(feature_importances.head(20))
            fis.append(feature_importances)


    #         sorted_idx = result.importances_mean.argsort()
    #         fig, ax = plt.subplots()
    #         ax.boxplot(
    #             result.importances[sorted_idx].T, vert=False, labels=x_test.columns[sorted_idx]
    #         )
    #         ax.set_title("Permutation Importances (test set)")
    #         fig.tight_layout()
    #         plt.show()
    #     check common entries between x_train and x_test
    #         crs=[]
    #         print('common rows')
    #         for row in x_test:
    # #             print(row)
    #             cr = np.where((x_train == row).all(axis=1))
    #             if len(cr)>0:
    #                 crs.append(cr)
    # #             print(cr[0])
    # #             print(x_train[cr[0]])
    #         print(crs)

        #check duplicates for x_train
    #         num_dups=(x_train[:, np.newaxis] == x_train).all(axis=2).sum(axis=1)
    #         print('Duplicates ' ,np.where((num_dups>1)))

        #predict
            y_pred = clf.predict(x_test)
            matrix=confusion_matrix(y_test,y_pred)
            cf.append(matrix)
            print('Best params')
            print(clf.best_estimator_.get_params())
            print("Accuracy: ",(np.trace(matrix))/matrix.sum()*100)
            ### NEW AUCs
            auc = roc_auc_score(y_test, y_pred)
            aucs.append(auc)


    df_concat = pd.concat(fis)
    print(df_concat.groupby(level=0).mean().sort_values('importance', ascending=False))
    cf.append(df_concat.groupby(level=0).mean().sort_values('importance', ascending=False))
    cf.append(aucs)
    return cf,m


def train_model(m,parameters,x,y):

    print(x.shape)
    print(y.shape)
    #
    empty_train_columns =  []
    miss_mean_columns = x.columns
    for col in x.columns.values:
        # all the values for this feature are null
        if sum(x[col].isnull()) == x.shape[0]:
            empty_train_columns.append(col)
    imputed_train_columns=[c for c in x.columns if c not in empty_train_columns]

    print('empty training columns - ', empty_train_columns)

    print("Imputing missing data")

    imp_mean = SimpleImputer(missing_values=np.nan, strategy='median')

    imp_mean_x=pd.DataFrame(imp_mean.fit_transform(x),index=x.index,columns=imputed_train_columns)
    print("imputed mean x train")
    
    for col in miss_mean_columns:
        x[col]=imp_mean_x[col]

#smote to oversample and balance class distributions
    over = SMOTE()
    under = RandomUnderSampler()
    steps = [('o', over),('u',under)]
    pipeline = Pipeline(steps=steps)
    print(x.isna().sum())
    x, y = pipeline.fit_resample(x, y)

#model fit and prediction
#create model and train
    model = clone(m)
    model.set_params(**parameters)
    model.fit(x, y)
    return model


def output_metrics(matrices,fis,aucs):
    average_matrix=np.mean(matrices,axis=0)
    class_accs = []
    ov_accs=[]
    for matrix in matrices:
        c = []
        ov_acc = (np.trace(matrix))/matrix.sum()*100
        ov_accs.append(ov_acc)
        for i in range(2):
            c.append((matrix[i][i]/matrix[i].sum()*100))
        class_accs.append(c)
    class_acc=np.mean(class_accs,axis=0)
    ov_accs=np.mean(ov_accs,axis=0)
    print("Overall Accuracy :",ov_accs)
    print("Class Accuracy for Low Risk",class_acc[0])
    print("Class Accuracy for High Risk",class_acc[1])
    print('Feature Importances',fis.head(10))
    ##Updated add AUCs
    print('AUCs', aucs)
    return([matrices,fis,ov_accs,class_acc[0],class_acc[1]],np.mean(aucs))

def c_thresholds(fold_tests,fold_preds,t=0.5):
    matrices=[]
    print('fp length', len(fold_preds))
    for fold_ind in range(len(fold_tests)):
        fold_pred=fold_preds[fold_ind]
        fold_test=fold_tests[fold_ind]
        fp=[]
        for pred in fold_pred:
            print(pred[0]/pred.sum())
            if pred[0]/pred.sum() >= t:
                fp.append(0)
            else:
                fp.append(1)
        matrices.append(confusion_matrix(fold_test,fp))
#         print(fold_pred)
    return matrices

def pre_process_data(df):
    df.drop(['rowupdated'],axis=1,inplace=True)
    df = df[df['EDVisit.Age']>=18]
    # Convert the 'EDVisit.RegistrationDateTime' column to a datetime format
    df['EDVisit.RegistrationDateTime'] = pd.to_datetime(df['EDVisit.RegistrationDateTime'], format='%Y-%m-%d %H:%M')

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
    def categorize_time(time_str):
        try:
            # Parse the time using the format '%H:%M:%S'
            time_obj = datetime.strptime(time_str, '%H:%M:%S').time()
    #         print(time_obj)
        except ValueError:
            # Handle cases where parsing fails
            print("failing")
            return None

        # Categorize time based on hour
        if time_obj.hour < 12:
            return 'Morning'
        else:
            return 'Afternoon'

    # Apply the function to create a new column 'Time of Day'
    df['Range of Day'] = df['Registration Time'].apply(categorize_time)

    # Drop rows where 'Time of Day' is None (invalid times)
    df = df.dropna(subset=['Range of Day'])
    
    df.set_index('V_GUID',inplace=True)
    
    df.drop(['Registration Time'], axis = 1, inplace = True)
    
    from pandas.api.types import is_datetime64_any_dtype as is_datetime
    from pandas.api.types import is_object_dtype
    cat_columns = []
    for series_name, series in df.items():
        print(series_name)
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
    print("Pre-processed data")
    
    
    return df

if __name__ == "__main__":
    import config
    args, unknown = _parse_args() #parse arguments
    #load data
    print("reading data")
    data_df = pd.read_csv(os.path.join(args.train, args.file_name))
    data_df = pre_process_data(data_df)
    
#     data_df.set_index('V_GUID', inplace=True)
    print(data_df.dtypes)
    y = data_df['TotalAdmitted'].values #chooses the outcome based on the outcome_type
    x = data_df.drop(['TotalAdmitted','EDVisit.AdmitDateTime','EDVisit.Expired'], axis = 1)
    
    parameters = config.rf_parameters
    print("Parameters are: ")
    print(parameters)
    #train model
    model = train_model(RandomForestClassifier(),parameters,x,y)
    print("Training complete, saving model now..")
    #upload model
    import joblib
    joblib.dump(model, os.path.join(args.sm_model_dir, "model.joblib"))
    print("Model saved")
    inference_script_source = os.path.join(args.train, "inference.py")  # Ensure this file exists
    inference_script_dest = os.path.join(args.sm_model_dir, "inference.py")
    
    if os.path.exists(inference_script_source):
        import shutil
        shutil.copy(inference_script_source, inference_script_dest)
        print("Inference script saved at:", inference_script_dest)
    else:
        print("Warning: inference.py not found! Ensure it exists in the working directory.")
        
    requirements_script_source = os.path.join(args.train, "requirements.txt")  # Ensure this file exists
    requirements_script_dest = os.path.join(args.sm_model_dir, "requirements.txt")
    
    if os.path.exists(requirements_script_source):
        import shutil
        shutil.copy(requirements_script_source, requirements_script_dest)
        print("Inference script saved at:", requirements_script_dest)
    else:
        print("Warning: requirements.txt not found! Ensure it exists in the working directory.")

    
    
    ## Train using Cross validation results 
#     cf,m = train_model_cv(RandomForestClassifier(),parameters,x,y)
#     matrices=cf[:-2]
#     fis=cf[-2]
#     aucs=cf[-1]
#     result=output_metrics(matrices,fis,aucs)
#     with open(args.sm_model_dir+'/RF'+'_'+args.test_version+'_results'+'.pkl', 'wb') as file:
#         # A new file will be created
#         pickle.dump(result, file)
#     with open(args.sm_model_dir+'/RF'+'_'+args.test_version+'_model'+'.pkl', 'wb') as file:
#         # A new file will be created
#         pickle.dump(clf, file)
