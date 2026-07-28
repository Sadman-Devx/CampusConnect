"""
Synthetic OULAD-inspired dataset generator (real internet access নেই বলে
আসল OULAD CSV download করা যায়নি — feature গুলো CampusConnect-এর নিজের
DB থেকে যা বের করা যায় তার সাথে মিল রেখে বানানো)।
"""
import numpy as np
import pandas as pd

FEATURE_COLUMNS = [
    'gpa',
    'academic_year_progress',
    'engagement_score',
    'days_since_last_active',
    'advising_engagement',
]
LABEL_COLUMN = 'at_risk'


def generate_synthetic_dataset(n_samples: int = 4000, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)

    gpa = np.clip(rng.normal(loc=2.85, scale=0.65, size=n_samples), 0.0, 4.0)
    academic_year_progress = rng.integers(1, 6, size=n_samples)
    engagement_score = np.clip(rng.gamma(shape=2.0, scale=6.0, size=n_samples), 0, 100)
    days_since_last_active = np.clip(rng.exponential(scale=10.0, size=n_samples), 0, 120)
    advising_engagement = rng.poisson(lam=1.2, size=n_samples)

    z_gpa = (gpa - gpa.mean()) / gpa.std()
    z_engagement = (engagement_score - engagement_score.mean()) / engagement_score.std()
    z_inactivity = (days_since_last_active - days_since_last_active.mean()) / days_since_last_active.std()
    z_advising = (advising_engagement - advising_engagement.mean()) / advising_engagement.std()

    linear_risk = (
        -1.35 * z_gpa - 0.95 * z_engagement + 1.10 * z_inactivity - 0.40 * z_advising
        + rng.normal(0, 0.5, size=n_samples)
    )
    probability = 1 / (1 + np.exp(-linear_risk))
    at_risk = rng.binomial(1, probability)

    df = pd.DataFrame({
        'gpa': np.round(gpa, 2),
        'academic_year_progress': academic_year_progress,
        'engagement_score': np.round(engagement_score, 1),
        'days_since_last_active': np.round(days_since_last_active, 1),
        'advising_engagement': advising_engagement,
        LABEL_COLUMN: at_risk,
    })
    return df[FEATURE_COLUMNS + [LABEL_COLUMN]]