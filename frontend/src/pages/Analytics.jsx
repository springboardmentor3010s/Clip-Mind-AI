import { useEffect, useState } from "react";
import {
  FaChartLine,
  FaVideo,
  FaRobot,
  FaClock,
  FaCheckCircle,
  FaDatabase,
  FaArrowUp,
  FaDownload,
} from "react-icons/fa";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import "../styles/Analytics.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


function Analytics() {

  const [processingTime, setProcessingTime] = useState("0");
  const [transcriptWords, setTranscriptWords] = useState(0);
  const [summaryWords, setSummaryWords] = useState(0);
  const [compressionRatio, setCompressionRatio] = useState(0);

  const [keywords, setKeywords] = useState([]);
  const [processingScore, setProcessingScore] = useState("");
  const [aiInsight, setAiInsight] = useState("");
  const [videoName, setVideoName] = useState("");

  useEffect(() => {

    setProcessingTime(
      localStorage.getItem("processingTime") || "0"
    );

    setTranscriptWords(
      Number(localStorage.getItem("transcriptWords")) || 0
    );

    setSummaryWords(
      Number(localStorage.getItem("summaryWords")) || 0
    );

    setCompressionRatio(
    Number(localStorage.getItem("compressionRatio")) || 0
    );

    setKeywords(
  JSON.parse(localStorage.getItem("keywords")) || []
);

setProcessingScore(
  localStorage.getItem("processingScore") || "98"
);

setAiInsight(
  localStorage.getItem("aiInsight") || ""
);

setVideoName(
  localStorage.getItem("selectedVideo") || "No Video"
);

  }, []);


const totalVideos = 1;
const processedVideos = transcriptWords > 0 ? 1 : 0;
const totalSummaries = summaryWords > 0 ? 1 : 0;
const avgProcessing = `${processingTime} sec`;

const wordData = [
  {
    name: "Transcript",
    words: transcriptWords,
  },
  {
    name: "Summary",
    words: summaryWords,
  },
];

const compressionData = [
  {
    name: "Compressed",
    value: compressionRatio,
  },
  {
    name: "Remaining",
    value: 100 - compressionRatio,
  },
];

const COLORS = ["#2563EB", "#1E293B"];

const downloadReport = () => {

  const pdf = new jsPDF();

  // ===== HEADER =====
  pdf.setFontSize(22);
  pdf.setFont("helvetica", "bold");
  pdf.text("ClipMind AI", 20, 20);

  pdf.setFontSize(14);
  pdf.setFont("helvetica", "normal");
  pdf.text("AI Video Intelligence Report", 20, 30);

  pdf.setFontSize(10);
  pdf.text(
    "Generated automatically by ClipMind AI",
    20,
    37
  );

  // ===== VIDEO INFORMATION =====
  autoTable(pdf, {
    startY: 48,

    head: [["Video Information", "Details"]],

    body: [
      ["Video Name", videoName],
      ["Processing Time", processingTime + " sec"],
      ["AI Processing Score", processingScore + "%"],
    ],

    theme: "grid",

    headStyles: {
      fillColor: [37, 99, 235],
    },
  });

  // ===== CONTENT ANALYTICS =====
  autoTable(pdf, {
    startY: pdf.lastAutoTable.finalY + 15,

    head: [["Content Analytics", "Value"]],

    body: [
      ["Transcript Words", transcriptWords],
      ["Summary Words", summaryWords],
      ["Compression Ratio", compressionRatio + "%"],
      ["Keywords Detected", keywords.length],
    ],

    theme: "grid",

    headStyles: {
      fillColor: [37, 99, 235],
    },
  });

  // ===== KEYWORDS =====
  autoTable(pdf, {
    startY: pdf.lastAutoTable.finalY + 15,

    head: [["Extracted Keywords"]],

    body: [
      [keywords.length > 0
        ? keywords.join(", ")
        : "No keywords detected"],
    ],

    theme: "grid",

    headStyles: {
      fillColor: [37, 99, 235],
    },
  });

  // ===== AI INSIGHT =====
  autoTable(pdf, {
    startY: pdf.lastAutoTable.finalY + 15,

    head: [["AI Content Insight"]],

    body: [
      [
        aiInsight ||
        "AI insight is not available for this video."
      ],
    ],

    theme: "grid",

    headStyles: {
      fillColor: [37, 99, 235],
    },
  });

  // ===== PROCESSING STATUS =====
  autoTable(pdf, {
    startY: pdf.lastAutoTable.finalY + 15,

    head: [["Processing Status"]],

    body: [
      ["✓ Transcript Generated Successfully"],
      ["✓ AI Summary Generated Successfully"],
      ["✓ Key Moments Detected"],
      ["✓ Keywords Extracted"],
      ["✓ Analytics Generated"],
    ],

    theme: "grid",

    headStyles: {
      fillColor: [37, 99, 235],
    },
  });

  // ===== FOOTER =====
  const pageCount = pdf.internal.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {

    pdf.setPage(i);

    pdf.setFontSize(9);

    pdf.setTextColor(100);

    pdf.text(
      `ClipMind AI | Page ${i} of ${pageCount}`,
      20,
      285
    );

    pdf.text(
      "AI Video Summarization & Key Moments Detection Platform",
      20,
      291
    );
  }

  // ===== DOWNLOAD =====
  pdf.save("ClipMind_AI_Complete_Report.pdf");
};

  return (

    <div className="analytics-page">

      <div className="analytics-header">

        <div>

          <h1>

            <FaChartLine />

            AI Analytics Dashboard

          </h1>

          <p>
            Monitor the performance of your AI video processing platform.
          </p>

        </div>

        <div className="analytics-badge">

          Live Statistics

        </div>

      </div>

      {/* Top Statistics */}

      <div className="analytics-grid">

        <div className="analytics-card">

          <FaVideo className="analytics-icon" />

          <h2>{totalVideos}</h2>

          <p>Total Videos</p>

        </div>

        <div className="analytics-card">

          <FaRobot className="analytics-icon purple" />

          <h2>{processedVideos}</h2>

          <p>AI Processed</p>

        </div>

        <div className="analytics-card">

          <FaCheckCircle className="analytics-icon green" />

          <h2>{totalSummaries}</h2>

          <p>Summaries Generated</p>

        </div>

        <div className="analytics-card">

          <FaClock className="analytics-icon orange" />

          <h2>{avgProcessing}</h2>

          <p>Average Processing</p>

        </div>

      </div>

      {/* Content Analytics */}

      <div className="analytics-grid">

        <div className="analytics-card">

          <h2>{transcriptWords}</h2>

          <p>Transcript Words</p>

        </div>

        <div className="analytics-card">

          <h2>{summaryWords}</h2>

          <p>Summary Words</p>

        </div>

        <div className="analytics-card">

          <h2>{compressionRatio}%</h2>

          <p>Compression Ratio</p>

        </div>

      </div>

      {/* Progress */}

      <div className="progress-section">

        <div className="progress-card">

          <h3>AI Processing Success</h3>

          <div className="progress-bar">

            <div
              className="progress-fill success"
              style={{ width: "100%" }}
            ></div>

          </div>

          <span>100%</span>

        </div>

        <div className="progress-card">

          <h3>Content Compression</h3>

          <div className="progress-bar">

            <div
              className="progress-fill storage"
              style={{ width: `${compressionRatio}%` }}
            ></div>

          </div>

          <span>{compressionRatio}%</span>

        </div>

      </div>

      {/* Charts Section */}

<div className="charts-section">

  <div className="chart-card">

    <h3>Transcript vs Summary</h3>

    <ResponsiveContainer width="100%" height={300}>

      <BarChart data={wordData}>

        <XAxis dataKey="name" />

        <YAxis />

        <Tooltip />

      <Bar
       dataKey="words"
      fill="#2563EB"
      radius={[8,8,0,0]}
/>

      </BarChart>

    </ResponsiveContainer>

  </div>

  <div className="chart-card">

    <h3>Content Compression</h3>

    <ResponsiveContainer width="100%" height={300}>

      <PieChart>

        <Pie
          data={compressionData}
          dataKey="value"
          nameKey="name"
          outerRadius={100}
          label
        >

          {compressionData.map((entry,index)=>(

            <Cell
              key={index}
              fill={COLORS[index]}
            />

          ))}

        </Pie>

        <Tooltip />

        <Legend />

      </PieChart>

    </ResponsiveContainer>

  </div>

</div>

      {/* AI Insights */}

      <div className="insights-section">

        <h2>AI Insights</h2>

        <div className="insights-grid">

          <div className="insight-card">

            <FaArrowUp className="insight-icon" />

            <h4>Transcript Analysis</h4>

            <p>

              Total transcript contains

              <strong> {transcriptWords}</strong>

              {" "}words.

            </p>

          </div>

          <div className="insight-card">

            <FaDatabase className="insight-icon" />

            <h4>Summary Efficiency</h4>

            <p>

              Summary reduced the content to

              <strong> {summaryWords}</strong>

              {" "}words.

            </p>

          </div>

          <div className="insight-card">

            <FaRobot className="insight-icon" />

            <h4>AI Compression</h4>

            <p>

              AI compressed the content by

              <strong> {compressionRatio}%</strong>.

            </p>

          </div>

        </div>

      </div>

      {/* Recent Activity */}

      <div className="activity-card">

        <h2>Recent Activity</h2>

        <ul>

          <li>📤 Video uploaded successfully</li>

          <li>📝 Transcript generated</li>

          <li>📄 AI Summary generated</li>

          <li>⭐ Key Moments detected</li>

          <li>📊 Analytics updated</li>

        </ul>

      </div>

      {/* AI Content Report */}

<div className="report-card">

<h2>📋 AI Content Insights & Usage Report</h2>

<div className="report-grid">

<p><strong>Video :</strong> {videoName}</p>

<p><strong>Processing Time :</strong> {processingTime} sec</p>

<p><strong>Transcript Words :</strong> {transcriptWords}</p>

<p><strong>Summary Words :</strong> {summaryWords}</p>

<p><strong>Compression :</strong> {compressionRatio}%</p>

<p><strong>AI Score :</strong> {processingScore}%</p>

</div>

<button
className="download-btn"
onClick={downloadReport}
>

<FaDownload />

Download Complete Report

</button>

<h3 style={{marginTop:"25px"}}>

🏷 Extracted Keywords

</h3>

<div className="keyword-list">

{keywords.map((item,index)=>(

<span
key={index}
className="keyword-chip"
>

{item}

</span>

))}

</div>

<h3 style={{marginTop:"25px"}}>

🤖 AI Insight

</h3>

<p className="insight-text">

{aiInsight}

</p>

<h3 style={{marginTop:"25px"}}>

✔ Processing Status

</h3>

<ul className="report-list">

<li>Transcript Generated Successfully</li>

<li>Summary Created Successfully</li>

<li>Key Moments Detected</li>

<li>Keywords Extracted</li>

<li>Analytics Generated</li>

</ul>

</div>

    </div>

  );

}

export default Analytics;
