import json
from django.core.management.base import BaseCommand
from analytics.ml.train import train_and_save


class Command(BaseCommand):
    help = "Generate synthetic training data and (re)train the FR-05 risk model."

    def add_arguments(self, parser):
        parser.add_argument('--n-samples', type=int, default=4000)
        parser.add_argument('--seed', type=int, default=42)

    def handle(self, *args, **options):
        metrics = train_and_save(n_samples=options['n_samples'], seed=options['seed'])
        self.stdout.write(self.style.SUCCESS("Risk model trained and saved to analytics/ml/artifacts/"))
        self.stdout.write(json.dumps(metrics, indent=2))