"use client";

import { useState, useEffect } from "react";
import { X, Upload, FileText, Sparkles, Users, ArrowRight } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const STEPS_BY_ROLE = {
  creator: [
    { icon: Upload, title: "Upload a video", desc: "Drop a file or paste a link to get started." },
    { icon: FileText, title: "Generate a transcript", desc: "Whisper turns speech into a searchable transcript." },
    { icon: Sparkles, title: "Summarize & detect key moments", desc: "One click gives you a summary and timestamped highlights." },
  ],
  learner: [
    { icon: FileText, title: "Browse content", desc: "Explore videos uploaded by Creators and Educators." },
    { icon: Sparkles, title: "Read summaries", desc: "Get the key points without watching the whole video." },
    { icon: Users, title: "Bookmark what matters", desc: "Save anything you want to revisit later." },
  ],
  educator: [
    { icon: Upload, title: "Upload lecture content", desc: "Process videos into transcripts and summaries." },
    { icon: Users, title: "Share with students", desc: "Generate a public link — no login required for them." },
    { icon: Sparkles, title: "Track engagement", desc: "Classroom Analytics shows who's watching what." },
  ],
  admin: [
    { icon: Users, title: "Manage your platform", desc: "Users, content, storage, and activity — all in one place." },
    { icon: FileText, title: "Monitor health", desc: "Track processing jobs and download audit logs anytime." },
  ],
};

export default function OnboardingTour({ role }) {
  const { isDark } = useTheme();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem("clipmind_onboarded");
    if (!seen) setVisible(true);
  }, []);

  const steps = STEPS_BY_ROLE[role] || STEPS_BY_ROLE.learner;

  function close() {
    localStorage.setItem("clipmind_onboarded", "true");
    setVisible(false);
  }

  function next() {
    if (step < steps.length - 1) setStep(step + 1);
    else close();
  }

  if (!visible) return null;

  const current = steps[step];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className={`w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden ${
          isDark ? "bg-[#181B23] text-gray-100" : "bg-white text-gray-900"
        }`}
      >
        <div className="flex items-center justify-end px-4 pt-4">
          <button onClick={close} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <div className="px-8 pb-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue/10 flex items-center justify-center mx-auto mb-5">
            <Icon className="text-blue" size={26} />
          </div>
          <h3 className="text-lg font-bold mb-2">{current.title}</h3>
          <p className={`text-sm mb-6 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{current.desc}</p>

          <div className="flex items-center justify-center gap-1.5 mb-6">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-blue" : "w-1.5 bg-gray-300"}`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="w-full flex items-center justify-center gap-2 bg-blue text-white py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition"
          >
            {step < steps.length - 1 ? "Next" : "Get started"}
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}