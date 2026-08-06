import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chatbot', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='supportticket',
            name='staff_note',
            field=models.CharField(blank=True, help_text="Staff's reply, visible to the student on their ticket.", max_length=500),
        ),
        migrations.AddField(
            model_name='supportticket',
            name='updated_at',
            field=models.DateTimeField(auto_now=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
    ]