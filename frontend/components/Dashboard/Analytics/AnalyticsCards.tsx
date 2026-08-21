"use client";

interface AnalyticsCardsProps {
  report: any;
}

export default function AnalyticsCards({
  report,
}: AnalyticsCardsProps) {
  const cards = [
    {
      title: "Transcript Words",
      value: report?.transcript_word_count || 0,
      icon: "🎥",
      color: "bg-blue-500",
    },
    {
      title: "Summary Words",
      value: report?.summary_word_count || 0,
      icon: "📝",
      color: "bg-green-500",
    },
    {
      title: "Key Moments",
      value: report?.key_moments?.length || 0,
      icon: "⭐",
      color: "bg-yellow-500",
    },
    {
      title: "Keywords",
      value: report?.keywords?.length || 0,
      icon: "🏷️",
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition duration-300"
        >
          <div
            className={`w-12 h-12 ${card.color} rounded-full flex items-center justify-center text-2xl`}
          >
            {card.icon}
          </div>

          <h3 className="mt-5 text-gray-500 text-sm">
            {card.title}
          </h3>

          <p className="text-4xl font-bold mt-2 text-gray-900">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}