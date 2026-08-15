import {
  FaUpload,
  FaFileAlt,
  FaRobot,
  FaStar,
  FaChartLine,
  FaArrowRight,
} from "react-icons/fa";

export default function Workflow() {
  const steps = [
    {
      icon: <FaUpload className="text-4xl text-violet-600" />,
      title: "Upload Video",
      description: "Upload your lecture, webinar or meeting recording.",
    },
    {
      icon: <FaFileAlt className="text-4xl text-blue-600" />,
      title: "Generate Transcript",
      description: "Convert speech into accurate searchable text.",
    },
    {
      icon: <FaRobot className="text-4xl text-purple-600" />,
      title: "AI Summary",
      description: "Create concise AI-generated summaries instantly.",
    },
    {
      icon: <FaStar className="text-4xl text-amber-500" />,
      title: "Key Moments",
      description: "Automatically identify the most important moments.",
    },
    {
      icon: <FaChartLine className="text-4xl text-emerald-600" />,
      title: "Analytics",
      description: "Visualize insights and understand your content.",
    },
  ];

  return (
    <section id="workflow" className="py-24 bg-white">

      <div className="max-w-7xl mx-auto px-6">

        <h2 className="text-5xl font-extrabold text-center text-slate-900">
          How It Works
        </h2>

        <p className="mt-5 text-center text-slate-500 text-lg max-w-3xl mx-auto">
          ClipMind AI processes your videos through an intelligent pipeline,
          transforming raw content into structured knowledge.
        </p>

        <div className="mt-20 flex flex-wrap justify-center items-center gap-6">

          {steps.map((step, index) => (
            <div
              key={step.title}
              className="flex items-center"
            >

              <div className="bg-white border border-slate-200 rounded-3xl shadow-lg p-8 w-64 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">

                <div className="flex justify-center">
                  {step.icon}
                </div>

                <h3 className="mt-6 text-2xl font-bold text-slate-800">
                  {step.title}
                </h3>

                <p className="mt-3 text-slate-500 leading-7">
                  {step.description}
                </p>

              </div>

              {index < steps.length - 1 && (
                <FaArrowRight className="hidden lg:block text-3xl text-violet-500 mx-5" />
              )}

            </div>
          ))}

        </div>

      </div>

    </section>
  );
}