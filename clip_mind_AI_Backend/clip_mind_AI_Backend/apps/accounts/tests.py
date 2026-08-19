"""
Authentication, registration policy and RBAC tests.
"""
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User, ActivityLog, AuditLog, ContactMessage

STRONG = "StrongPass1!"


def make_user(email, role=User.Role.LEARNER, password=STRONG, **extra):
    return User.objects.create_user(
        email=email, password=password, first_name=email.split("@")[0], role=role, **extra
    )


class RegistrationTests(APITestCase):
    url = "/api/v1/auth/register"

    def test_registers_with_valid_role(self):
        res = self.client.post(self.url, {
            "email": "creator@test.com", "first_name": "Cara", "last_name": "Creator",
            "password": STRONG, "confirm_password": STRONG, "role": "content_creator",
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["data"]["role"], "content_creator")
        self.assertTrue(User.objects.filter(email="creator@test.com").exists())

    def test_defaults_to_learner(self):
        res = self.client.post(self.url, {
            "email": "plain@test.com", "first_name": "P",
            "password": STRONG, "confirm_password": STRONG,
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["data"]["role"], "learner")

    def test_cannot_self_assign_admin(self):
        res = self.client.post(self.url, {
            "email": "hacker@test.com", "first_name": "H",
            "password": STRONG, "confirm_password": STRONG, "role": "admin",
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(email="hacker@test.com").exists())

    def test_rejects_weak_password(self):
        res = self.client.post(self.url, {
            "email": "weak@test.com", "first_name": "W",
            "password": "password", "confirm_password": "password",
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", res.data["errors"])

    def test_rejects_mismatched_passwords(self):
        res = self.client.post(self.url, {
            "email": "mismatch@test.com", "first_name": "M",
            "password": STRONG, "confirm_password": "OtherPass1!",
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rejects_duplicate_email(self):
        make_user("dupe@test.com")
        res = self.client.post(self.url, {
            "email": "dupe@test.com", "first_name": "D",
            "password": STRONG, "confirm_password": STRONG,
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_records_register_activity(self):
        self.client.post(self.url, {
            "email": "act@test.com", "first_name": "A",
            "password": STRONG, "confirm_password": STRONG,
        }, format="json")
        user = User.objects.get(email="act@test.com")
        self.assertTrue(
            ActivityLog.objects.filter(user=user, action=ActivityLog.Action.REGISTER).exists()
        )


class LoginTests(APITestCase):
    def setUp(self):
        self.user = make_user("login@test.com", role=User.Role.EDUCATOR)

    def test_login_returns_tokens_and_role(self):
        res = self.client.post("/api/v1/auth/login",
                               {"email": "login@test.com", "password": STRONG}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data["data"]["tokens"])
        self.assertEqual(res.data["data"]["user"]["role"], "educator")

    def test_bad_password_rejected(self):
        res = self.client.post("/api/v1/auth/login",
                               {"email": "login@test.com", "password": "Wrong1!x"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_deactivated_user_cannot_login(self):
        self.user.is_active = False
        self.user.save()
        res = self.client.post("/api/v1/auth/login",
                               {"email": "login@test.com", "password": STRONG}, format="json")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_requires_authentication(self):
        self.assertEqual(
            self.client.get("/api/v1/auth/profile").status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_profile_returns_role_capabilities(self):
        self.client.force_authenticate(self.user)
        res = self.client.get("/api/v1/auth/profile")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["data"]["can_upload"])


class RoleModelTests(APITestCase):
    def test_learner_cannot_upload_flag(self):
        self.assertFalse(make_user("l@test.com", User.Role.LEARNER).can_upload)

    def test_other_roles_can_upload(self):
        self.assertTrue(make_user("c@test.com", User.Role.CONTENT_CREATOR).can_upload)
        self.assertTrue(make_user("e@test.com", User.Role.EDUCATOR).can_upload)
        self.assertTrue(make_user("a@test.com", User.Role.ADMIN).can_upload)

    def test_all_four_roles_exist(self):
        self.assertEqual(
            set(User.Role.values),
            {"content_creator", "learner", "educator", "admin"},
        )


class ActivityHistoryTests(APITestCase):
    def setUp(self):
        self.user = make_user("hist@test.com")
        self.other = make_user("other@test.com")

    def test_activity_history_is_private_to_the_user(self):
        ActivityLog.objects.create(user=self.user, action=ActivityLog.Action.LOGIN)
        ActivityLog.objects.create(user=self.other, action=ActivityLog.Action.LOGIN)

        self.client.force_authenticate(self.user)
        res = self.client.get("/api/v1/auth/activity")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["data"]["count"], 1)

    def test_requires_authentication(self):
        self.assertEqual(
            self.client.get("/api/v1/auth/activity").status_code,
            status.HTTP_401_UNAUTHORIZED,
        )


class ContactFormTests(APITestCase):
    """Public contact endpoint — unauthenticated, validated, persisted."""

    url = "/api/v1/contact"
    valid = {
        "name": "Jane Doe",
        "email": "jane@example.com",
        "subject": "Question about transcripts",
        "message": "Can I correct a transcript after it has been generated?",
    }

    def test_anonymous_can_submit(self):
        res = self.client.post(self.url, self.valid, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        msg = ContactMessage.objects.get()
        self.assertEqual(msg.email, "jane@example.com")
        self.assertFalse(msg.is_read)

    def test_message_is_saved_even_if_email_fails(self):
        """SMTP is unconfigured in tests — the enquiry must still be kept."""
        res = self.client.post(self.url, self.valid, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ContactMessage.objects.count(), 1)

    def test_rejects_invalid_email(self):
        payload = {**self.valid, "email": "not-an-email"}
        res = self.client.post(self.url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(ContactMessage.objects.count(), 0)

    def test_rejects_short_message(self):
        payload = {**self.valid, "message": "hi"}
        res = self.client.post(self.url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("message", res.data["errors"])

    def test_rejects_overlong_message(self):
        payload = {**self.valid, "message": "x" * 5001}
        res = self.client.post(self.url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rejects_missing_fields(self):
        res = self.client.post(self.url, {"name": "Jane"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class AdminModuleTests(APITestCase):
    def setUp(self):
        self.admin = make_user("admin@test.com", User.Role.ADMIN, is_staff=True)
        self.learner = make_user("learner@test.com", User.Role.LEARNER)

    # --- access control -------------------------------------------------
    def test_non_admin_blocked_from_every_admin_endpoint(self):
        self.client.force_authenticate(self.learner)
        for path in ["stats", "users", "activity", "content", "jobs",
                     "storage", "audit-logs", "settings"]:
            res = self.client.get(f"/api/v1/admin/{path}")
            self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN, path)

    def test_anonymous_blocked(self):
        self.assertEqual(
            self.client.get("/api/v1/admin/stats").status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    # --- functionality --------------------------------------------------
    def test_admin_can_read_system_stats(self):
        self.client.force_authenticate(self.admin)
        res = self.client.get("/api/v1/admin/stats")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["data"]["total_users"], 2)
        self.assertIn("storage_mb", res.data["data"])

    def test_admin_can_list_users(self):
        self.client.force_authenticate(self.admin)
        res = self.client.get("/api/v1/admin/users")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["data"]), 2)

    def test_admin_can_change_role_and_writes_audit_log(self):
        self.client.force_authenticate(self.admin)
        res = self.client.patch(f"/api/v1/admin/users/{self.learner.id}",
                                {"role": "educator"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.learner.refresh_from_db()
        self.assertEqual(self.learner.role, "educator")
        self.assertTrue(AuditLog.objects.filter(action="user.update").exists())

    def test_admin_can_deactivate_user(self):
        self.client.force_authenticate(self.admin)
        res = self.client.patch(f"/api/v1/admin/users/{self.learner.id}",
                                {"is_active": False}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.learner.refresh_from_db()
        self.assertFalse(self.learner.is_active)

    def test_admin_cannot_deactivate_self(self):
        self.client.force_authenticate(self.admin)
        res = self.client.patch(f"/api/v1/admin/users/{self.admin.id}",
                                {"is_active": False}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.admin.refresh_from_db()
        self.assertTrue(self.admin.is_active)

    def test_admin_cannot_demote_self(self):
        self.client.force_authenticate(self.admin)
        res = self.client.patch(f"/api/v1/admin/users/{self.admin.id}",
                                {"role": "learner"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_settings_read_and_update(self):
        self.client.force_authenticate(self.admin)
        res = self.client.get("/api/v1/admin/settings")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        keys = {row["key"] for row in res.data["data"]}
        self.assertIn("allow_registration", keys)

        res = self.client.patch("/api/v1/admin/settings",
                                {"allow_registration": False}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        value = next(r["value"] for r in res.data["data"] if r["key"] == "allow_registration")
        self.assertFalse(value)

    def test_settings_rejects_unknown_key(self):
        self.client.force_authenticate(self.admin)
        res = self.client.patch("/api/v1/admin/settings", {"nope": 1}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_settings_rejects_wrong_type(self):
        self.client.force_authenticate(self.admin)
        res = self.client.patch("/api/v1/admin/settings",
                                {"allow_registration": "yes"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_reads_contact_messages(self):
        ContactMessage.objects.create(
            name="Visitor", email="v@example.com",
            subject="Question", message="How does the search work exactly?",
        )
        self.client.force_authenticate(self.admin)
        res = self.client.get("/api/v1/admin/contact-messages")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["data"]["count"], 1)
        self.assertEqual(res.data["data"]["unread_count"], 1)

    def test_admin_can_mark_message_read(self):
        msg = ContactMessage.objects.create(
            name="V", email="v@example.com", subject="S", message="A long enough message.",
        )
        self.client.force_authenticate(self.admin)
        res = self.client.patch("/api/v1/admin/contact-messages",
                                {"id": str(msg.id), "is_read": True}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        msg.refresh_from_db()
        self.assertTrue(msg.is_read)

    def test_learner_blocked_from_contact_messages(self):
        self.client.force_authenticate(self.learner)
        res = self.client.get("/api/v1/admin/contact-messages")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_jobs_and_storage_endpoints_respond(self):
        self.client.force_authenticate(self.admin)
        jobs = self.client.get("/api/v1/admin/jobs")
        self.assertEqual(jobs.status_code, status.HTTP_200_OK)
        self.assertIn("active_count", jobs.data["data"])

        storage = self.client.get("/api/v1/admin/storage")
        self.assertEqual(storage.status_code, status.HTTP_200_OK)
        self.assertIn("total_mb", storage.data["data"])
