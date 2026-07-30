from django.core.management.base import BaseCommand
from django.utils import timezone
from dashboard.models import AdvisingItem, FinancialAidItem, RegistrationItem, EventItem
from datetime import timedelta


class Command(BaseCommand):
    help = "Seed dummy dashboard data (safe to re-run — won't create duplicates)"

    def handle(self, *args, **kwargs):
        AdvisingItem.objects.get_or_create(
            title="Meet with Academic Advisor",
            defaults={"advisor_name": "Dr. Rahim Uddin", "status": "Available"},
        )
        AdvisingItem.objects.get_or_create(
            title="Course Planning Session",
            defaults={"advisor_name": "Ms. Nusrat Jahan", "status": "Booked"},
        )

        FinancialAidItem.objects.get_or_create(
            title="Merit Scholarship 2026",
            defaults={"amount": 25000, "deadline": "2026-08-15"},
        )
        FinancialAidItem.objects.get_or_create(
            title="Need-Based Grant",
            defaults={"amount": 15000, "deadline": "2026-09-01"},
        )

        RegistrationItem.objects.get_or_create(
            course_code="SE-401",
            defaults={"course_title": "Software Architecture", "seats_available": 12, "schedule": "Sun/Tue 10:00 AM"},
        )
        RegistrationItem.objects.get_or_create(
            course_code="SE-405",
            defaults={"course_title": "AI in Software Engineering", "seats_available": 5, "schedule": "Mon/Wed 2:00 PM"},
        )

        EventItem.objects.get_or_create(
            title="Career Fair 2026",
            defaults={"location": "DIU Auditorium", "date": timezone.now() + timedelta(days=10)},
        )
        EventItem.objects.get_or_create(
            title="Tech Talk: AI in EdTech",
            defaults={"location": "Room 502", "date": timezone.now() + timedelta(days=3)},
        )

        self.stdout.write(self.style.SUCCESS("Dashboard dummy data seeded successfully!"))