"""
Generates concrete AdvisorAvailability slots from
AdvisorAvailabilityRecurringRule rows for a rolling horizon.

Kept as a plain function called opportunistically from the relevant views
(rather than a Celery beat task) so the MVP doesn't need a background
worker just to keep slots topped up -- the horizon refreshes every time an
advisor or student touches the slot endpoints.
"""
from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from .models import AdvisorAvailability, AdvisorAvailabilityRecurringRule

# How far into the future concrete slots get generated. 8 weeks is enough
# runway for students to plan ahead without generating years of unused rows.
RECURRING_HORIZON_DAYS = 56


def sync_recurring_slots(advisor, horizon_days=RECURRING_HORIZON_DAYS):
    """
    Top up AdvisorAvailability rows for every active recurring rule this
    advisor owns, from today through `horizon_days` out.

    Effectively idempotent for normal (non-concurrent) use: each
    (advisor, date, start_time, end_time) combination already on the books
    is skipped rather than duplicated.
    """
    rules = list(
        AdvisorAvailabilityRecurringRule.objects.filter(advisor=advisor, is_active=True)
    )
    if not rules:
        return

    today = timezone.localdate()
    horizon_end = today + timedelta(days=horizon_days)

    existing = set(
        AdvisorAvailability.objects.filter(
            advisor=advisor, date__gte=today, date__lte=horizon_end,
        ).values_list("date", "start_time", "end_time")
    )

    to_create = []
    for rule in rules:
        rule_end = min(horizon_end, rule.effective_until) if rule.effective_until else horizon_end
        if rule_end < today:
            continue

        days_ahead = (rule.weekday - today.weekday()) % 7
        cursor = today + timedelta(days=days_ahead)

        while cursor <= rule_end:
            key = (cursor, rule.start_time, rule.end_time)
            if key not in existing:
                to_create.append(
                    AdvisorAvailability(
                        advisor=advisor, date=cursor,
                        start_time=rule.start_time, end_time=rule.end_time,
                    )
                )
                existing.add(key)
            cursor += timedelta(days=7)

    if not to_create:
        return

    with transaction.atomic():
        AdvisorAvailability.objects.bulk_create(to_create, ignore_conflicts=True)