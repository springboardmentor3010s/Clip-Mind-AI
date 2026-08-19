"""
Map the legacy two-role scheme onto the four roles required by the spec.

Before this migration the platform had only `admin` and `user`. Every existing
`user` account was able to upload and manage its own videos, which corresponds
to the Content Creator role — so that is the mapping applied here. `admin` is
unchanged.
"""
from django.db import migrations


def forwards(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    User.objects.filter(role="user").update(role="content_creator")


def backwards(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    User.objects.filter(role__in=["content_creator", "learner", "educator"]).update(role="user")


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0003_platformsetting_alter_user_role_auditlog_activitylog"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
