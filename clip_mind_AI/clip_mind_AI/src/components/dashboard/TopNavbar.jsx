import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useVideo } from "../../context/VideoContext";

const LANGUAGES = [
  "Original", "English", "Hindi", "Haryanvi", "Urdu", "Punjabi", "Marathi",
  "Gujarati", "Tamil", "Telugu", "Bengali", "Kannada", "Malayalam",
  "Spanish", "French", "German", "Arabic",
];

function TopNavbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { displayLanguage, setDisplayLanguage, translating } = useVideo();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleLanguage = (e) => {
    const value = e.target.value;
    if (value === "__custom__") {
      const custom = window.prompt("Enter a language (e.g. Nepali, Bhojpuri):");
      if (custom && custom.trim()) setDisplayLanguage(custom.trim());
      return;
    }
    setDisplayLanguage(value);
  };

  const initials = user?.first_name?.[0]?.toUpperCase() ?? "U";
  const displayName = user?.full_name || user?.first_name || "User";
  const displayRole = user?.role ?? "member";

  // Include a custom (non-listed) language as a selectable option.
  const options = LANGUAGES.includes(displayLanguage) ? LANGUAGES : [displayLanguage, ...LANGUAGES];

  return (
    <div className="h-20 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8 gap-4">
      {/* Left — language selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-400 hidden sm:inline">🌐 Language</span>
        <select
          value={displayLanguage}
          onChange={handleLanguage}
          title="Translate transcript, summary & key moments"
          className="bg-slate-800 text-white rounded-lg border border-slate-700 px-3 py-2 text-sm outline-none focus:border-blue-500 transition cursor-pointer"
        >
          {options.map((lang) => (
            <option key={lang} value={lang}>{lang === "Original" ? "Original (detected)" : lang}</option>
          ))}
          <option value="__custom__">Custom…</option>
        </select>
        {translating && <span className="text-blue-400 text-xs animate-pulse">translating…</span>}
      </div>

      {/* Right — user info + logout */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
            {initials}
          </div>
          <div className="hidden sm:block">
            <h3 className="font-semibold leading-tight">{displayName}</h3>
            <p className="text-sm text-gray-400 capitalize">{displayRole}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white font-semibold transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default TopNavbar;
