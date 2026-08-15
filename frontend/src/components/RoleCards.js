"use client";

import { Video, GraduationCap, BookOpenCheck } from "lucide-react";

const roleOptions = [
  { value: "creator", label: "Content Creator", desc: "Upload & manage content", icon: Video },
  { value: "learner", label: "Learner", desc: "Consume & learn", icon: GraduationCap },
  { value: "educator", label: "Educator", desc: "Teach & share", icon: BookOpenCheck },
];

export default function RoleCards({ value, onChange }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-2 block">I am a...</label>
      <div className="grid grid-cols-3 gap-3">
        {roleOptions.map((r) => {
          const Icon = r.icon;
          const isActive = value === r.value;
          return (
            <button
              type="button"
              key={r.value}
              onClick={() => onChange(r.value)}
              className={`flex flex-col items-start gap-1.5 p-3 rounded-xl border-2 text-left transition-all ${
                isActive
                  ? "border-blue bg-blue/5 shadow-sm"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isActive ? "bg-blue text-white" : "bg-gray-100 text-gray-500"
                }`}
              >
                <Icon size={16} />
              </div>
              <span className={`text-sm font-semibold ${isActive ? "text-blue" : "text-gray-800"}`}>
                {r.label}
              </span>
              <span className="text-xs text-gray-500">{r.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}