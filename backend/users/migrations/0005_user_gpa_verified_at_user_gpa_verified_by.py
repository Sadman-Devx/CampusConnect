import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('users', '0004_user_advisor'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='gpa_verified_at',
            field=models.DateTimeField(blank=True, help_text='When the GPA above was last confirmed. Cleared automatically if the student edits their academic info.', null=True),
        ),
        migrations.AddField(
            model_name='user',
            name='gpa_verified_by',
            field=models.ForeignKey(blank=True, help_text="Advisor/admin who last confirmed this student's self-reported GPA.", limit_choices_to={'role__in': ['advisor', 'admin']}, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='gpa_verifications', to=settings.AUTH_USER_MODEL),
        ),
    ]