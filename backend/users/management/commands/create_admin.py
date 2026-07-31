from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = "Create an admin account (role='admin'). Not exposed via public registration by design."

    def add_arguments(self, parser):
        parser.add_argument('--username', required=True)
        parser.add_argument('--email', required=True)
        parser.add_argument('--password', required=True)

    def handle(self, *args, **options):
        username = options['username']
        email = options['email']
        password = options['password']

        if User.objects.filter(username=username).exists():
            raise CommandError(f"User '{username}' already exists.")

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            role='admin',
            is_staff=True,       # so /admin/ (Django admin panel) also works
            is_verified=True,
        )
        self.stdout.write(self.style.SUCCESS(f"Admin account created: {user.username} (role={user.role})"))