import AuthLayout from "../components/auth/AuthLayout";
import ForgotPasswordForm from "../components/auth/ForgotPasswordForm";

function ForgotPassword() {
  return (
    <AuthLayout
      title="Forgot Password?"
      subtitle="Enter your email to reset your password."
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}

export default ForgotPassword;