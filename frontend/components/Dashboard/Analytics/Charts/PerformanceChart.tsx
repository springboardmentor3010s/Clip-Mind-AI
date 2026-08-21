"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface Props {
  transcriptWords: number;
  summaryWords: number;
  keywords: number;
  keyMoments: number;
}

export default function PerformanceChart({
  transcriptWords,
  summaryWords,
  keywords,
  keyMoments,
}: Props) {
  const data = [
    {
      metric: "Transcript",
      value: transcriptWords,
    },
    {
      metric: "Summary",
      value: summaryWords,
    },
    {
      metric: "Keywords",
      value: keywords,
    },
    {
      metric: "Highlights",
      value: keyMoments,
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300">

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            📈 AI Performance
          </h2>

          <p className="text-gray-500 mt-1">
            AI processing metrics and content insights
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="5 5" />

          <XAxis dataKey="metric" />

          <YAxis />

          <Tooltip />

          <Legend />

          <Line
            type="monotone"
            dataKey="value"
            stroke="#2563EB"
            strokeWidth={4}
            dot={{
              r: 7,
              fill: "#2563EB",
            }}
            activeDot={{
              r: 10,
            }}
          />
        </LineChart>
      </ResponsiveContainer>

    </div>
  );
}