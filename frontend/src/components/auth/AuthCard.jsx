"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Shield, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "@/context/AuthContext";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import TextField from "@/components/ui/TextField";

import { firebaseLogin } from "../../services/authService";
import { getProfile } from "../../services/userService";
import {
  firebaseAuth,
  googleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
} from "@/lib/firebase";

const ROLE_OPTIONS = [
  { title: "Creator", value: "Creator" },
  { title: "Learner", value: "Learner" },
  { title: "Educator", value: "Educator" },
];

const FIREBASE_ERROR_MESSAGES = {
  "auth/email-already-in-use": "An account with this email already exists — try signing in instead.",
  "auth/invalid-email": "That email address doesn't look right.",
  "auth/weak-password": "Password should be at least 6 characters.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/user-not-found": "No account found with that email.",
  "auth/popup-closed-by-user": "Google sign-in was closed before finishing.",
  "auth/too-many-requests": "Too many attempts — please wait a moment and try again.",
};

function friendlyError(err) {
  return FIREBASE_ERROR_MESSAGES[err?.code] || err?.response?.data?.detail || err?.message || "Something went wrong.";
}

export default function AuthCard({ defaultMode = "login" }) {
  const router = useRouter();
  const { login: authLogin } = useAuth();

  const [mode, setMode] = useState(defaultMode);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
    role: "",
  });

  // Forgot-password rides entirely on Firebase's own reset-email flow — no
  // backend involvement, since Firebase owns the credential.
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStatus, setForgotStatus] = useState("idle"); // idle | sending | sent | error
  const [forgotError, setForgotError] = useState("");

  // A brand-new Google sign-in has no role yet — hold the verified ID token
  // here while the user picks one, then finish the exchange.
  const [pendingGoogleToken, setPendingGoogleToken] = useState(null);
  const [pendingRole, setPendingRole] = useState("");

  const finishLogin = async (accessToken) => {
    const profile = await getProfile(accessToken);
    authLogin(accessToken, profile);
    router.push("/dashboard");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(firebaseAuth, loginData.email, loginData.password);
      const idToken = await cred.user.getIdToken();
      const res = await firebaseLogin(idToken);
      if (res.needs_role) {
        alert("We couldn't find an account for this email. Please create an account first.");
        return;
      }
      await finishLogin(res.access_token);
    } catch (err) {
      alert(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!registerData.role) {
      alert("Please choose a role.");
      return;
    }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(firebaseAuth, registerData.email, registerData.password);
      const idToken = await cred.user.getIdToken();
      const res = await firebaseLogin(idToken, registerData.role, registerData.username);
      await finishLogin(res.access_token);
    } catch (err) {
      alert(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const cred = await signInWithPopup(firebaseAuth, googleProvider);
      const idToken = await cred.user.getIdToken();
      const res = await firebaseLogin(idToken);
      if (res.needs_role) {
        setPendingGoogleToken(idToken);
        return;
      }
      await finishLogin(res.access_token);
    } catch (err) {
      alert(friendlyError(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFinishGoogleSignUp = async () => {
    if (!pendingRole) {
      alert("Please choose a role.");
      return;
    }
    setGoogleLoading(true);
    try {
      const res = await firebaseLogin(pendingGoogleToken, pendingRole);
      await finishLogin(res.access_token);
    } catch (err) {
      alert(friendlyError(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSendResetEmail = async (e) => {
    e.preventDefault();
    setForgotStatus("sending");
    setForgotError("");
    try {
      await sendPasswordResetEmail(firebaseAuth, forgotEmail);
      setForgotStatus("sent");
    } catch (err) {
      setForgotStatus("error");
      setForgotError(friendlyError(err));
    }
  };

  // Mid-flow: a brand-new Google account needs a role before we can finish.
  if (pendingGoogleToken) {
    return (
      <Card variant="elevated" shape="rounded-xl" className="w-full max-w-md p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-md-primary"></div>
        <button
          onClick={() => setPendingGoogleToken(null)}
          className="flex items-center gap-1.5 text-label-medium text-md-on-surface-variant hover:text-md-on-surface mb-4"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <h2 className="text-title-large font-semibold text-md-on-surface mb-1">One more step</h2>
        <p className="text-body-medium text-md-on-surface-variant mb-6">
          Choose how you'll use ClipMind AI to finish setting up your account.
        </p>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {ROLE_OPTIONS.map((role) => (
            <div
              key={role.value}
              className={`p-3 border rounded-lg cursor-pointer transition-all flex items-center gap-2 ${
                pendingRole === role.value
                  ? "border-md-tertiary bg-md-tertiary-container text-md-on-tertiary-container"
                  : "border-md-outline-variant bg-md-surface-container text-md-on-surface-variant hover:border-md-outline"
              }`}
              onClick={() => setPendingRole(role.value)}
            >
              <Shield size={16} />
              <span className="font-medium text-label-medium">{role.title}</span>
            </div>
          ))}
        </div>
        <Button
          onClick={handleFinishGoogleSignUp}
          disabled={googleLoading}
          variant="primary"
          size="lg"
          icon={ArrowRight}
          iconPosition="right"
          className="w-full"
        >
          {googleLoading ? "Finishing..." : "Continue"}
        </Button>
      </Card>
    );
  }

  // Mid-flow: forgot-password mini form.
  if (showForgot) {
    return (
      <Card variant="elevated" shape="rounded-xl" className="w-full max-w-md p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-md-primary"></div>
        <button
          onClick={() => { setShowForgot(false); setForgotStatus("idle"); }}
          className="flex items-center gap-1.5 text-label-medium text-md-on-surface-variant hover:text-md-on-surface mb-4"
        >
          <ArrowLeft size={16} /> Back to sign in
        </button>
        <h2 className="text-title-large font-semibold text-md-on-surface mb-1">Reset your password</h2>

        {forgotStatus === "sent" ? (
          <div className="flex items-start gap-3 mt-6 p-4 rounded-lg bg-md-tertiary-container text-md-on-tertiary-container">
            <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
            <p className="text-body-medium">
              If an account exists for <span className="font-semibold">{forgotEmail}</span>, a reset link is on its way — check your inbox.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendResetEmail} className="space-y-4 mt-4">
            <p className="text-body-medium text-md-on-surface-variant">
              Enter your account email and we'll send you a link to reset your password.
            </p>
            <TextField
              type="email"
              placeholder="Email address"
              icon={Mail}
              required
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
            />
            {forgotStatus === "error" && (
              <p className="text-body-small text-md-error">{forgotError}</p>
            )}
            <Button
              type="submit"
              disabled={forgotStatus === "sending"}
              variant="primary"
              size="lg"
              icon={ArrowRight}
              iconPosition="right"
              className="w-full"
            >
              {forgotStatus === "sending" ? "Sending..." : "Send reset link"}
            </Button>
          </form>
        )}
      </Card>
    );
  }

  return (
    <Card variant="elevated" shape="rounded-xl" className="w-full max-w-md p-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-md-primary"></div>

      <div className="flex bg-md-surface-container-highest p-1 rounded-full mb-6">
        <button
          className={`flex-1 py-2 text-label-large font-semibold rounded-full transition-all ${mode === "login" ? "bg-md-primary text-md-on-primary" : "text-md-on-surface-variant hover:text-md-on-surface"}`}
          onClick={() => setMode("login")}
        >
          Sign In
        </button>
        <button
          className={`flex-1 py-2 text-label-large font-semibold rounded-full transition-all ${mode === "register" ? "bg-md-tertiary text-md-on-tertiary" : "text-md-on-surface-variant hover:text-md-on-surface"}`}
          onClick={() => setMode("register")}
        >
          Create Account
        </button>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-2.5 py-2.5 mb-6 rounded-full border border-md-outline-variant bg-md-surface text-md-on-surface text-label-large font-medium hover:bg-md-surface-container transition-all disabled:opacity-50"
      >
        <FcGoogle size={18} />
        {googleLoading ? "Connecting..." : "Continue with Google"}
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-md-outline-variant" />
        <span className="text-label-small text-md-on-surface-variant">or</span>
        <div className="flex-1 h-px bg-md-outline-variant" />
      </div>

      <AnimatePresence mode="wait">
        {mode === "login" ? (
          <motion.form
            key="login"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onSubmit={handleLogin}
            className="space-y-4"
          >
            <TextField
              type="email"
              placeholder="Email address"
              icon={Mail}
              required
              value={loginData.email}
              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
            />

            <TextField
              type="password"
              placeholder="Password"
              icon={Lock}
              required
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
            />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => { setForgotEmail(loginData.email); setShowForgot(true); }}
                className="text-label-medium text-md-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              variant="primary"
              size="lg"
              icon={ArrowRight}
              iconPosition="right"
              className="w-full mt-4"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </motion.form>
        ) : (
          <motion.form
            key="register"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleRegister}
            className="space-y-4"
          >
            <TextField
              type="text"
              placeholder="Username"
              icon={User}
              required
              value={registerData.username}
              onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
            />

            <TextField
              type="email"
              placeholder="Email address"
              icon={Mail}
              required
              value={registerData.email}
              onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
            />

            <TextField
              type="password"
              placeholder="Password"
              icon={Lock}
              required
              value={registerData.password}
              onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
            />

            <div className="grid grid-cols-3 gap-3 pt-2">
              {ROLE_OPTIONS.map((role) => (
                <div
                  key={role.value}
                  className={`p-3 border rounded-lg cursor-pointer transition-all flex items-center gap-2 ${
                    registerData.role === role.value
                      ? "border-md-tertiary bg-md-tertiary-container text-md-on-tertiary-container"
                      : "border-md-outline-variant bg-md-surface-container text-md-on-surface-variant hover:border-md-outline"
                  }`}
                  onClick={() => setRegisterData({ ...registerData, role: role.value })}
                >
                  <Shield size={16} />
                  <span className="font-medium text-label-medium">{role.title}</span>
                </div>
              ))}
            </div>

            <Button
              type="submit"
              disabled={loading}
              variant="tonal"
              size="lg"
              icon={ArrowRight}
              iconPosition="right"
              className="w-full mt-2"
            >
              {loading ? "Creating..." : "Create Account"}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </Card>
  );
}
