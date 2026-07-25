from rest_framework import serializers
from dashboard.models import FinancialAidItem, EventItem


class _MatchFieldsMixin(serializers.Serializer):
    """
    Shared SerializerMethodFields that read precomputed scores/reasons out
    of `self.context['scores']` (a dict keyed by item id), so the ranking
    is only ever computed once per request in the view, not per-object.
    """
    match_score = serializers.SerializerMethodField()
    match_percentage = serializers.SerializerMethodField()
    match_reasons = serializers.SerializerMethodField()

    def _match_result(self, obj):
        return self.context.get("scores", {}).get(obj.id, {"score": 0.0, "reasons": []})

    def get_match_score(self, obj):
        return round(self._match_result(obj)["score"], 4)

    def get_match_percentage(self, obj):
        return round(self._match_result(obj)["score"] * 100, 1)

    def get_match_reasons(self, obj):
        return self._match_result(obj)["reasons"]


class ScholarshipRecommendationSerializer(_MatchFieldsMixin, serializers.ModelSerializer):
    class Meta:
        model = FinancialAidItem
        fields = [
            'id', 'title', 'amount', 'deadline', 'description',
            'eligible_majors', 'eligible_years', 'min_gpa',
            'match_score', 'match_percentage', 'match_reasons',
        ]


class EventRecommendationSerializer(_MatchFieldsMixin, serializers.ModelSerializer):
    class Meta:
        model = EventItem
        fields = [
            'id', 'title', 'location', 'date', 'description',
            'eligible_majors', 'eligible_years',
            'match_score', 'match_percentage', 'match_reasons',
        ]