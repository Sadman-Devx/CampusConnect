"""Logistic Regression বাছার কারণ: coefficient interpretable, তাই advisor-কে
"কেন risky" explain করা যায় (top_factors) — XGBoost এখানে দরকার নেই।"""
import json
from pathlib import Path

import joblib
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, roc_auc_score, f1_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from .dataset import FEATURE_COLUMNS, LABEL_COLUMN, generate_synthetic_dataset

ARTIFACT_DIR = Path(__file__).resolve().parent / 'artifacts'
MODEL_PATH = ARTIFACT_DIR / 'risk_model.joblib'
METRICS_PATH = ARTIFACT_DIR / 'metrics.json'
MODEL_VERSION = 'v1'


def train_and_save(n_samples: int = 4000, seed: int = 42, test_size: float = 0.2) -> dict:
    df = generate_synthetic_dataset(n_samples=n_samples, seed=seed)
    X = df[FEATURE_COLUMNS]
    y = df[LABEL_COLUMN]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=seed, stratify=y,
    )

    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('classifier', LogisticRegression(max_iter=1000, class_weight='balanced', random_state=seed)),
    ])
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)[:, 1]

    metrics = {
        'model_version': MODEL_VERSION,
        'n_samples': n_samples, 'n_train': len(X_train), 'n_test': len(X_test),
        'accuracy': round(accuracy_score(y_test, y_pred), 4),
        'precision': round(precision_score(y_test, y_pred, zero_division=0), 4),
        'recall': round(recall_score(y_test, y_pred, zero_division=0), 4),
        'f1_score': round(f1_score(y_test, y_pred, zero_division=0), 4),
        'roc_auc': round(roc_auc_score(y_test, y_proba), 4),
        'feature_order': FEATURE_COLUMNS,
        'coefficients': dict(zip(FEATURE_COLUMNS, pipeline.named_steps['classifier'].coef_[0].round(4).tolist())),
        'intercept': round(float(pipeline.named_steps['classifier'].intercept_[0]), 4),
    }

    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump({'pipeline': pipeline, 'model_version': MODEL_VERSION, 'feature_order': FEATURE_COLUMNS}, MODEL_PATH)
    METRICS_PATH.write_text(json.dumps(metrics, indent=2))
    return metrics


if __name__ == '__main__':
    print(json.dumps(train_and_save(), indent=2))