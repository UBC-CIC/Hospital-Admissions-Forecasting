import argparse
import joblib
import os
import json
import numpy as np
import pandas as pd
import pickle
from sklearn.model_selection import StratifiedKFold, GridSearchCV
from imblearn.over_sampling import SMOTE
from imblearn.under_sampling import RandomUnderSampler
from imblearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.inspection import permutation_importance
from sklearn.metrics import confusion_matrix, roc_auc_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.base import clone


def _parse_args():
    """Parses arguments passed from SageMaker."""
    parser = argparse.ArgumentParser()
    parser.add_argument("--model_dir", type=str)
    parser.add_argument("--sm_model_dir", type=str, default=os.environ.get("SM_MODEL_DIR"))
    parser.add_argument("--train", type=str, default=os.environ.get("SM_CHANNEL_TRAINING"))
    parser.add_argument("--file_name", type=str, default="dummy_training_data.csv")
    parser.add_argument("--test_version", type=str, default="v1")  # Default test version
    return parser.parse_known_args()


def _load_training_data(base_dir, file_name):
    """Loads training data from CSV."""
    df = pd.read_csv(os.path.join(base_dir, file_name))
    return df


def train_model(model, parameters, X, y):
    """Trains the model using cross-validation and returns results."""
    cf = []
    fis = []
    aucs = []
    
    # 3 runs of cross-validation
    for rs in [1, 2, 3, 4, 5]:
        skf = StratifiedKFold(n_splits=8, shuffle=True, random_state=rs)
        skf.get_n_splits(X, y)
        
        for train_index, test_index in skf.split(X, y):
            X_train, X_test = X.iloc[train_index, :], X.iloc[test_index, :]
            y_train, y_test = y[train_index], y[test_index]

            # Handle missing values
            imputer = SimpleImputer(missing_values=np.nan, strategy="median")
            X_train = pd.DataFrame(imputer.fit_transform(X_train), columns=X.columns, index=X_train.index)
            X_test = pd.DataFrame(imputer.transform(X_test), columns=X.columns, index=X_test.index)

            # SMOTE for class balancing
            over = SMOTE()
            under = RandomUnderSampler()
            pipeline = Pipeline(steps=[("o", over), ("u", under)])
            X_train, y_train = pipeline.fit_resample(X_train, y_train)

            # Model training
            clf = GridSearchCV(model, parameters, cv=5)
            clf.fit(X_train, y_train)
            best_model = clf.best_estimator_

            # Feature importance
            result = permutation_importance(best_model, X_test, y_test, n_repeats=10, random_state=42, n_jobs=1)
            feature_importances = pd.DataFrame(result.importances_mean, index=X_test.columns, columns=["importance"]).sort_values("importance", ascending=False)
            fis.append(feature_importances)

            # Prediction and evaluation
            y_pred = best_model.predict(X_test)
            matrix = confusion_matrix(y_test, y_pred)
            cf.append(matrix)
            auc = roc_auc_score(y_test, y_pred)
            aucs.append(auc)

    # Aggregating feature importances
    df_concat = pd.concat(fis)
    final_fis = df_concat.groupby(level=0).mean().sort_values("importance", ascending=False)
    
    return cf, final_fis, aucs, best_model


def output_metrics(matrices, fis, aucs):
    """Calculates model performance metrics."""
    ov_accs = [np.trace(matrix) / matrix.sum() * 100 for matrix in matrices]
    overall_accuracy = np.mean(ov_accs)

    print(f"Overall Accuracy: {overall_accuracy:.2f}%")
    print(f"Feature Importances:\n{fis.head(10)}")
    print(f"AUC Scores: {aucs}")

    return {
        "matrices": matrices,
        "feature_importances": fis,
        "overall_accuracy": overall_accuracy,
        "auc_scores": aucs,
    }


if __name__ == "__main__":
    args, unknown = _parse_args()
    
    print("📂 Loading training data...")
    data_df = _load_training_data(args.train, args.file_name)
    
    y = data_df["TotalAdmitted"].values
    X = data_df.drop(columns=["TotalAdmitted", "EDVisit.AdmitDateTime", "EDVisit.Expired"])

    parameters = {
        "max_depth": [10],
        "n_estimators": [50, 100],
        "max_features": [5, "auto"],
    }

    print("🚀 Training model...")
    cf, fis, aucs, best_model = train_model(RandomForestClassifier(), parameters, X, y)
    result = output_metrics(cf, fis, aucs)

    print("💾 Saving model to S3...")
    model_path = os.path.join(args.sm_model_dir, "model.pkl")
    with open(model_path, "wb") as model_file:
        pickle.dump(best_model, model_file)
    
    print(f"✅ Model saved: {model_path}")
