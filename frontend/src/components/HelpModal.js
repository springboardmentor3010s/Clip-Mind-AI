"use client";

import { useState } from "react";
import { X, ChevronDown, Mail, MessageCircle } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const faqs = [
  {
    q: "How do I upload a video?",
    a: "Go to the Upload Video tab from the sidebar, then drag and drop your file or click Browse Files. Supported formats are MP4, MOV, AVI, and WebM, up to 2GB.",
  },
  {
    q: "Why don't I see a transcript or summary yet?",
    a: "Transcript generation and AI summarization are being built in the next milestone. Right now, uploads are validated, stored, and processed with FFmpeg to extract duration and a thumbnail.",
  },
  {
    q: "Can I delete an uploaded video?",
    a: "Yes. Hover over any video in Recent Uploads and click the trash icon to permanently delete it from the server and database.",
  },
  {
    q: "How do I switch between light and dark mode?",
    a: "Click your profile at the bottom of the sidebar, then toggle Dark Mode from the menu — or from Settings.",
  },
];

export default function HelpModal({ onClose }) {
  const { isDark } = useTheme();
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col ${
          isDark ? "bg-[#181B23] text-gray-100" : "bg-white text-gray-900"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/10">
          <h3 className="text-lg font-bold">Help & Support</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Frequently Asked Questions</p>
          {faqs.map((item, i) => (
            <div key={i} className={`rounded-lg border ${isDark ? "border-white/10" : "border-gray-200"}`}>
              <button
                onClick={() => setOpenIndex(openIndex === i ? -1 : i)}
                className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium"
              >
                {item.q}
                <ChevronDown
                  size={16}
                  className={`text-gray-400 transition-transform ${openIndex === i ? "rotate-180" : ""}`}
                />
              </button>
              {openIndex === i && (
                <p className={`px-4 pb-3 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>{item.a}</p>
              )}
            </div>
          ))}

          <div className="h-px bg-gray-200/10 my-2" />

          <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Still need help?</p>
          
           <a href="mailto:support@clipmind.ai"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
              isDark ? "hover:bg-white/5" : "hover:bg-gray-50"
            }`}
          >
            <Mail size={16} className="text-blue" />
            <span className="text-sm">support@clipmind.ai</span>
          </a>
          <div
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${
              isDark ? "text-gray-500" : "text-gray-400"
            }`}
          >
            <MessageCircle size={16} />
            <span className="text-sm">Live chat — coming soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}