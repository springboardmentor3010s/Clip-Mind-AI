import { Link } from "react-router-dom";
import { CONTACT_EMAIL } from "../lib/site";

function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 px-6 py-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">

        <div className="md:col-span-2">
          <h2 className="text-2xl font-bold text-blue-500">ClipMind AI</h2>
          <p className="text-gray-400 mt-3 max-w-md text-sm leading-relaxed">
            Turn long-form video into transcripts, structured summaries and
            timestamped key moments — so you can find what matters in seconds
            instead of watching the whole thing.
          </p>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Platform</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><Link to="/features" className="hover:text-blue-400 transition">Features</Link></li>
            <li><Link to="/about" className="hover:text-blue-400 transition">About</Link></li>
            <li><Link to="/register" className="hover:text-blue-400 transition">Create account</Link></li>
            <li><Link to="/login" className="hover:text-blue-400 transition">Sign in</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Support</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><Link to="/contact" className="hover:text-blue-400 transition">Contact us</Link></li>
            <li>
              <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-blue-400 transition break-all">
                {CONTACT_EMAIL}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-slate-800 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} ClipMind AI. AI-generated summaries may contain
        inaccuracies — always verify against the source video.
      </div>
    </footer>
  );
}

export default Footer;
