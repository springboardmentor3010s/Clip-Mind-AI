def fmt(seconds: float) -> str:
    """Mirrors the frontend's fmt() in src/utils/mockEngine.ts exactly."""
    s = max(0, round(seconds or 0))
    h = s // 3600
    m = (s % 3600) // 60
    sec = s % 60
    if h > 0:
        return f"{h}:{m:02d}:{sec:02d}"
    return f"{m:02d}:{sec:02d}"


def title_from_file(name: str) -> str:
    import re

    base = re.sub(r"\.[a-zA-Z0-9]+$", "", name)
    base = re.sub(r"[-_]+", " ", base)
    base = re.sub(r"\s+", " ", base).strip()
    if not base:
        return "Untitled recording"
    return " ".join(w[:1].upper() + w[1:] if w else w for w in base.split(" "))
