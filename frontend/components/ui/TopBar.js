"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import { BellIcon } from "./icons";

const PAGE_TITLES = [
  { match: /\/dashboard\/content-creator\/videos/, label: "My Videos" },
  { match: /\/dashboard\/educator\/videos/, label: "My Videos" },
  { match: /\/dashboard\/videos\/.+/, label: "Video" },
  { match: /\/dashboard\/upload/, label: "Upload Video" },
  { match: /\/dashboard\/analytics/, label: "Analytics" },
  { match: /\/dashboard\/bookmarks/, label: "Bookmarks" },
  { match: /\/dashboard\/settings/, label: "Settings" },
  { match: /\/dashboard\/help/, label: "Help & Support" },
  { match: /\/dashboard\/profile/, label: "Profile" },
  { match: /\/dashboard\/admin/, label: "Dashboard" },
  { match: /\/dashboard\/(content-creator|educator|learner)$/, label: "Dashboard" },
  { match: /\/dashboard$/, label: "Dashboard" },
];

function usePageTitle() {
  const pathname = usePathname();
  const found = PAGE_TITLES.find((p) => p.match.test(pathname));
  return found?.label || "ClipMind AI";
}

export default function TopBar() {
  const { user } = useAuth();
  const title = usePageTitle();

  if (!user) return null;

  return (
    <div className="flex items-center justify-between gap-3 border-b border-line bg-cloud px-6 py-3 dark:border-line-dark dark:bg-graphite">
      <div className="flex min-w-0 items-center gap-2">
        <h1 className="truncate font-display text-sm font-semibold tracking-tight text-ink dark:text-paper">
          {title}
        </h1>
      </div>

      <button
        title="Notifications"
        className="flex h-9 w-9 items-center justify-center rounded-full text-ink/50 hover:bg-paper dark:text-paper/50 dark:hover:bg-graphite-2"
      >
        <BellIcon width={18} height={18} />
      </button>
    </div>
  );
}