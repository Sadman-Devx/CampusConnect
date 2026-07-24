from django.core.management.base import BaseCommand
from chatbot.models import FAQEntry


class Command(BaseCommand):
    help = "Seed FAQ knowledge base for the chatbot"

    def handle(self, *args, **kwargs):
        faqs = [
            {
                "category": "advising",
                "question": "How do I book an appointment with my advisor?",
                "keywords": "advisor,appointment,booking,advising,meet,schedule",
                "answer": "You can book an advising appointment from the Dashboard under 'Advising' — select an available slot and confirm.",
            },
            {
                "category": "financial_aid",
                "question": "How do I apply for a scholarship?",
                "keywords": "scholarship,financial,aid,apply,grant,funding,money",
                "answer": "Scholarships and grants are listed under 'Financial Aid' on your Dashboard. Click any item to see eligibility and apply.",
            },
            {
                "category": "financial_aid",
                "question": "When is the financial aid deadline?",
                "keywords": "deadline,financial,aid,due,date,scholarship",
                "answer": "Deadlines vary by scholarship — check the deadline field next to each item under Financial Aid on your Dashboard.",
            },
            {
                "category": "registration",
                "question": "How do I register for a course?",
                "keywords": "register,course,registration,enroll,class,section",
                "answer": "Go to 'Registration' on your Dashboard, pick a course with available seats, and confirm your registration.",
            },
            {
                "category": "registration",
                "question": "What if a course is full?",
                "keywords": "full,seats,course,waitlist,closed,registration",
                "answer": "If a course shows 0 available seats, you can join the waitlist or contact your advisor for an override.",
            },
            {
                "category": "events",
                "question": "How do I RSVP for a campus event?",
                "keywords": "event,rsvp,campus,register,attend",
                "answer": "Browse upcoming events under 'Events' on your Dashboard and click RSVP on any event you'd like to attend.",
            },
            {
                "category": "general",
                "question": "How do I reset my password?",
                "keywords": "password,reset,forgot,login,account",
                "answer": "Click 'Forgot Password' on the login page and follow the instructions sent to your registered email.",
            },
            {
                "category": "general",
                "question": "How do I contact my advisor directly?",
                "keywords": "contact,advisor,email,phone,reach",
                "answer": "Your advisor's contact details are shown on the Advising card in your Dashboard once you book a session.",
            },
        ]

        created = 0
        for f in faqs:
            _, was_created = FAQEntry.objects.get_or_create(
                question=f["question"],
                defaults={
                    "category": f["category"],
                    "keywords": f["keywords"],
                    "answer": f["answer"],
                }
            )
            if was_created:
                created += 1

        self.stdout.write(self.style.SUCCESS(f"Seeded {created} new FAQ entries ({len(faqs)} total defined)."))