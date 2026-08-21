"use client";

interface SummaryCardProps {
  report: any;
}

export default function SummaryCard({
  report,
}: SummaryCardProps) {

  const summary =
    report?.short_summary ||
    report?.summary ||
    "";

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition duration-300">

      <h2 className="text-2xl font-bold mb-5 text-gray-800">
        📝 AI Summary
      </h2>

      <div className="text-gray-700 leading-8 whitespace-pre-wrap">
        {summary || "Summary not available."}
      </div>

    </div>
  );
}