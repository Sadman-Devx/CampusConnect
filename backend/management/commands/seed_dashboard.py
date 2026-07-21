from django.core.management.base import BaseCommand
from django.utils import timezone
from dashboard.models import AdvisingItem, FinancialAidItem, RegistrationItem, EventItem
from datetime import timedelta


class Command(BaseCommand):
    help = "Seed dummy dashboard data"

    def handle(self, *args, **kwargs):
        AdvisingItem.objects.create(title="Meet with Academic Advisor", advisor_name="Dr. Rahim Uddin", status="Available")
        AdvisingItem.objects.create(title="Course Planning Session", advisor_name="Ms. Nusrat Jahan", status="Booked")

        FinancialAidItem.objects.create(title="Merit Scholarship 2026", amount=25000, deadline="2026-08-15")
        FinancialAidItem.objects.create(title="Need-Based Grant", amount=15000, deadline="2026-09-01")

        RegistrationItem.objects.create(course_code="SE-401", course_title="Software Architecture", seats_available=12, schedule="Sun/Tue 10:00 AM")
        RegistrationItem.objects.create(course_code="SE-405", course_title="AI in Software Engineering", seats_available=5, schedule="Mon/Wed 2:00 PM")

        EventItem.objects.create(title="Career Fair 2026", location="DIU Auditorium", date=timezone.now() + timedelta(days=10))
        EventItem.objects.create(title="Tech Talk: AI in EdTech", location="Room 502", date=timezone.now() + timedelta(days=3))

        self.stdout.write(self.style.SUCCESS("Dashboard dummy data seeded successfully!"))