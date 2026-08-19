"""
Drops the legacy `clips` table left behind after the Generated Clips feature
was removed. The clips app (and its models) no longer exist, so this raw-SQL
migration cleans up the orphaned table. Safe to run repeatedly (IF EXISTS).
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("videos", "0001_initial"),
    ]

    operations = [
        migrations.RunSQL(
            sql="DROP TABLE IF EXISTS clips CASCADE;",
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
