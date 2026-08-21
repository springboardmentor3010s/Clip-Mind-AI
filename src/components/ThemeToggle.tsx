import { FiMoon, FiSun } from "react-icons/fi";
import { useTheme } from "../context/ThemeContext";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
      className={`h-10 w-10 rounded-xl border border-border bg-card/60 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors ${className}`}
    >
      {theme === "dark" ? <FiSun /> : <FiMoon />}
    </button>
  );
}
