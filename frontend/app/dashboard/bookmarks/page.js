import { BookmarkIcon } from "../../../components/ui/icons";

export default function BookmarksPage() {
  return (
    <div>
      <h1 className="mb-1 font-display text-xl font-semibold tracking-tight text-ink dark:text-paper">Bookmarks</h1>
      <p className="mb-8 text-sm text-ink/50 dark:text-paper/50">Summaries and highlights you've saved for later</p>

      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-cloud p-14 text-center dark:border-line-dark dark:bg-graphite">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-signal/10 text-signal dark:bg-signal-dark/15 dark:text-signal-dark">
          <BookmarkIcon width={22} height={22} />
        </span>
        <p className="mt-3 text-sm font-medium text-ink dark:text-paper">No bookmarks yet</p>
        <p className="mt-1 max-w-sm text-sm text-ink/45 dark:text-paper/45">
          Bookmark summaries and key moments from any video to find them here.
        </p>
      </div>
    </div>
  );
}
