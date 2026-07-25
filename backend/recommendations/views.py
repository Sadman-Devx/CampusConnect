from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from dashboard.models import FinancialAidItem, EventItem
from .engine import ContentBasedRecommender
from .serializers import ScholarshipRecommendationSerializer, EventRecommendationSerializer

VALID_CATEGORIES = ("all", "scholarships", "events")
DEFAULT_LIMIT = 10
MAX_LIMIT = 50
# By default, items the student is not eligible for (score == 0.0) are
# left out of the recommendation list. Pass ?min_score=0 explicitly to
# get every item back (e.g. for a "why am I not eligible" debug view).
DEFAULT_MIN_SCORE = 0.01


class RecommendationView(APIView):
    """
    FR-04 - Content-Based Recommendation Engine.

    GET /api/recommendations/

    Query params (all optional):
        category   : "all" | "scholarships" | "events"   (default "all")
        limit      : max results per category, 1-50       (default 10)
        min_score  : minimum match score 0.0-1.0 to include
                     (default 0.01 -> ineligible items, score 0.0, are
                     hidden by default; pass min_score=0 to see them,
                     each with a match_reasons explanation of why not)

    Ranks scholarships and/or events for the authenticated student by
    comparing the student's major / academic_year / gpa against each
    item's eligibility criteria, using content-based filtering -- see
    recommendations/engine.py.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        category = request.query_params.get("category", "all").lower()
        if category not in VALID_CATEGORIES:
            return Response(
                {"detail": f"Invalid category. Use one of: {', '.join(VALID_CATEGORIES)}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        limit = self._parse_int(request.query_params.get("limit"), default=DEFAULT_LIMIT)
        if limit is None:
            return Response({"detail": "limit must be an integer."}, status=status.HTTP_400_BAD_REQUEST)
        limit = max(1, min(limit, MAX_LIMIT))

        min_score = self._parse_float(request.query_params.get("min_score"), default=DEFAULT_MIN_SCORE)
        if min_score is None:
            return Response({"detail": "min_score must be a number."}, status=status.HTTP_400_BAD_REQUEST)
        min_score = max(0.0, min(min_score, 1.0))

        user = request.user
        recommender = ContentBasedRecommender(user)

        data = {
            "profile_complete": recommender.has_profile(),
            "student_profile": {
                "major": user.major,
                "academic_year": user.academic_year,
                "gpa": user.gpa,
            },
        }

        if category in ("all", "scholarships"):
            data["scholarships"] = self._build_section(
                recommender, FinancialAidItem.objects.all(),
                ScholarshipRecommendationSerializer, limit, min_score,
            )

        if category in ("all", "events"):
            data["events"] = self._build_section(
                recommender, EventItem.objects.all(),
                EventRecommendationSerializer, limit, min_score,
            )

        return Response(data, status=status.HTTP_200_OK)

    @staticmethod
    def _build_section(recommender, queryset, serializer_class, limit, min_score):
        ranked = recommender.rank(list(queryset))
        scores = {item.id: {"score": score, "reasons": reasons} for item, score, reasons in ranked}
        top_items = [item for item, score, _ in ranked if score >= min_score][:limit]
        return serializer_class(top_items, many=True, context={"scores": scores}).data

    @staticmethod
    def _parse_int(value, default):
        if value is None:
            return default
        try:
            return int(value)
        except ValueError:
            return None

    @staticmethod
    def _parse_float(value, default):
        if value is None:
            return default
        try:
            return float(value)
        except ValueError:
            return None