from pathlib import Path

import joblib
import pandas as pd

from .dataset import FEATURE_COLUMNS
from .train import MODEL_PATH

LOW_THRESHOLD = 40.0
HIGH_THRESHOLD = 70.0

_FACTOR_DESCRIPTIONS = {
    'gpa': {'direction': 'low', 'low': "GPA is low relative to peers"},
    'engagement_score': {'direction': 'low', 'low': "Low portal/course engagement in the last 30 days"},
    'days_since_last_active': {'direction': 'high', 'high': "Long gap since last activity on the platform"},
    'advising_engagement': {'direction': 'low', 'low': "Little to no contact with an academic advisor"},
    'academic_year_progress': {'direction': 'low', 'low': "Early in the program with limited track record"},
}


class RiskModelNotTrainedError(RuntimeError):
    pass


class _ModelCache:
    pipeline = None
    model_version = None
    feature_order = None
    mtime = None

    @classmethod
    def get(cls):
        path = Path(MODEL_PATH)
        if not path.exists():
            raise RiskModelNotTrainedError(
                "No trained risk model found. Run `python manage.py train_risk_model` first."
            )
        current_mtime = path.stat().st_mtime
        if cls.pipeline is None or cls.mtime != current_mtime:
            artifact = joblib.load(path)
            cls.pipeline = artifact['pipeline']
            cls.model_version = artifact.get('model_version', 'v1')
            cls.feature_order = artifact.get('feature_order', FEATURE_COLUMNS)
            cls.mtime = current_mtime
        return cls

    @classmethod
    def reset(cls):
        cls.pipeline = None
        cls.mtime = None


def score_to_level(score: float) -> str:
    if score >= HIGH_THRESHOLD:
        return 'high'
    if score >= LOW_THRESHOLD:
        return 'medium'
    return 'low'


def _top_factors(features: dict, limit: int = 3) -> list:
    model = _ModelCache.get()
    classifier = model.pipeline.named_steps['classifier']
    scaler = model.pipeline.named_steps['scaler']
    coefs = dict(zip(model.feature_order, classifier.coef_[0]))

    contributions = []
    for name in model.feature_order:
        raw_value = features.get(name, 0.0)
        idx = model.feature_order.index(name)
        z = (raw_value - scaler.mean_[idx]) / (scaler.scale_[idx] or 1.0)
        contributions.append((name, coefs[name] * z))

    contributions.sort(key=lambda pair: pair[1], reverse=True)
    factors = []
    for name, contribution in contributions[:limit]:
        if contribution <= 0:
            continue
        desc = _FACTOR_DESCRIPTIONS.get(name)
        if desc:
            factors.append(desc[desc['direction']])
    return factors


def predict_risk(features: dict) -> dict:
    model = _ModelCache.get()
    row = pd.DataFrame([{name: features[name] for name in model.feature_order}], columns=model.feature_order)

    probability = float(model.pipeline.predict_proba(row)[0][1])
    score = round(probability * 100, 2)
    risk_level = score_to_level(score)
    top_factors = _top_factors(features)

    return {
        'probability': round(probability, 4),
        'score': score,
        'risk_level': risk_level,
        'top_factors': top_factors,
        'model_version': model.model_version,
    }