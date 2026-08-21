"use client";

interface Moment {
  start: number;
  end: number;
  text: string;
}

interface KeyMomentsCardProps {
  report: any;
}

export default function KeyMomentsCard({
  report,
}: KeyMomentsCardProps) {

  const moments: Moment[] = report?.key_moments || [];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition duration-300">
      <h2 className="text-2xl font-bold mb-5 text-gray-800">
        ⭐ Key Moments
      </h2>

      <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
        {moments.length > 0 ? (
          moments.map((moment, index) => (
            <div
              key={index}
              className="border-l-4 border-yellow-500 pl-4"
            >
              <div className="font-semibold text-blue-600">
                {moment.start.toFixed(2)}s - {moment.end.toFixed(2)}s
              </div>

              <div className="text-gray-700 mt-1 leading-relaxed">
                {moment.text}
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500">
            No key moments found.
          </p>
        )}
      </div>
    </div>
  );
}