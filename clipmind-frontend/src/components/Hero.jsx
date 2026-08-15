"use client";

import { useRouter } from "next/navigation";

import {
  FaVideo,
  FaBolt,
  FaGraduationCap
} from "react-icons/fa";

export default function Hero() {
  const router = useRouter();
  return (
    <section id="home" className="relative overflow-hidden">

      {/* Background */}

      <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-violet-50 to-sky-50"></div>

      {/* Decorative Circles */}

      <div className="absolute w-72 h-72 bg-pink-100 rounded-full blur-3xl opacity-50 -top-20 -left-20"></div>

      <div className="absolute w-96 h-96 bg-violet-100 rounded-full blur-3xl opacity-50 top-20 right-0"></div>

      <div className="absolute w-80 h-80 bg-emerald-100 rounded-full blur-3xl opacity-40 bottom-0 left-1/3"></div>

      {/* Content */}

      <div className="relative max-w-6xl mx-auto px-6 py-28 text-center">

        <p className="inline-block bg-white shadow-sm rounded-full px-5 py-2 text-violet-600 font-medium">

          🌸 AI Powered Learning Platform

        </p>

        <h1 className="mt-8 text-6xl md:text-7xl font-extrabold text-slate-900 leading-tight">
          AI Video Intelligence
          <br />
          <span className="text-violet-600">
            for Smarter Learning
          </span>
        </h1>

        <p className="mt-8 text-xl text-slate-600 max-w-3xl mx-auto leading-8">

          Transform lectures, webinars, meetings, and educational videos into
          accurate transcripts, AI-powered summaries, key moments, and actionable
          insights—all within seconds.

        </p>

        {/* Buttons */}

        <div className="mt-12 flex justify-center gap-5 flex-wrap">

          
          <button
            onClick={() => router.push("/register")}
            className="bg-violet-600 hover:bg-violet-700 text-white transition duration-300 px-10 py-5 rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl"
          >
            Start Free
          </button>

          <button
            onClick={() =>
              document
                .getElementById("features")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="bg-white border border-slate-300 hover:bg-slate-100 transition px-8 py-4 rounded-full font-semibold text-slate-700"
          >
            Learn More
          </button>

        </div>

        {/* Stats */}

        <div className="mt-24 grid md:grid-cols-3 gap-8">

          <div className="bg-white rounded-3xl shadow-lg p-8 transition-all duration-300 hover:-translate-y-2 hover:scale-105 hover:shadow-2xl cursor-pointer">

            <FaVideo className="mx-auto text-5xl text-violet-600" />

            <h3 className="mt-5 text-3xl font-extrabold text-slate-900">
              Video Processing
            </h3>

            <p className="mt-2 text-slate-500 text-base">
              Upload, process and organize videos effortlessly.
            </p>

          </div>

          <div className="bg-white rounded-3xl shadow-lg p-8 transition-all duration-300 hover:-translate-y-2 hover:scale-105 hover:shadow-2xl cursor-pointer">

            <FaGraduationCap className="mx-auto text-5xl text-blue-600" />

            <h3 className="mt-5 text-3xl font-extrabold text-slate-900">
              Learning Focused
            </h3>

            <p className="mt-2 text-slate-500 text-base">
              Built for students, educators and content creators.
            </p>

          </div>

          <div className="bg-white rounded-3xl shadow-lg p-8 transition-all duration-300 hover:-translate-y-2 hover:scale-105 hover:shadow-2xl cursor-pointer">

            <FaBolt className="mx-auto text-5xl text-emerald-600" />

            <h3 className="mt-5 text-3xl font-extrabold text-slate-900">
              AI Powered
            </h3>

            <p className="mt-2 text-slate-500 text-base">
              Powered by Whisper, FFmpeg and intelligent automation.
            </p>

          </div>

        </div>

      </div>

    </section>
  );
}