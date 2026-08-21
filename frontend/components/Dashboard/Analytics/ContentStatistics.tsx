"use client";

interface Report {
  video_name: string;
  status: string;
  transcript_word_count: number;
  summary_word_count: number;
  key_moments: any[];
  keywords: any[];
}

interface ContentStatisticsProps {
  report: Report;
}

export default function ContentStatistics({
  report,
}: ContentStatisticsProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition duration-300">

      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        📈 Content Statistics
      </h2>

      <div className="space-y-4">

        <div className="flex justify-between">
          <span className="font-medium text-gray-600">
            Video Name
          </span>

          <span className="font-semibold text-black">
            {report?.video_name || "N/A"}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="font-medium text-gray-600">
            Status
          </span>

          <span
            className={`font-semibold ${
              report?.status === "Completed"
                ? "text-green-600"
                : "text-yellow-600"
            }`}
          >
            {report?.status || "Unknown"}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="font-medium text-gray-600">
            Transcript Words
          </span>

          <span className="font-semibold text-black">
            {report?.transcript_word_count || 0}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="font-medium text-gray-600">
            Summary Words
          </span>

          <span className="font-semibold text-black">
            {report?.summary_word_count || 0}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="font-medium text-gray-600">
            Keywords
          </span>

          <span className="font-semibold text-black">
            {report?.keywords?.length || 0}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="font-medium text-gray-600">
            Key Moments
          </span>

          <span className="font-semibold text-black">
            {report?.key_moments?.length || 0}
          </span>
        </div>

      </div>

    </div>
  );
}