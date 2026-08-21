"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

interface Props {
  transcriptWords: number;
  summaryWords: number;
  keywords: number;
  keyMoments: number;
}

export default function ContentDistributionChart({
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

  const COLORS = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300">

      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        🥧 Content Distribution
      </h2>

      <p className="text-gray-500 mb-6">
        Percentage distribution of AI generated content.
      </p>

      <ResponsiveContainer width="100%" height={350}>

        <PieChart>

          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={110}
            innerRadius={55}
            paddingAngle={4}
            label
          >
            {data.map((entry, index) => (
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
  );
}