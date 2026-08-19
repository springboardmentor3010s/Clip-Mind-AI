import { useNavigate } from "react-router-dom";
function Hero() {
  const navigate = useNavigate();
  return (
    <section className="min-h-screen flex items-center justify-center bg-slate-950 text-white px-6">
      <div className="text-center max-w-4xl">

        <span className="bg-blue-600/20 text-blue-400 px-4 py-2 rounded-full text-sm">
          🚀 AI Powered Video Platform
        </span>

        <h1 className="mt-8 text-6xl md:text-7xl font-extrabold leading-tight">
          Transform Long Videos Into
          <span className="text-blue-500"> Smart AI Summaries</span>
        </h1>

        <p className="mt-6 text-xl text-gray-400">
          Upload videos, generate transcripts, detect key moments,
          and create AI-powered summaries within seconds.
        </p>

        <div className="mt-10 flex justify-center gap-5">
          <button
            onClick={() => navigate("/register")}
            className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-xl text-lg font-semibold transition"
          >
            Get Started
          </button>

          <button
            onClick={() => navigate("/login")}
            className="border border-slate-700 hover:border-blue-500 hover:text-blue-400 px-8 py-4 rounded-xl text-lg font-semibold transition"
          >
            Login
          </button>
        </div>

      </div>
    </section>
  );
}

export default Hero;