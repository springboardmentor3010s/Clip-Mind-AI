import {
  FaFileAlt,
  FaRobot,
  FaClock,
  FaChartLine,
} from "react-icons/fa";
export default function Features() {
  return (
    <section id="features" className="py-20 bg-gray-100">

      <h2 className="text-5xl font-extrabold text-center text-slate-900">
        Why Choose ClipMind AI?
      </h2>

      <p className="mt-5 text-center text-slate-500 text-lg max-w-3xl mx-auto">
        Everything you need to transform long videos into structured,
        searchable, AI-powered learning resources.
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 px-10 mt-16">

        <div className="bg-white rounded-3xl shadow-lg p-8 transition-all duration-300 hover:-translate-y-2 hover:scale-105 hover:shadow-2xl cursor-pointer border border-slate-100">
          <FaFileAlt className="text-5xl text-blue-600" />

          <h3 className="font-bold text-2xl text-slate-800 mt-5">
            Transcript
          </h3>

          <p className="mt-4 text-slate-500 leading-7">
            Convert speech into accurate text.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-8 transition-all duration-300 hover:-translate-y-2 hover:scale-105 hover:shadow-2xl cursor-pointer border border-slate-100">
          <FaRobot className="text-5xl text-violet-600" />

          <h3 className="font-bold text-2xl text-slate-800 mt-5">
             AI Summary
          </h3>

          <p className="mt-4 text-slate-500 leading-7">
            Generate concise summaries instantly.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-8 transition-all duration-300 hover:-translate-y-2 hover:scale-105 hover:shadow-2xl cursor-pointer border border-slate-100">
          <FaClock className="text-5xl text-emerald-600" />

          <h3 className="font-bold text-2xl text-slate-800 mt-5">
            Key Moments
          </h3>

          <p className="mt-4 text-slate-500 leading-7">
            Jump directly to important parts.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-8 transition-all duration-300 hover:-translate-y-2 hover:scale-105 hover:shadow-2xl cursor-pointer border border-slate-100">
          <FaChartLine className="text-5xl text-orange-500" />
          <h3 className="font-bold text-2xl text-slate-800 mt-5">
            Analytics
          </h3>

          <p className="mt-4 text-slate-500 leading-7">
            Understand your content with insights.
          </p>
        </div>

      </div>

    </section>
  );
}