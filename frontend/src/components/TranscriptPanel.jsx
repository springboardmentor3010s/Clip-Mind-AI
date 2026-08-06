import { useMemo, useState } from "react";

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function TranscriptPanel({

segments=[],

currentTime=0,

onSeek=()=>{}

}) {

    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {

        if (!search) return segments;

        return segments.filter(segment =>
            segment.text.toLowerCase().includes(search.toLowerCase())
        );

    }, [search, segments]);

    return (

        <div>

            <input
                className="transcript-search"
                placeholder="Search transcript..."
                value={search}
                onChange={(e)=>setSearch(e.target.value)}
            />

            <div className="transcript-panel">

                {filtered.map(segment=>(

                    <div
                        key={`${segment.start}-${segment.end}`}
                        className={
                            currentTime>=segment.start &&
                            currentTime<segment.end
                            ? "transcript-line active"
                            : "transcript-line"
                        }
                        onClick={()=>onSeek(segment.start)}
                    >

                        <span className="timestamp">
                            {formatTime(segment.start)}
                        </span>

                        <span className="transcript-text">
                            {segment.text}
                        </span>

                    </div>

                ))}

            </div>

        </div>

    );

}