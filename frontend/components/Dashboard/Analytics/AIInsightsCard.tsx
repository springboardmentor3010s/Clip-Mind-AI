"use client";

interface AIInsightsCardProps {
  report: any;
}

export default function AIInsightsCard({
  report,
}: AIInsightsCardProps) {
  const transcriptWords = report?.transcript_word_count || 0;
  const summaryWords = report?.summary_word_count || 0;

  const compression =
    transcriptWords > 0
      ? Math.round((summaryWords / transcriptWords) * 100)
      : 0;

  const readingSaved =
    transcriptWords > summaryWords
      ? Math.ceil((transcriptWords - summaryWords) / 180)
      : 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">

      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        🧠 AI Insights
      </h2>

      <div className="space-y-5">

        <InsightRow
          title="Processing Status"
          value="Completed"
          color="text-green-600"
        />

        <InsightRow
          title="Compression Ratio"
          value={`${compression}%`}
          color="text-blue-600"
        />

        <InsightRow
          title="Reading Time Saved"
          value={`${readingSaved} min`}
          color="text-purple-600"
        />

        <InsightRow
          title="Keywords Extracted"
          value={`${report?.keywords?.length || 0}`}
          color="text-orange-600"
        />

        <InsightRow
          title="Key Moments"
          value={`${report?.key_moments?.length || 0}`}
          color="text-pink-600"
        />

        <InsightRow
          title="Language"
          value="Auto Detected"
          color="text-cyan-600"
        />

      </div>

    </div>
  );
}

function InsightRow({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex justify-between items-center border-b pb-3">

      <span className="font-medium text-gray-600">
        {title}
      </span>

      <span className={`font-bold ${color}`}>
        {value}
      </span>

    </div>
  );
}