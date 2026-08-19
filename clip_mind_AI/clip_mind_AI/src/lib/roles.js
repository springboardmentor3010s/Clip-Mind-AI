/**
 * Role definitions and the navigation each role sees.
 *
 * This is the single source of truth for role-based UI on the client. The
 * backend enforces the same rules independently — this module only decides
 * what to *render*, never what is *permitted*.
 */

export const ROLES = {
  CONTENT_CREATOR: "content_creator",
  LEARNER: "learner",
  EDUCATOR: "educator",
  ADMIN: "admin",
};

export const ROLE_LABELS = {
  content_creator: "Content Creator",
  learner: "Learner",
  educator: "Educator",
  admin: "Administrator",
};

/** Roles allowed to upload videos — learners are read-only consumers. */
export const UPLOADER_ROLES = [ROLES.CONTENT_CREATOR, ROLES.EDUCATOR, ROLES.ADMIN];

export const canUpload = (role) => UPLOADER_ROLES.includes(role);
export const canEditTranscript = (role) =>
  [ROLES.CONTENT_CREATOR, ROLES.EDUCATOR, ROLES.ADMIN].includes(role);

/**
 * Sidebar navigation per role.
 * `roles: null` means "visible to everyone".
 */
const NAV = [
  { to: "/dashboard", icon: "🏠", label: "Dashboard", roles: null },

  // Authoring
  { to: "/upload", icon: "📤", label: "Upload Video", roles: UPLOADER_ROLES },
  { to: "/processing", icon: "⏳", label: "Processing", roles: UPLOADER_ROLES },

  // Consumption
  { to: "/library", icon: "🎬", label: "Browse Videos", roles: [ROLES.LEARNER] },
  { to: "/transcript", icon: "📄", label: "Transcript", roles: null },
  { to: "/summary", icon: "🤖", label: "AI Summary", roles: null },
  { to: "/key-moments", icon: "⭐", label: "Key Moments", roles: null },

  // Learning materials: educators author them, everyone else reads the ones
  // attached to videos shared with them.
  { to: "/learning-materials", icon: "📚", label: "Learning Materials", roles: null },
  {
    to: "/classroom",
    icon: "👨‍🏫",
    label: "Classroom Analytics",
    roles: [ROLES.EDUCATOR, ROLES.ADMIN],
  },

  // Everyone — the spec grants "search within transcripts", bookmarks and
  // learning history to every role, Learners included.
  { to: "/search", icon: "🔍", label: "Search", roles: null },
  { to: "/bookmarks", icon: "🔖", label: "Bookmarks", roles: null },
  { to: "/history", icon: "🕘", label: "History", roles: null },

  // Analytics is NOT a Learner capability. The spec grants analytics to
  // Content Creators ("view content analytics"), Educators ("classroom content
  // analytics") and Administrators ("system analytics") only.
  {
    to: "/analytics",
    icon: "📊",
    label: "Analytics",
    roles: [ROLES.CONTENT_CREATOR, ROLES.EDUCATOR, ROLES.ADMIN],
  },

  // Admin
  { to: "/admin", icon: "🛡️", label: "Admin Dashboard", roles: [ROLES.ADMIN] },
];

/** Navigation items visible to `role`. */
export function navItemsForRole(role) {
  if (!role) return [];
  return NAV.filter((item) => item.roles === null || item.roles.includes(role));
}

/** Role-appropriate dashboard greeting. */
export function dashboardSubtitle(role) {
  switch (role) {
    case ROLES.LEARNER:
      return "Here's content ready for you to explore and learn from";
    case ROLES.EDUCATOR:
      return "Here's how your lectures and students are doing today";
    case ROLES.ADMIN:
      return "Manage users, content, and monitor platform activity";
    default:
      return "Here's what's happening with your videos today";
  }
}
