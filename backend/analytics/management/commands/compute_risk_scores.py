from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from analytics.services import RiskScoringService

User = get_user_model()


class Command(BaseCommand):
    help = "Compute/refresh risk scores for all students, or one via --student-id."

    def add_arguments(self, parser):
        parser.add_argument('--student-id', type=int, default=None)

    def handle(self, *args, **options):
        student_id = options.get('student_id')
        if student_id:
            students = User.objects.filter(pk=student_id, role='student')
            if not students.exists():
                self.stderr.write(self.style.ERROR(f"No student with id={student_id}"))
                return
        else:
            students = User.objects.filter(role='student')
        results = RiskScoringService.compute_for_students(students)
        self.stdout.write(self.style.SUCCESS(f"Computed risk scores for {len(results)} student(s)."))