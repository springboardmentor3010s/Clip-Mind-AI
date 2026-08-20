export default function KeyMomentsPanel({
    moments = [],
    onSeek = () => {},
    onBookmark = () => {},
    bookmarkedKeys = {},
    showBookmark = true
}) {

    if (moments.length === 0) {
        return <p>No key moments.</p>;
    }

    return (
        <div>
            {moments.map((moment, index) => {

                const [minutes, seconds] = moment.time.split(":").map(Number);
                const totalSeconds = minutes * 60 + seconds;
                const key = `key_moment-${totalSeconds}`;
                const isBookmarked = Boolean(bookmarkedKeys[key]);

                return (
                    <div
                        key={index}
                        className="moment-card"
                        style={{ cursor: "pointer" }}
                        onClick={() => onSeek(totalSeconds)}
                    >
                        <h3>{moment.time}</h3>
                        <p>{moment.title}</p>

                        {showBookmark && (
                            <button
                                className={
                                    isBookmarked
                                        ? "moment-bookmark bookmarked"
                                        : "moment-bookmark"
                                }
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onBookmark(moment);
                                }}
                                aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
                            >
                                {isBookmarked ? "✅" : "🔖"}
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}