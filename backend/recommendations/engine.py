"""
Content-Based Filtering Recommendation Engine (FR-04)
======================================================

Ranks scholarships (dashboard.FinancialAidItem) and campus events
(dashboard.EventItem) for a student by comparing the *content* of each
item (its eligibility attributes: major, academic year, minimum GPA)
against the *content* of the student's profile (major, academic year,
GPA). This is content-based filtering: an item is recommended because
its own attributes match the user's profile attributes -- no other
users' behaviour or ratings are involved (unlike collaborative
filtering).

Design
------
Real scholarships/events have *hard* eligibility rules -- a "Computer
Science only" scholarship is not "somewhat" available to a Business
student. So the engine works in two stages:

1. Eligibility gate (AND logic, per item):
     - major:  item.eligible_majors is empty (open to all)
               OR student's major is in that list
     - year:   item.eligible_years is empty (open to all)
               OR student's academic_year is in that list
     - gpa:    item.min_gpa is empty (no requirement)
               OR student's gpa >= item.min_gpa
   If a dimension is constrained by the item but the student hasn't
   filled in that profile field, the student is treated as not (yet)
   eligible for it (they'll see a reason asking them to complete their
   profile). An item that fails ANY dimension gets a match score of
   0.0 and is filtered out by default.

2. Content-based ranking score (0.0-1.0) for the items that pass the
   gate, so the *most relevant* eligible opportunities surface first:
     - 0.50 baseline for every eligible item
     - +0.25 if the item specifically targets the student's major
       (i.e. it isn't just "open to everyone")
     - +0.15 if the item specifically targets the student's academic year
     - +0.10 scaled by how far above the minimum GPA the student sits
       (bigger cushion above the requirement -> slightly higher score)

This keeps eligibility correct (no student is ever shown a scholarship
they don't actually qualify for) while still ranking by relevance
instead of just returning eligible items in arbitrary order.

Pure Python, no numpy / scikit-learn -- fast at the scale of a single
campus catalogue (O(items), linear scan).
"""
from decimal import Decimal, InvalidOperation

MAJOR_BONUS = 0.25
YEAR_BONUS = 0.15
GPA_BONUS = 0.10
BASELINE = 0.50
GPA_MAX = Decimal("4.00")


def _normalize(value):
    """Lowercase + strip a label so 'Computer Science' == 'computer science'."""
    return (value or "").strip().lower()


def _to_decimal(value):
    if value is None:
        return None
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError):
        return None


class _DimensionResult:
    __slots__ = ("eligible", "targeted", "reason")

    def __init__(self, eligible, targeted, reason):
        self.eligible = eligible      # can the student have this item at all?
        self.targeted = targeted      # is it specifically for this student (vs open to all)?
        self.reason = reason          # human-readable explanation


class ContentBasedRecommender:
    """Evaluates eligibility and computes a content-based match score per item."""

    def __init__(self, user):
        self.user = user

    def has_profile(self):
        """True if the student has filled in at least one profile attribute."""
        return bool(self.user.major or self.user.academic_year or self.user.gpa is not None)

    # ---- per-dimension eligibility checks --------------------------------

    def _check_major(self, item):
        eligible_majors = list(getattr(item, "eligible_majors", None) or [])
        if not eligible_majors:
            return _DimensionResult(True, False, "Open to all majors")
        if not self.user.major:
            return _DimensionResult(False, True, "Complete your profile (major) to check eligibility")
        normalized_list = {_normalize(m) for m in eligible_majors}
        if _normalize(self.user.major) in normalized_list:
            return _DimensionResult(True, True, f"Matches your major ({self.user.major})")
        return _DimensionResult(False, True, f"Not open to your major ({self.user.major})")

    def _check_year(self, item):
        eligible_years = list(getattr(item, "eligible_years", None) or [])
        if not eligible_years:
            return _DimensionResult(True, False, "Open to all academic years")
        if not self.user.academic_year:
            return _DimensionResult(False, True, "Complete your profile (academic year) to check eligibility")
        normalized_list = {_normalize(y) for y in eligible_years}
        if _normalize(self.user.academic_year) in normalized_list:
            return _DimensionResult(True, True, f"Open to your academic year ({self.user.academic_year})")
        return _DimensionResult(False, True, f"Not open to your academic year ({self.user.academic_year})")

    def _check_gpa(self, item):
        min_gpa = getattr(item, "min_gpa", None)
        if min_gpa is None:
            return _DimensionResult(True, False, "No minimum GPA required"), 0.0
        if self.user.gpa is None:
            return _DimensionResult(False, True, "Complete your profile (GPA) to check eligibility"), 0.0

        min_gpa_d = _to_decimal(min_gpa)
        gpa_d = _to_decimal(self.user.gpa)
        if gpa_d < min_gpa_d:
            return _DimensionResult(False, True, f"Requires GPA {min_gpa}+ (yours: {self.user.gpa})"), 0.0

        headroom = float(GPA_MAX - min_gpa_d) or 1.0
        margin_bonus = min(float(gpa_d - min_gpa_d) / headroom, 1.0)
        return _DimensionResult(True, True, f"Your GPA {self.user.gpa} meets the {min_gpa} minimum"), margin_bonus

    # ---- public API -------------------------------------------------------

    def score_item(self, item):
        """
        Evaluate a single item for this student.
        Returns (score: float in [0,1], reasons: list[str]).
        A score of 0.0 means the student is not eligible for this item.
        """
        major_result = self._check_major(item)
        year_result = self._check_year(item)
        gpa_result, gpa_margin_bonus = self._check_gpa(item)

        reasons = [major_result.reason, year_result.reason, gpa_result.reason]

        if not (major_result.eligible and year_result.eligible and gpa_result.eligible):
            return 0.0, reasons

        score = BASELINE
        if major_result.targeted:
            score += MAJOR_BONUS
        if year_result.targeted:
            score += YEAR_BONUS
        score += GPA_BONUS * gpa_margin_bonus

        return round(min(score, 1.0), 4), reasons

    def rank(self, items):
        """
        Rank an iterable of FinancialAidItem/EventItem instances for this
        student. Returns a list of (item, score, reasons) tuples sorted by
        score descending (highest match first, ineligible items score 0.0
        and sort last).
        """
        results = [(item, *self.score_item(item)) for item in items]
        results.sort(key=lambda triple: triple[1], reverse=True)
        return results