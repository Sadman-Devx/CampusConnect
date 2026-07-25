from decimal import Decimal
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from dashboard.models import FinancialAidItem, EventItem
from .engine import ContentBasedRecommender

User = get_user_model()


class ContentBasedRecommenderTests(APITestCase):
    """Unit tests for the pure scoring/ranking logic in engine.py."""

    def setUp(self):
        self.student = User.objects.create_user(
            username="alice", password="pass12345",
            major="Computer Science", academic_year="Junior", gpa=Decimal("3.60"),
        )
        self.matching_scholarship = FinancialAidItem.objects.create(
            title="CS Excellence Scholarship", amount=20000,
            eligible_majors=["Computer Science"], eligible_years=["Junior", "Senior"],
            min_gpa=Decimal("3.50"),
        )
        self.high_bar_scholarship = FinancialAidItem.objects.create(
            title="High Achiever Scholarship", amount=30000,
            eligible_majors=["Computer Science"], min_gpa=Decimal("3.90"),
        )
        self.other_major_scholarship = FinancialAidItem.objects.create(
            title="Business Grant", amount=10000,
            eligible_majors=["Business Administration"], min_gpa=Decimal("3.00"),
        )
        self.open_scholarship = FinancialAidItem.objects.create(
            title="Open Merit Award", amount=5000,
        )

    def test_perfect_match_ranks_highest(self):
        recommender = ContentBasedRecommender(self.student)
        ranked = recommender.rank(FinancialAidItem.objects.all())
        top_item, top_score, _ = ranked[0]
        self.assertEqual(top_item, self.matching_scholarship)
        self.assertGreater(top_score, 0.9)

    def test_gpa_below_requirement_is_ineligible(self):
        recommender = ContentBasedRecommender(self.student)
        scores = {item.id: score for item, score, _ in recommender.rank(FinancialAidItem.objects.all())}
        self.assertEqual(scores[self.high_bar_scholarship.id], 0.0)

    def test_wrong_major_scores_zero(self):
        recommender = ContentBasedRecommender(self.student)
        scores = {item.id: score for item, score, _ in recommender.rank(FinancialAidItem.objects.all())}
        self.assertEqual(scores[self.other_major_scholarship.id], 0.0)

    def test_open_item_matches_but_ranks_below_targeted_match(self):
        recommender = ContentBasedRecommender(self.student)
        scores = {item.id: score for item, score, _ in recommender.rank(FinancialAidItem.objects.all())}
        self.assertGreater(scores[self.open_scholarship.id], 0.0)
        self.assertGreater(scores[self.matching_scholarship.id], scores[self.open_scholarship.id])

    def test_incomplete_profile_is_detected(self):
        blank_student = User.objects.create_user(username="carol", password="pass12345")
        recommender = ContentBasedRecommender(blank_student)
        self.assertFalse(recommender.has_profile())
        self.assertTrue(ContentBasedRecommender(self.student).has_profile())


class RecommendationAPITests(APITestCase):
    """Integration tests for GET /api/recommendations/."""

    def setUp(self):
        self.student = User.objects.create_user(
            username="bob", password="pass12345",
            major="Computer Science", academic_year="Senior", gpa=Decimal("3.80"),
        )
        FinancialAidItem.objects.create(
            title="CS Senior Award", amount=15000,
            eligible_majors=["Computer Science"], eligible_years=["Senior"], min_gpa=Decimal("3.50"),
        )
        EventItem.objects.create(
            title="CS Career Fair", date=timezone.now() + timedelta(days=5),
            eligible_majors=["Computer Science"],
        )

    def test_requires_authentication(self):
        response = self.client.get("/api/recommendations/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_returns_ranked_recommendations(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get("/api/recommendations/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("scholarships", response.data)
        self.assertIn("events", response.data)
        self.assertTrue(response.data["profile_complete"])
        self.assertGreater(response.data["scholarships"][0]["match_score"], 0)

    def test_category_filter_scholarships_only(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get("/api/recommendations/?category=scholarships")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("scholarships", response.data)
        self.assertNotIn("events", response.data)

    def test_invalid_category_returns_400(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get("/api/recommendations/?category=invalid")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_limit_param_caps_results(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get("/api/recommendations/?category=scholarships&limit=0")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertLessEqual(len(response.data["scholarships"]), 1)

    def test_ineligible_items_hidden_by_default_but_visible_with_min_score_zero(self):
        FinancialAidItem.objects.create(
            title="Grad-Only Fellowship", amount=5000,
            eligible_years=["Graduate"],
        )
        self.client.force_authenticate(user=self.student)
        default_response = self.client.get("/api/recommendations/?category=scholarships")
        titles_default = [s["title"] for s in default_response.data["scholarships"]]
        self.assertNotIn("Grad-Only Fellowship", titles_default)

        all_response = self.client.get("/api/recommendations/?category=scholarships&min_score=0")
        titles_all = [s["title"] for s in all_response.data["scholarships"]]
        self.assertIn("Grad-Only Fellowship", titles_all)

    def test_profile_update_via_me_endpoint(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.patch("/api/auth/me/", {"major": "Data Science", "gpa": "3.20"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["major"], "Data Science")