from django.contrib import admin
from .models import (
    AdvisingItem, FinancialAidItem, RegistrationItem, EventItem, NavigationLog
)


@admin.register(AdvisingItem)
class AdvisingItemAdmin(admin.ModelAdmin):
    list_display = ('title', 'advisor_name', 'status')
    list_filter = ('status',)
    search_fields = ('title', 'advisor_name')


@admin.register(FinancialAidItem)
class FinancialAidItemAdmin(admin.ModelAdmin):
    list_display = ('title', 'amount', 'deadline', 'min_gpa')
    list_filter = ('deadline',)
    search_fields = ('title', 'description')
    fields = (
        'title', 'amount', 'deadline', 'description',
        'eligible_majors', 'eligible_years', 'min_gpa',
    )



@admin.register(RegistrationItem)
class RegistrationItemAdmin(admin.ModelAdmin):
    list_display = ('course_code', 'course_title', 'seats_available', 'schedule')
    search_fields = ('course_code', 'course_title')


@admin.register(EventItem)
class EventItemAdmin(admin.ModelAdmin):
    list_display = ('title', 'location', 'date')
    list_filter = ('date',)
    search_fields = ('title', 'location', 'description')
    fields = (
        'title', 'location', 'date', 'description',
        'eligible_majors', 'eligible_years',
    )


@admin.register(NavigationLog)
class NavigationLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'widget', 'clicked_at')
    list_filter = ('widget',)
    search_fields = ('user__username',)
    ordering = ('-clicked_at',)