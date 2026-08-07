import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('servicerequests', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='servicerequest',
            name='assigned_to',
            field=models.ForeignKey(
                blank=True,
                help_text='Staff member currently handling this request. Optional -- an unclaimed request is still visible to everyone.',
                limit_choices_to={'role__in': ['advisor', 'admin']},
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='assigned_service_requests',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.CreateModel(
            name='ServiceRequestAttachment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('file', models.FileField(upload_to='service_request_attachments/%Y/%m/')),
                ('original_filename', models.CharField(blank=True, max_length=255)),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
                ('request', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='attachments', to='servicerequests.servicerequest')),
                ('uploaded_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='service_request_attachments', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['uploaded_at']},
        ),
        migrations.CreateModel(
            name='ServiceRequestComment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('text', models.TextField(max_length=2000)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('author', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='service_request_comments', to=settings.AUTH_USER_MODEL)),
                ('request', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='comments', to='servicerequests.servicerequest')),
            ],
            options={'ordering': ['created_at']},
        ),
    ]