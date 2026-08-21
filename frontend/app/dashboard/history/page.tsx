"use client";

import { useEffect, useState } from "react";
import { getLearningHistory } from "@/services/user";
import { logLearningActivity } from "@/services/user";
interface LearningActivity {
  id: number;
  action: string;
  description: string;
  timestamp: string;
}

export default function LearningHistoryPage() {
  const [activities, setActivities] = useState<
    LearningActivity[]
  >([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await getLearningHistory();

        setActivities(data);
      } catch (error) {
        console.error(
          "Error loading learning history:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  const getIcon = (action: string) => {
    switch (action) {
      case "Video Viewed":
        return "🎥";

      case "Transcript Viewed":
        return "📝";

      case "Summary Viewed":
        return "🤖";

      case "Keywords Viewed":
        return "🏷";

      case "Key Moments Viewed":
        return "⭐";

      case "AI Report Viewed":
        return "📄";

      default:
        return "📚";
    }
  };

  return (
    <div className="p-8">

      <h1 className="text-3xl font-bold text-white mb-8">
        📚 Learning History
      </h1>

      <div className="bg-white rounded-xl shadow-lg p-6">

        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Your Learning Activity
        </h2>

        {loading ? (
          <p className="text-gray-500">
            Loading learning history...
          </p>
        ) : activities.length === 0 ? (
          <div className="text-center py-10">

            <div className="text-5xl mb-4">
              📚
            </div>

            <p className="text-gray-500 text-lg">
              No learning activity yet.
            </p>

            <p className="text-gray-400 mt-2">
              Open a video, transcript, summary or
              key moment to start building your history.
            </p>

          </div>
        ) : (
          <div className="space-y-4">

            {activities.map((activity) => (
              <div
                key={activity.id}
                className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition"
              >

                <div className="flex items-start gap-4">

                  <div className="text-3xl">
                    {getIcon(activity.action)}
                  </div>

                  <div className="flex-1">

                    <h3 className="text-lg font-semibold text-gray-800">
                      {activity.action}
                    </h3>

                    <p className="text-gray-600 mt-1">
                      {activity.description}
                    </p>

                    <p className="text-sm text-gray-400 mt-2">
                      {new Date(
                        activity.timestamp
                      ).toLocaleString()}
                    </p>

                  </div>

                </div>

              </div>
            ))}

          </div>
        )}

      </div>

    </div>
  );
}