from rest_framework import serializers
from .models import (
    AdvisingItem, FinancialAidItem, RegistrationItem, EventItem, NavigationLog,
    CourseEnrollment, ScholarshipApplication, EventRSVP,
)


class AdvisingItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdvisingItem
        fields = '__all__'


class FinancialAidItemSerializer(serializers.ModelSerializer):
    is_applied = serializers.SerializerMethodField()

    class Meta:
        model = FinancialAidItem
        fields = '__all__'

    def get_is_applied(self, obj):
        user = self.context.get('request') and self.context['request'].user
        if not user or not user.is_authenticated or user.role != 'student':
            return False
        # Prefetched by the view as `_applied_ids` when listing, to avoid N+1 queries.
        applied_ids = self.context.get('applied_ids')
        if applied_ids is not None:
            return obj.id in applied_ids
        return obj.applications.filter(student=user).exists()


class RegistrationItemSerializer(serializers.ModelSerializer):
    is_enrolled = serializers.SerializerMethodField()

    class Meta:
        model = RegistrationItem
        fields = '__all__'

    def get_is_enrolled(self, obj):
        user = self.context.get('request') and self.context['request'].user
        if not user or not user.is_authenticated or user.role != 'student':
            return False
        enrolled_ids = self.context.get('enrolled_ids')
        if enrolled_ids is not None:
            return obj.id in enrolled_ids
        return obj.enrollments.filter(student=user, status=CourseEnrollment.STATUS_ENROLLED).exists()


class EventItemSerializer(serializers.ModelSerializer):
    is_rsvpd = serializers.SerializerMethodField()

    class Meta:
        model = EventItem
        fields = '__all__'

    def get_is_rsvpd(self, obj):
        user = self.context.get('request') and self.context['request'].user
        if not user or not user.is_authenticated or user.role != 'student':
            return False
        rsvpd_ids = self.context.get('rsvpd_ids')
        if rsvpd_ids is not None:
            return obj.id in rsvpd_ids
        return obj.rsvps.filter(student=user).exists()


class NavigationLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = NavigationLog
        fields = ['id', 'widget', 'clicked_at']
        read_only_fields = ['id', 'clicked_at']


class CourseEnrollmentSerializer(serializers.ModelSerializer):
    course_code = serializers.CharField(source='course.course_code', read_only=True)
    course_title = serializers.CharField(source='course.course_title', read_only=True)
    schedule = serializers.CharField(source='course.schedule', read_only=True)

    class Meta:
        model = CourseEnrollment
        fields = ['id', 'course', 'course_code', 'course_title', 'schedule', 'status', 'enrolled_at', 'dropped_at']
        read_only_fields = fields


class ScholarshipApplicationSerializer(serializers.ModelSerializer):
    scholarship_title = serializers.CharField(source='financial_aid_item.title', read_only=True)

    class Meta:
        model = ScholarshipApplication
        fields = ['id', 'financial_aid_item', 'scholarship_title', 'status', 'applied_at']
        read_only_fields = fields


class EventRSVPSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(source='event.title', read_only=True)
    event_date = serializers.DateTimeField(source='event.date', read_only=True)

    class Meta:
        model = EventRSVP
        fields = ['id', 'event', 'event_title', 'event_date', 'rsvp_at']
        read_only_fields = fields