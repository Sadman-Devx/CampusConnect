import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('advising', '0002_advisorprofile'),
    ]

    operations = [
        migrations.CreateModel(
            name='AdvisorAvailabilityRecurringRule',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('weekday', models.PositiveSmallIntegerField(choices=[(0, 'Monday'), (1, 'Tuesday'), (2, 'Wednesday'), (3, 'Thursday'), (4, 'Friday'), (5, 'Saturday'), (6, 'Sunday')])),
                ('start_time', models.TimeField()),
                ('end_time', models.TimeField()),
                ('effective_until', models.DateField(blank=True, help_text='Optional last date this rule should generate slots for. Leave blank for no end date.', null=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('advisor', models.ForeignKey(limit_choices_to={'role': 'advisor'}, on_delete=django.db.models.deletion.CASCADE, related_name='recurring_rules', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['weekday', 'start_time'],
            },
        ),
        migrations.AddField(
            model_name='appointmentbooking',
            name='proposed_slot',
            field=models.ForeignKey(blank=True, help_text='Alternate slot the advisor has proposed instead of the originally requested one.', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reschedule_proposals', to='advising.advisoravailability'),
        ),
        migrations.AlterField(
            model_name='appointmentbooking',
            name='status',
            field=models.CharField(choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected'), ('cancelled', 'Cancelled'), ('reschedule_proposed', 'Reschedule proposed')], default='pending', max_length=20),
        ),
    ]