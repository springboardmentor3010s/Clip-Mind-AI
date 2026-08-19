import AuthLayout from "../components/auth/AuthLayout";
import ResetPasswordForm from "../components/auth/ResetPasswordForm";

function ResetPassword() {
  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Create your new password"
    >
      <ResetPasswordForm />
    </AuthLayout>
  );
}

export default ResetPassword;