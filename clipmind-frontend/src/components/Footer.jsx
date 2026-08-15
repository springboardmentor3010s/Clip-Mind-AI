import {
  FaBrain,
  FaGithub,
  FaLinkedin,
  FaEnvelope,
} from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white mt-24">

      <div className="max-w-7xl mx-auto px-8 py-16">

        <div className="grid md:grid-cols-4 gap-12">

          {/* Brand */}

          <div>

            <div className="flex items-center gap-3">

              <div className="bg-violet-600 p-3 rounded-full">
                <FaBrain className="text-white text-xl" />
              </div>

              <div>

                <h2 className="text-2xl font-bold">
                  ClipMind AI
                </h2>

                <p className="text-slate-400 text-sm">
                  AI Video Intelligence
                </p>

              </div>

            </div>

            <p className="mt-6 text-slate-400 leading-7">
              Transform lectures, webinars and meetings into
              transcripts, AI summaries, key moments and
              actionable insights.
            </p>

          </div>

          {/* Product */}

          <div>

            <h3 className="font-bold text-lg mb-5">
              Product
            </h3>

            <ul className="space-y-3 text-slate-400">

              <li className="hover:text-white cursor-pointer">
                Features
              </li>

              <li className="hover:text-white cursor-pointer">
                Workflow
              </li>

              <li className="hover:text-white cursor-pointer">
                Dashboard
              </li>

              <li className="hover:text-white cursor-pointer">
                AI Processing
              </li>

            </ul>

          </div>

          {/* Resources */}

          <div>

            <h3 className="font-bold text-lg mb-5">
              Resources
            </h3>

            <ul className="space-y-3 text-slate-400">

              <li className="hover:text-white cursor-pointer">
                Documentation
              </li>

              <li className="hover:text-white cursor-pointer">
                Support
              </li>

              <li className="hover:text-white cursor-pointer">
                Privacy Policy
              </li>

              <li className="hover:text-white cursor-pointer">
                Terms of Service
              </li>

            </ul>

          </div>

          {/* Contact */}

          <div>

            <h3 className="font-bold text-lg mb-5">
              Connect
            </h3>

            <div className="flex gap-5 text-2xl">

              <FaGithub className="hover:text-violet-400 cursor-pointer transition" />

              <FaLinkedin className="hover:text-violet-400 cursor-pointer transition" />

              <FaEnvelope className="hover:text-violet-400 cursor-pointer transition" />

            </div>

          </div>

        </div>

        <div className="border-t border-slate-700 mt-12 pt-8 text-center text-slate-500">

          © 2026 ClipMind AI. All Rights Reserved.

        </div>

      </div>

    </footer>
  );
}