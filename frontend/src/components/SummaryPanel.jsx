export default function SummaryPanel({
    summary,
    onBookmark = () => {},
    isBookmarked = false,
    showBookmark = true
}) {

    return (
        <div className="summary-panel">
            <div className="summary-header">
                <h2>AI Summary</h2>

                {showBookmark && (
                    <button
                        className={isBookmarked ? "summary-bookmark bookmarked" : "summary-bookmark"}
                        onClick={() => onBookmark()}
                        aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
                    >
                        {isBookmarked ? "✅" : "🔖"}
                    </button>
                )}
            </div>

            <p>{summary}</p>
        </div>
    );
}