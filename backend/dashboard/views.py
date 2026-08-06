from django.contrib.auth import get_user_model
from django.db.models import OuterRef, Subquery
from analytics.models import AdvisorAlert, RiskScore
from rest_framework import permissions
from analytics.permissions import IsAdvisorOrAdmin
from analytics.serializers import AdvisorAlertSerializer, RiskScoreSerializer

User = get_user_model()
TOP_AT_RISK_LIMIT = 5
RECENT_ALERTS_LIMIT = 5


from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated


from .models import (
    AdvisingItem, FinancialAidItem, RegistrationItem, EventItem,
    CourseEnrollment, ScholarshipApplication, EventRSVP,
)
from .permissions import IsAdminOnly, IsStudentRole
from .serializers import (
    AdvisingItemSerializer, FinancialAidItemSerializer,
    RegistrationItemSerializer, EventItemSerializer, NavigationLogSerializer,
    CourseEnrollmentSerializer, ScholarshipApplicationSerializer, EventRSVPSerializer,
)


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        ctx = {'request': request}
        if request.user.role == 'student':
            ctx['applied_ids'] = set(
                ScholarshipApplication.objects.filter(student=request.user).values_list('financial_aid_item_id', flat=True)
            )
            ctx['enrolled_ids'] = set(
                CourseEnrollment.objects.filter(student=request.user, status=CourseEnrollment.STATUS_ENROLLED)
                .values_list('course_id', flat=True)
            )
            ctx['rsvpd_ids'] = set(
                EventRSVP.objects.filter(student=request.user).values_list('event_id', flat=True)
            )
        data = {
            "advising": AdvisingItemSerializer(AdvisingItem.objects.all(), many=True).data,
            "financial_aid": FinancialAidItemSerializer(FinancialAidItem.objects.all(), many=True, context=ctx).data,
            "registration": RegistrationItemSerializer(RegistrationItem.objects.all(), many=True, context=ctx).data,
            "events": EventItemSerializer(EventItem.objects.all(), many=True, context=ctx).data,
        }
        return Response(data, status=status.HTTP_200_OK)


class NavigationLogView(generics.CreateAPIView):
    serializer_class = NavigationLogSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class AdminDashboardView(APIView):
    """FR-07 -- GET /api/dashboard/admin/ (advisor/admin only)"""
    permission_classes = [IsAdvisorOrAdmin]

    def get(self, request):
        total_students = User.objects.filter(role='student').count()

        latest_per_student = (
            RiskScore.objects.filter(student=OuterRef('student'))
            .order_by('-computed_at').values('id')[:1]
        )
        latest_scores = RiskScore.objects.filter(id=Subquery(latest_per_student)).select_related('student')

        risk_distribution = {'low': 0, 'medium': 0, 'high': 0}
        for level in latest_scores.values_list('risk_level', flat=True):
            if level in risk_distribution:
                risk_distribution[level] += 1

        top_at_risk = latest_scores.order_by('-score')[:TOP_AT_RISK_LIMIT]
        recent_alerts = AdvisorAlert.objects.select_related('student', 'risk_score').order_by('-created_at')[:RECENT_ALERTS_LIMIT]
        open_alerts_count = AdvisorAlert.objects.filter(status=AdvisorAlert.STATUS_OPEN).count()

        data = {
            "total_students": total_students,
            "students_scored": latest_scores.count(),
            "risk_distribution": risk_distribution,
            "open_alerts_count": open_alerts_count,
            "top_at_risk_students": RiskScoreSerializer(top_at_risk, many=True).data,
            "recent_alerts": AdvisorAlertSerializer(recent_alerts, many=True).data,
        }
        return Response(data, status=status.HTTP_200_OK)





class FinancialAidItemListCreateView(generics.ListCreateAPIView):
    queryset = FinancialAidItem.objects.all().order_by('-id')
    serializer_class = FinancialAidItemSerializer
    permission_classes = [IsAdminOnly]

class FinancialAidItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = FinancialAidItem.objects.all()
    serializer_class = FinancialAidItemSerializer
    permission_classes = [IsAdminOnly]

class EventItemListCreateView(generics.ListCreateAPIView):
    queryset = EventItem.objects.all().order_by('-date')
    serializer_class = EventItemSerializer
    permission_classes = [IsAdminOnly]

class EventItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = EventItem.objects.all()
    serializer_class = EventItemSerializer
    permission_classes = [IsAdminOnly]

# =====================================================================
# FR-02/06 -- Real course enrollment (was catalog-browsing-only before)
# =====================================================================

class EnrollCourseView(APIView):
    """
    Atomically claims one seat and creates the enrollment record.

    select_for_update() locks the RegistrationItem row for the duration of
    the transaction, so two students racing for the last open seat can't
    both succeed -- the second request re-reads the row only after the
    first transaction commits, by which point seats_available has already
    dropped, so it correctly gets "no seats left" instead of over-booking.
    """
    permission_classes = [IsStudentRole]

    def post(self, request, pk):
        with transaction.atomic():
            course = RegistrationItem.objects.select_for_update().filter(pk=pk).first()
            if not course:
                return Response({"detail": "Course not found."}, status=status.HTTP_404_NOT_FOUND)

            already_enrolled = CourseEnrollment.objects.filter(
                student=request.user, course=course, status=CourseEnrollment.STATUS_ENROLLED
            ).exists()
            if already_enrolled:
                return Response({"detail": "You're already enrolled in this course."}, status=status.HTTP_400_BAD_REQUEST)

            if course.seats_available <= 0:
                return Response({"detail": "No seats left in this course."}, status=status.HTTP_409_CONFLICT)

            course.seats_available -= 1
            course.save(update_fields=["seats_available"])

            # A prior "dropped" row can exist for this student+course (the
            # unique constraint only blocks a second *active* enrollment),
            # so reactivate it instead of trying to insert a duplicate.
            enrollment, created = CourseEnrollment.objects.get_or_create(
                student=request.user, course=course,
                defaults={"status": CourseEnrollment.STATUS_ENROLLED},
            )
            if not created:
                enrollment.status = CourseEnrollment.STATUS_ENROLLED
                enrollment.dropped_at = None
                enrollment.save(update_fields=["status", "dropped_at"])

        return Response(RegistrationItemSerializer(course, context={'request': request}).data)


class DropCourseView(APIView):
    """Releases the seat back to the pool."""
    permission_classes = [IsStudentRole]

    def post(self, request, pk):
        with transaction.atomic():
            enrollment = (
                CourseEnrollment.objects
                .select_related("course")
                .filter(student=request.user, course_id=pk, status=CourseEnrollment.STATUS_ENROLLED)
                .first()
            )
            if not enrollment:
                return Response({"detail": "You're not enrolled in this course."}, status=status.HTTP_400_BAD_REQUEST)

            course = RegistrationItem.objects.select_for_update().get(pk=enrollment.course_id)
            course.seats_available += 1
            course.save(update_fields=["seats_available"])

            enrollment.status = CourseEnrollment.STATUS_DROPPED
            enrollment.dropped_at = timezone.now()
            enrollment.save(update_fields=["status", "dropped_at"])

        return Response(RegistrationItemSerializer(course, context={'request': request}).data)


class MyEnrollmentsView(generics.ListAPIView):
    serializer_class = CourseEnrollmentSerializer
    permission_classes = [IsStudentRole]

    def get_queryset(self):
        return CourseEnrollment.objects.filter(
            student=self.request.user, status=CourseEnrollment.STATUS_ENROLLED
        ).select_related("course")


# =====================================================================
# FR-04 -- Real scholarship applications & event RSVPs (was analytics-log-only)
# =====================================================================

class ApplyScholarshipView(APIView):
    permission_classes = [IsStudentRole]

    def post(self, request, pk):
        item = get_object_or_404(FinancialAidItem, pk=pk)
        application, created = ScholarshipApplication.objects.get_or_create(
            student=request.user, financial_aid_item=item
        )
        if not created:
            return Response({"detail": "You've already applied to this scholarship."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ScholarshipApplicationSerializer(application).data, status=status.HTTP_201_CREATED)


class MyApplicationsView(generics.ListAPIView):
    serializer_class = ScholarshipApplicationSerializer
    permission_classes = [IsStudentRole]

    def get_queryset(self):
        return ScholarshipApplication.objects.filter(student=self.request.user).select_related("financial_aid_item")


class RSVPEventView(APIView):
    permission_classes = [IsStudentRole]

    def post(self, request, pk):
        event = get_object_or_404(EventItem, pk=pk)
        rsvp, created = EventRSVP.objects.get_or_create(student=request.user, event=event)
        if not created:
            return Response({"detail": "You've already RSVP'd to this event."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(EventRSVPSerializer(rsvp).data, status=status.HTTP_201_CREATED)

    def delete(self, request, pk):
        deleted, _ = EventRSVP.objects.filter(student=request.user, event_id=pk).delete()
        if not deleted:
            return Response({"detail": "You haven't RSVP'd to this event."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MyRSVPsView(generics.ListAPIView):
    serializer_class = EventRSVPSerializer
    permission_classes = [IsStudentRole]

    def get_queryset(self):
        return EventRSVP.objects.filter(student=self.request.user).select_related("event")