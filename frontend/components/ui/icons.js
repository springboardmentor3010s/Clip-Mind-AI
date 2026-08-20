// Lightweight line-icon set (no external dependency) matching the product's wireframes.
const base = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function HomeIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

export function FilmIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="2.75" y="4.5" width="18.5" height="15" rx="1.5" />
      <path d="M7.5 4.5v15M16.5 4.5v15M2.75 9.5h4.75M2.75 14.5h4.75M16.5 9.5h4.75M16.5 14.5h4.75" />
    </svg>
  );
}

export function UploadIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 15.5V4M12 4 7.5 8.5M12 4l4.5 4.5" />
      <path d="M4 15.5v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

export function BarChartIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 19.5V10M10 19.5V4.5M16 19.5V13M4 19.5h16" />
    </svg>
  );
}

export function BookmarkIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M6 3.75h12a.75.75 0 0 1 .75.75v16l-6.75-4-6.75 4v-16a.75.75 0 0 1 .75-.75Z" />
    </svg>
  );
}

export function SettingsIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="3.25" />
      <path d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2.05 2.05 0 1 1-2.9 2.9l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56v.17a2.05 2.05 0 1 1-4.1 0v-.09a1.7 1.7 0 0 0-1.11-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2.05 2.05 0 1 1-2.9-2.9l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H4.6a2.05 2.05 0 1 1 0-4.1h.09A1.7 1.7 0 0 0 6.24 7.3a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2.05 2.05 0 1 1 2.9-2.9l.06.06a1.7 1.7 0 0 0 1.87.34H10.7A1.7 1.7 0 0 0 11.73 1.3V1.2a2.05 2.05 0 1 1 4.1 0v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2.05 2.05 0 1 1 2.9 2.9l-.06.06a1.7 1.7 0 0 0-.34 1.87v.03a1.7 1.7 0 0 0 1.56 1.03h.17a2.05 2.05 0 1 1 0 4.1h-.09a1.7 1.7 0 0 0-1.56 1.03Z" />
    </svg>
  );
}

export function HelpIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9.25" />
      <path d="M9.5 9.25a2.5 2.5 0 1 1 3.4 2.33c-.7.28-1.4.9-1.4 1.92v.25" />
      <path d="M12 17.25h.01" />
    </svg>
  );
}

export function BellIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M18 8.5a6 6 0 1 0-12 0c0 5.5-2 7-2 7h16s-2-1.5-2-7Z" />
      <path d="M10.3 19a1.7 1.7 0 0 0 3.4 0" />
    </svg>
  );
}

export function CloudUploadIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M7 18.25a4.5 4.5 0 0 1-.5-8.97 5.5 5.5 0 0 1 10.8-1 4 4 0 0 1-.3 8" />
      <path d="M12 11v7.5m0-7.5 3 3m-3-3-3 3" />
    </svg>
  );
}

export function PlayIcon(props) {
  return (
    <svg {...{ ...base, fill: "currentColor", stroke: "none" }} {...props}>
      <path d="M8 5.5v13l11-6.5-11-6.5Z" />
    </svg>
  );
}

export function EyeIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M2.5 12S5.5 5.5 12 5.5 21.5 12 21.5 12 18.5 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.75" />
    </svg>
  );
}

export function MoreIcon(props) {
  return (
    <svg {...{ ...base, fill: "currentColor", stroke: "none" }} {...props}>
      <circle cx="12" cy="5.5" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="18.5" r="1.5" />
    </svg>
  );
}

export function DownloadIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5v11m0 0-3.5-3.5M12 14.5 15.5 11" />
      <path d="M4.5 16v3a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-3" />
    </svg>
  );
}

export function CheckCircleIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9.25" />
      <path d="M8 12.3l2.7 2.7 5.3-5.6" />
    </svg>
  );
}

export function ClockIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9.25" />
      <path d="M12 7v5.2l3.5 2" />
    </svg>
  );
}

export function ChevronDownIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M6 9.5 12 15.5 18 9.5" />
    </svg>
  );
}

export function CheckIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M5 12.5 9.5 17 19 6.5" />
    </svg>
  );
}

export function LogOutIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M9 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3" />
      <path d="M16 16.5 21 12l-5-4.5M21 12H9" />
    </svg>
  );
}

export function SunIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </svg>
  );
}

export function MoonIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M20 14.2A8.5 8.5 0 1 1 9.8 4a6.7 6.7 0 0 0 10.2 10.2Z" />
    </svg>
  );
}

export function PanelIcon(props) {
  return (
    <svg {...{ ...base, width: 16, height: 16, strokeWidth: 1.5 }} {...props}>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <line x1="9" y1="4.5" x2="9" y2="19.5" />
    </svg>
  );
}

export function SearchIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M20 20l-4.5-4.5" />
    </svg>
  );
}

export function KeyMomentIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 2.5 14.6 9l6.9.6-5.2 4.5 1.6 6.7L12 17.3 5.9 20.8l1.6-6.7-5.2-4.5L9.2 9 12 2.5Z" />
    </svg>
  );
}

export function TrashIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7h16" />
      <path d="M9 7V4.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V7" />
      <path d="M6 7l1 12.5A2 2 0 0 0 9 21h6a2 2 0 0 0 2-1.5L18 7" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

export function DocumentIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5A1.5 1.5 0 0 1 7 3.5Z" />
      <path d="M14 3.5V8h4.5" />
      <path d="M9 12.5h6M9 16h4.5" />
    </svg>
  );
}


export function ShareIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="18" cy="5.5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="18.5" r="2.5" />
      <path d="M8.2 10.7 15.8 6.8M8.2 13.3l7.6 3.9" />
    </svg>
  );
}

export function UsersIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M3.5 20c0-3.6 2.5-6.5 5.5-6.5s5.5 2.9 5.5 6.5" />
      <path d="M15.5 5.2c1.4.4 2.4 1.7 2.4 3.3 0 1.5-1 2.8-2.3 3.2" />
      <path d="M17 13.7c2.3.6 4 2.9 4 5.8" />
    </svg>
  );
}

export function GraduationCapIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M2.5 9.5 12 5l9.5 4.5-9.5 4.5-9.5-4.5Z" />
      <path d="M6.5 11.5v4.75c0 1.1 2.46 2.25 5.5 2.25s5.5-1.15 5.5-2.25V11.5" />
      <path d="M21 9.5v6" />
    </svg>
  );
}

export function PlusIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function CopyIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="8.5" y="8.5" width="12" height="12" rx="1.5" />
      <path d="M15.5 8.5V5.5a1.5 1.5 0 0 0-1.5-1.5H5.5A1.5 1.5 0 0 0 4 5.5v8.5a1.5 1.5 0 0 0 1.5 1.5h3" />
    </svg>
  );
}