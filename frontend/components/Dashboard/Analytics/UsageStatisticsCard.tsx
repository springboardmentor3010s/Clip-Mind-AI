"use client";

interface UsageStatisticsProps {
  report: any;
}

export default function UsageStatisticsCard({
  report,
}: UsageStatisticsProps) {

  const transcriptWords =
    report?.transcript_word_count || 0;

  const summaryWords =
    report?.summary_word_count || 0;

  // Temporary until backend returns actual duration
  const durationMinutes = 5;

  const speakingSpeed =
    transcriptWords
      ? Math.round(transcriptWords / durationMinutes)
      : 0;

  const readingTime =
    summaryWords
      ? Math.max(1, Math.ceil(summaryWords / 200))
      : 0;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">

      <h2 className="text-2xl font-bold mb-6 text-gray-900">
        📈 Usage Statistics
      </h2>

      <div className="space-y-4">

        <div className="flex justify-between">
          <span className="text-gray-700 font-medium">
            🎬 Video Duration
          </span>

          <span className="font-bold text-black">
            {durationMinutes} min
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-700 font-medium">
            📝 Transcript Words
          </span>

          <span className="font-bold text-black">
            {transcriptWords}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-700 font-medium">
            🤖 Summary Words
          </span>

          <span className="font-bold text-black">
            {summaryWords}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-700 font-medium">
            📖 Reading Time
          </span>

          <span className="font-bold text-black">
            {readingTime} min
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-700 font-medium">
            🎤 Speaking Speed
          </span>

          <span className="font-bold text-black">
            {speakingSpeed} WPM
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-700 font-medium">
            🌍 Language
          </span>

          <span className="font-bold text-black">
            Auto Detected
          </span>
        </div>

      </div>

    </div>
  );
}