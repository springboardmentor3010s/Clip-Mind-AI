"use client";

import { useState } from "react";
import { GraduationCap, Loader2, HelpCircle, Tag, ListChecks } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import VideoSelector from "@/components/VideoSelector";

export default function LearningMaterials({ role }) {
  const { isDark } = useTheme();
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [material, setMaterial] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  const cardBg = isDark ? "bg-[#181B23] border-white/10" : "bg-white border-gray-200";
  const textPrimary = isDark ? "text-gray-100" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-500";

  function handleSelectVideo(v) {
    setSelectedVideo(v);
    setMaterial(null);
    setError("");
    checkExisting(v.video_id);
  }

  async function checkExisting(videoId) {
    setChecking(true);
    const token = localStorage.getItem("clipmind_token");
    try {
      const res = await fetch(`http://localhost:8000/api/v1/materials/${videoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setMaterial(await res.json());
    } catch (err) {
      // no existing material
    }
    setChecking(false);
  }

  async function generateMaterial() {
    if (!selectedVideo) return;
    setGenerating(true);
    setError("");
    const token = localStorage.getItem("clipmind_token");
    try {
      const res = await fetch("http://localhost:8000/api/v1/materials/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ video_id: selectedVideo.video_id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Failed to generate learning material.");
        setGenerating(false);
        return;
      }
      setMaterial(data);
    } catch (err) {
      setError("Could not connect to server.");
    }
    setGenerating(false);
  }

  return (
    <div>
      <h2 className={`text-2xl font-bold ${textPrimary}`}>Learning Materials</h2>
      <p className={`${textSecondary} mt-1 mb-4`}>
        {role === "educator"
          ? "Turn a video's summary into key points, quiz questions, and keywords for your students."
          : "Structured study material created by your Educator."}
      </p>

      <VideoSelector onSelect={handleSelectVideo} selectedVideo={selectedVideo} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          {selectedVideo?.video_url ? (
            <video
              key={selectedVideo.video_id}
              src={selectedVideo.video_url}
              controls
              className="w-full rounded-xl bg-black aspect-video"
            />
          ) : (
            <div className="bg-[#101820] rounded-xl aspect-video flex items-center justify-center">
              <p className="text-gray-400 text-sm">No video selected</p>
            </div>
          )}
          <p className={`text-sm font-semibold ${textPrimary} mt-3 truncate`}>{selectedVideo?.title || "—"}</p>

          {role === "educator" && (
            <div className={`${cardBg} border rounded-xl p-4 mt-4`}>
              <button
                onClick={generateMaterial}
                disabled={!selectedVideo || generating}
                className="w-full flex items-center justify-center gap-2 bg-blue text-white text-sm font-semibold py-2.5 rounded-full hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <GraduationCap size={15} />
                    {material ? "Regenerate Material" : "Generate Material"}
                  </>
                )}
              </button>
              {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 flex flex-col gap-4">
          {checking ? (
            <div className={`${cardBg} border rounded-xl p-10 text-center`}>
              <Loader2 className="animate-spin text-gray-400 mx-auto mb-2" size={22} />
              <p className={`text-sm ${textSecondary}`}>Checking for existing material...</p>
            </div>
          ) : !material ? (
            <div className={`${cardBg} border rounded-xl p-10 text-center`}>
              <GraduationCap className="text-gray-400 mx-auto mb-3" size={28} />
              <p className={`text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                No learning material yet
              </p>
              <p className={`text-xs ${textSecondary} mt-1 max-w-xs mx-auto`}>
                {role === "educator"
                  ? "Select a video with a summary already generated, then click Generate Material."
                  : "Your Educator hasn't created study material for this video yet."}
              </p>
            </div>
          ) : (
            <>
              <div className={`${cardBg} border rounded-xl p-5 shadow-sm`}>
                <h4 className={`font-semibold ${textPrimary} mb-3 flex items-center gap-2`}>
                  <ListChecks size={16} />
                  Key Points
                </h4>
                <ul className="list-disc pl-5 flex flex-col gap-1.5">
                  {material.key_points.map((point, i) => (
                    <li key={i} className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"} leading-relaxed`}>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              {material.keywords?.length > 0 && (
                <div className={`${cardBg} border rounded-xl p-5 shadow-sm`}>
                  <h4 className={`font-semibold ${textPrimary} mb-3 flex items-center gap-2`}>
                    <Tag size={16} />
                    Keywords
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {material.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue/10 text-blue"
                      >
                        {kw.word || kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {material.qa_pairs?.length > 0 && (
                <div className={`${cardBg} border rounded-xl p-5 shadow-sm`}>
                  <h4 className={`font-semibold ${textPrimary} mb-3 flex items-center gap-2`}>
                    <HelpCircle size={16} />
                    Quiz Questions
                  </h4>
                  <div className="flex flex-col gap-3">
                    {material.qa_pairs.map((qa, i) => (
                      <details key={i} className={`rounded-lg border ${isDark ? "border-white/10" : "border-gray-200"}`}>
                        <summary className={`text-sm font-medium cursor-pointer px-3 py-2.5 ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                          {qa.question}
                        </summary>
                        <p className={`text-sm px-3 pb-3 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{qa.answer}</p>
                      </details>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}