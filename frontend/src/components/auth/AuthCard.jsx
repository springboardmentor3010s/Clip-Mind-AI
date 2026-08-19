"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Shield, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import TextField from "@/components/ui/TextField";

import {
  registerUser,
  loginUser,
} from "../../services/authService";
import { getProfile } from "../../services/userService";

export default function AuthCard({ defaultMode = "login" }) {
  const router = useRouter();
  const { login: authLogin } = useAuth();

  const [mode, setMode] = useState(defaultMode);
  const [loading, setLoading] = useState(false);

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
    role: "",
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await registerUser(registerData);
      alert("Account created successfully! Please sign in.");
      setMode("login");
    } catch (err) {
      alert(err.response?.data?.detail || "Registration Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await loginUser(loginData);
      const profile = await getProfile(res.access_token);
      authLogin(res.access_token, profile);
      router.push("/dashboard");
    } catch (err) {
      alert(err.response?.data?.detail || "Login Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card variant="elevated" shape="rounded-xl" className="w-full max-w-md p-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-md-primary"></div>

      <div className="flex bg-md-surface-container-highest p-1 rounded-full mb-8">
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
              {[
                { title: "Creator", value: "Creator" },
                { title: "Learner", value: "Learner" },
                { title: "Educator", value: "Educator" },
              ].map((role) => (
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
