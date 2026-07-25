from decimal import Decimal
from django.core.management.base import BaseCommand
from dashboard.models import FinancialAidItem, EventItem


class Command(BaseCommand):
    help = (
        "Attach demo eligibility criteria (major/year/GPA) to the scholarships "
        "and events created by seed_dashboard, and add a couple of extra "
        "examples so the FR-04 recommendation engine has data to rank."
    )

    def handle(self, *args, **kwargs):
        scholarship_criteria = {
            "Merit Scholarship 2026": dict(
                eligible_majors=["Computer Science", "Software Engineering"],
                eligible_years=["Junior", "Senior"],
                min_gpa=Decimal("3.50"),
            ),
            "Need-Based Grant": dict(
                eligible_majors=[],
                eligible_years=[],
                min_gpa=Decimal("2.50"),
            ),
        }
        for title, criteria in scholarship_criteria.items():
            updated = FinancialAidItem.objects.filter(title=title).update(**criteria)
            if updated:
                self.stdout.write(f"Updated eligibility for scholarship '{title}'")

        FinancialAidItem.objects.get_or_create(
            title="Business Leaders Grant",
            defaults=dict(
                amount=12000,
                eligible_majors=["Business Administration"],
                eligible_years=["Sophomore", "Junior"],
                min_gpa=Decimal("3.00"),
            ),
        )
        FinancialAidItem.objects.get_or_create(
            title="Freshman Starter Award",
            defaults=dict(
                amount=8000,
                eligible_majors=[],
                eligible_years=["Freshman"],
                min_gpa=Decimal("2.75"),
            ),
        )

        event_criteria = {
            "Career Fair 2026": dict(eligible_majors=[], eligible_years=[]),
            "Tech Talk: AI in EdTech": dict(
                eligible_majors=["Computer Science", "Software Engineering"],
                eligible_years=[],
            ),
        }
        for title, criteria in event_criteria.items():
            updated = EventItem.objects.filter(title=title).update(**criteria)
            if updated:
                self.stdout.write(f"Updated eligibility for event '{title}'")

        self.stdout.write(self.style.SUCCESS("Recommendation demo eligibility data seeded successfully!"))