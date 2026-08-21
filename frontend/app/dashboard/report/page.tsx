"use client";

import { useEffect, useState } from "react";
import {
  getReport,
  getHighlightReport,
} from "@/services/video";
import { useSearchParams } from "next/navigation";
import jsPDF from "jspdf";

interface Report {
  video_name: string;
  status: string;
  transcript_word_count: number;
  summary_word_count: number;
  summary: string;
  key_moments: any[];
  keywords: string[];
}

interface HighlightReport {
  executive_summary: string;
  top_highlights: string[];
  important_keywords: string[];
  key_moments: string[];
  ai_insight: string;
}

export default function ReportPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [highlight, setHighlight] =
  useState<HighlightReport | null>(null);

const searchParams = useSearchParams();

useEffect(() => {
  const loadReport = async () => {
    try {
      const id = searchParams.get("videoId");

      if (!id) {
        console.error("No videoId found in URL.");
        return;
      }

      const videoId = Number(id);

      if (isNaN(videoId)) {
        console.error("Invalid videoId:", id);
        return;
      }

      console.log("Loading report for video:", videoId);

      const reportData = await getReport(videoId);

      setReport(reportData);

      const highlightData =
        await getHighlightReport(videoId);

      console.log("Highlight Data:", highlightData);

      setHighlight(
        highlightData.highlight_report
      );
    } catch (error) {
      console.error(
        "Failed to load report:",
        error
      );
    }
  };

  loadReport();
}, [searchParams]);

  if (!report) {
    return (
      <div className="p-8">
        Loading report...
      </div>
    );
  }

const downloadReport = () => {
  if (!report) return;

  const doc = new jsPDF();

  let y = 20;

  doc.setFontSize(20);
  doc.text("ClipMind AI Report", 20, y);

  y += 15;

  doc.setFontSize(12);

  doc.text(`Video Name: ${report.video_name}`, 20, y);
  y += 10;

  doc.text(`Status: ${report.status}`, 20, y);
  y += 10;

  doc.text(
    `Transcript Word Count: ${report.transcript_word_count}`,
    20,
    y
  );
  y += 10;

  doc.text(
    `Summary Word Count: ${report.summary_word_count}`,
    20,
    y
  );
  y += 10;

  doc.text(
    `Total Key Moments: ${report.key_moments.length}`,
    20,
    y
  );

  y += 20;

  doc.setFontSize(16);
  doc.text("AI Summary", 20, y);

  y += 10;

  doc.setFontSize(12);

  const lines = doc.splitTextToSize(report.summary, 170);

  doc.text(lines, 20, y);

  doc.save(`${report.video_name}_AI_Report.pdf`);
};

const downloadHighlightReport = () => {
  if (!highlight || !report) return;

  const doc = new jsPDF();

  let y = 20;

  doc.setFontSize(20);
  doc.text("ClipMind AI - Highlight Report", 20, y);

  y += 15;

  doc.setFontSize(12);

  doc.text(`Video Name: ${report.video_name}`, 20, y);
  y += 12;

  doc.setFontSize(16);
  doc.text("Executive Summary", 20, y);

  y += 10;

  doc.setFontSize(12);

  const summaryLines = doc.splitTextToSize(
    highlight.executive_summary,
    170
  );

  doc.text(summaryLines, 20, y);

  y += summaryLines.length * 7 + 10;

  doc.setFontSize(16);
  doc.text("Top Highlights", 20, y);

  y += 10;

  doc.setFontSize(12);

  highlight.top_highlights.forEach((item) => {
    const lines = doc.splitTextToSize("• " + item, 170);
    doc.text(lines, 20, y);
    y += lines.length * 7 + 5;
  });

  y += 5;

  doc.setFontSize(16);
  doc.text("Important Keywords", 20, y);

  y += 10;

  doc.setFontSize(12);

  doc.text(
    highlight.important_keywords.join(", "),
    20,
    y
  );

  y += 15;

  doc.setFontSize(16);
  doc.text("Key Moments", 20, y);

  y += 10;

  doc.setFontSize(12);

  highlight.key_moments.forEach((item) => {
    const lines = doc.splitTextToSize("• " + item, 170);
    doc.text(lines, 20, y);
    y += lines.length * 7 + 5;
  });

  y += 10;

  doc.setFontSize(16);
  doc.text("AI Insight", 20, y);

  y += 10;

  doc.setFontSize(12);

  const insightLines = doc.splitTextToSize(
    highlight.ai_insight,
    170
  );

  doc.text(insightLines, 20, y);

  doc.save(`${report.video_name}_Highlight_Report.pdf`);
};

return (
  <div className="space-y-8">

    <h1 className="text-3xl font-bold">
      📄 AI Report
    </h1>

    {/* Detailed Report */}

    <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">

      <h2 className="text-2xl font-bold text-purple-700">
        📋 Detailed AI Report
      </h2>

      <div>
        <h2 className="font-bold text-black">
          Video Name
        </h2>

        <p className="text-gray-700">
          {report.video_name}
        </p>
      </div>

      <div>
        <h2 className="font-bold text-black">
          Status
        </h2>

        <p className="text-green-600 font-semibold">
          {report.status}
        </p>
      </div>

      <div>
        <h2 className="font-bold text-black">
          Transcript Word Count
        </h2>

        <p className="text-black text-lg font-semibold">
          {report.transcript_word_count}
        </p>
      </div>

      <div>
        <h2 className="font-bold text-black">
          Summary Word Count
        </h2>

        <p className="text-black text-lg font-semibold">
          {report.summary_word_count}
        </p>
      </div>

      <div>
        <h2 className="font-bold text-black mb-2">
          AI Summary
        </h2>

        <p className="leading-7 text-gray-700 whitespace-pre-wrap">
          {report.summary}
        </p>
      </div>

      <div>
        <h2 className="font-bold text-black">
          Total Key Moments
        </h2>

        <p className="text-black text-lg font-semibold">
          {report.key_moments.length}
        </p>
      </div>

      <div className="flex justify-end">

        <button
          onClick={downloadReport}
          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg shadow transition"
        >
          ⬇ Download Report
        </button>

      </div>

    </div>

    {/* Highlight Report */}

    <div className="bg-white rounded-xl shadow-lg p-8">

      <h2 className="text-2xl font-bold text-yellow-600 mb-8">
        ⭐ AI Highlight Report
      </h2>

      {highlight ? (

        <>

          <div className="mb-8">

            <h3 className="text-xl font-bold text-blue-600 mb-3">
              📌 Executive Summary
            </h3>

            <p className="text-gray-700 leading-7">
              {highlight.executive_summary}
            </p>

          </div>

          <div className="mb-8">

            <h3 className="text-xl font-bold text-yellow-600 mb-3">
              ⭐ Top Highlights
            </h3>

           <ul className="list-disc pl-6 space-y-3">

  {(highlight.top_highlights || []).map((item, index) => (

    <li
      key={index}
      className="text-gray-800 text-lg leading-8 font-medium"
    >
      {item}
    </li>

  ))}

</ul>

          </div>

          <div className="mb-8">

            <h3 className="text-xl font-bold text-purple-600 mb-3">
              🏷 Important Keywords
            </h3>

            <div className="flex flex-wrap gap-3">

              {(highlight.important_keywords || []).map((item, index) => (

                <span
                  key={index}
                  className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full"
                >
                  {item}
                </span>

              ))}

            </div>

          </div>

          <div className="mb-8">

            <h3 className="text-xl font-bold text-green-600 mb-3">
              ⏱ Key Moments Overview
            </h3>

           <ul className="space-y-3">

  {(highlight.key_moments || []).map((item, index) => (

    <li
      key={index}
      className="text-gray-800 text-lg leading-8 font-medium"
    >
      • {item}
    </li>

  ))}

</ul>

          </div>

          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl p-6 text-white">

            <h3 className="text-2xl font-bold mb-3">
              💡 AI Insight
            </h3>

            <p className="leading-7">
              {highlight.ai_insight}
            </p>

          </div>

          <div className="flex justify-end mt-8">

            <button
  onClick={downloadHighlightReport}
  className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2 rounded-lg shadow transition"
>
  ⬇ Download Highlight Report
</button>

          </div>

        </>

      ) : (

        <div className="text-center py-10 text-gray-500">
          Loading Highlight Report...
        </div>

      )}

    </div>

  </div>
);}
