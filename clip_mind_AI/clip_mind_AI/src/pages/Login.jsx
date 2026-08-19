import AuthLayout from "../components/auth/AuthLayout";
import LoginForm from "../components/auth/LoginForm";

function Login() {
  return (
    <AuthLayout
      title="Welcome Back 👋"
      subtitle="Login to continue using ClipMind AI"
    >
      <LoginForm />
    </AuthLayout>
  );
}

export default Login;