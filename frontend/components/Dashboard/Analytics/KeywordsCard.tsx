"use client";

interface KeywordsCardProps {
  report: any;
}

export default function KeywordsCard({
  report,
}: KeywordsCardProps) {
  const keywords = report?.keywords || [];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition duration-300">
      <h2 className="text-2xl font-bold mb-5 text-gray-800">
        🏷 Top Keywords
      </h2>

      <div className="flex flex-wrap gap-3">
        {keywords.length > 0 ? (
          keywords.map((keyword: string, index: number) => (
            <span
              key={index}
              className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-medium hover:bg-blue-200 transition"
            >
              {keyword}
            </span>
          ))
        ) : (
          <p className="text-gray-500">
            No keywords available.
          </p>
        )}
      </div>
    </div>
  );
}