# ClipMind AI — Frontend

Implementation notes for the Next.js frontend: how it's structured, the
design system, auth, and the role-aware dashboard. For the backend see
[`BACKEND.md`](./BACKEND.md); for the overall system picture see
[`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Stack

- **Next.js (App Router)** — file-based routing, mixing static marketing
  pages with a fully client-rendered dashboard.
- **React**, mostly `.tsx` for newer/typed code and `.jsx` for earlier
  components — both coexist in `src/`.
- **Tailwind CSS v4**, CSS-first config (no `tailwind.config.js` — theme
  tokens are declared directly in `src/app/globals.css` via `@theme`).
- **Firebase Authentication** (client SDK) for email/password and Google
  sign-in — see [Authentication](#authentication) below.
- **Framer Motion** for transitions (auth card mode-switch, etc).
- **Recharts** / hand-rolled SVG bars for the analytics charts.
- **lucide-react** + **react-icons** for iconography (the Google "G" on the
  sign-in button comes from `react-icons/fc`, since lucide has no brand
  icons).
- **react-dropzone** for the video upload widget.

## Directory layout

```
src/
  app/
    (site)/            marketing site route group — landing, login, signup
    auth/               legacy login/register routes (kept for compatibility)
    dashboard/           the whole authenticated app, one folder per feature:
      admin/              Administrator-only Admin Panel (analytics merged in, no sidebar)
      analytics/          analytics dashboard (Creator/Educator; Admin sees this inline instead)
      bookmarks/           Learner's saved bookmarks
      classrooms/          Educator: manage; Learner: joined classrooms
        [id]/               classroom detail — students, videos, analytics
      history/             Learner activity history
      search/               cross-video transcript/keyword search
      settings/             profile, password, activity
      video/[id]/           video detail — transcript, summary, key moments
        study/                Study Mode (flashcards / fill-in-blank / MCQ)
      videos/               video library
    share/[token]/       public read-only shared-link view (no auth)
  components/
    auth/                AuthCard (the sign-in/register/forgot-password card), ProtectedLayout
    dashboard/           Sidebar (role-aware menu)
    layout/               Navbar, Footer (marketing site chrome)
    theme/                 ThemeToggle (light/dark)
    ui/                   Button, Card, TextField — the Material 3 primitives everything else composes
    video/                 TranscriptViewer, SummaryViewer, KeyMomentsViewer, KeywordTags, VideoPlayer
  context/
    AuthContext.jsx       token/user state, backed by localStorage
  lib/
    firebase.ts           Firebase app/auth initialization
    authFetch.ts           fetch wrapper that attaches the bearer token
  services/                axios-based API clients (authService, userService, upload, ...)
  config.ts                 API_BASE_URL (reads NEXT_PUBLIC_API_URL)
```

## Design system: Material 3 Expressive

The whole UI runs on a hand-generated Material 3 tonal palette, seeded from
a single brand purple, rather than ad-hoc Tailwind colors:

- **Tokens** live in `src/app/globals.css` as CSS custom properties —
  `--md-primary`, `--md-surface-container`, `--md-on-surface-variant`, etc —
  defined once for light (`:root`) and once for dark
  (`:root[data-theme="dark"]` / `prefers-color-scheme`). A `@theme inline`
  block maps every role to a Tailwind utility, so `bg-md-primary`,
  `text-md-on-surface`, `border-md-outline-variant` all exist and stay
  reactive to the current theme.
- **Type scale** follows the M3 spec exactly (Display/Headline/Title/Body/
  Label × Large/Medium/Small), exposed as `text-display-large`,
  `text-title-medium`, etc.
- **Shape scale**: `radius-none` through `radius-full` (0 → pill), M3E leans
  toward the larger end — cards use `lg`/`xl`, buttons are pill-shaped
  (`rounded-full`).
- **Theme toggle**: `ThemeToggle` flips `document.documentElement.dataset.theme`
  and persists to `localStorage`; a pre-hydration inline script in the root
  layout sets it immediately on load to avoid a flash of the wrong theme.
- **Primitives**: `Button` (Filled/Tonal/Outlined/Text variants), `Card`
  (Filled/Elevated/Outlined), `TextField` — every dashboard and marketing
  page is built from these three instead of raw styled `<input>`/`<button>`.

## Authentication

`AuthCard` (`src/components/auth/AuthCard.jsx`) is the single sign-in /
create-account / forgot-password surface, used on both the marketing site's
`/login` and `/signup` pages.

- **Email/password** — Firebase's `signInWithEmailAndPassword` /
  `createUserWithEmailAndPassword` are called directly from the browser.
  Firebase never talks to our backend for this — it owns the credential
  entirely.
- **Google sign-in** — `signInWithPopup` with `GoogleAuthProvider`. A
  brand-new Google account has no role yet, so the card holds the verified
  ID token in state and shows a small role-picker step before finishing.
- **Forgot password** — `sendPasswordResetEmail`, entirely client-side.
  There's no backend endpoint for this; it doesn't need one.
- **Exchanging for a backend session** — after any Firebase sign-in/sign-up,
  the frontend calls `firebaseLogin(idToken, role?)` (`src/services/authService.js`),
  which posts to `POST /auth/firebase-login`. The backend verifies the token,
  finds-or-creates the local `User` row (role lives in Postgres, not
  Firebase), and returns our own JWT — stored via `AuthContext.login()` and
  attached to every subsequent API call by `authFetch`/`api.js`.
- **Route protection**: `ProtectedLayout` wraps the dashboard, redirecting to
  `/login` if there's no token; `dashboard/layout.tsx` additionally checks
  the current pathname to decide whether to render `Sidebar` at all (the
  Admin Panel page renders full-width, no sidebar).

## Role-aware dashboard

`Sidebar` (`src/components/dashboard/Sidebar.jsx`) renders a different menu
per `user.role`:

- **Learner**: Library, All Videos, Search, Classrooms, Bookmarks, History, Settings
- **Educator**: Dashboard, My Videos, Search, Classrooms, Analytics, Settings
- **Administrator**: Admin Panel only — no other tabs, and the sidebar itself
  is hidden on `/dashboard/admin` (see `dashboard/layout.tsx`); Sign Out and
  the theme toggle move into the Admin Panel page's own header instead.

This is a UX convenience only — every route is still independently guarded
server-side by the backend's `require_role()`, so hiding a link is not the
security boundary.

## Key interactive components

- **`VideoPlayer`** — HTML5 video with clickable key-moment markers rendered
  directly on the scrubber.
- **`TranscriptViewer`** — timestamped or full-text view, inline segment
  editing, search-within-transcript, TXT/SRT export.
- **`SummaryViewer`** — Quick/Detailed tabs, regenerate, export, and a
  summary-specific bookmark button (distinct from bookmarking the whole
  video).
- **`KeyMomentsViewer`** — per-moment cards, each independently bookmarkable,
  click to seek.
- **Study Mode page** (`dashboard/video/[id]/study`) — flashcards / fill-in-
  blank / MCQ, read-only for Learners, with a full edit UI (per-item edit,
  delete, save, regenerate) for Educators/Creators/Admins.

## Testing

Jest + React Testing Library (`frontend/__tests__/` and colocated
`*.test.tsx`), run via `npm test`. Covers `SummaryViewer`, `KeywordTags`,
and the `VideoPlayer` key-moment markers. `npx tsc --noEmit` is the
type-check gate; there's no separate build-time linting gate beyond that in
CI today.
