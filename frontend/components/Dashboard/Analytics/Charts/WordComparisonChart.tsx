"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
} from "recharts";

interface Props {
  transcriptWords: number;
  summaryWords: number;
  keywords: number;
  keyMoments: number;
}

export default function WordComparisonChart({
  transcriptWords,
  summaryWords,
  keywords,
  keyMoments,
}: Props) {
  const data = [
    {
      name: "Transcript",
      value: transcriptWords,
    },
    {
      name: "Summary",
      value: summaryWords,
    },
    {
      name: "Keywords",
      value: keywords,
    },
    {
      name: "Highlights",
      value: keyMoments,
    },
  ];

  const colors = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300">

      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        📊 Word Comparison
      </h2>

      <p className="text-gray-500 mb-6">
        Compare transcript, summary, keywords and highlights.
      </p>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data}>

          <CartesianGrid strokeDasharray="4 4" />

          <XAxis dataKey="name" />

          <YAxis />

          <Tooltip />

          <Legend />

          <Bar
            dataKey="value"
            radius={[8, 8, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={colors[index]}
              />
            ))}
          </Bar>

        </BarChart>
      </ResponsiveContainer>

    </div>
  );
}