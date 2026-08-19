from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.models.transcript import Transcript
from app.schemas.search import SearchResponse, SearchResultItem, SearchResultMatch
from app.models.user import User

router = APIRouter(prefix="/search", tags=["search"])

@router.get("", response_model=SearchResponse)
def search_transcripts(
    q: str = Query(..., min_length=2, description="Search query"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Globally searches across all available video transcripts for a given text query.
    Returns the specific segments and timestamps where the query was spoken.
    """
    # Use ILIKE for case-insensitive search across the concatenated text column
    search_pattern = f"%{q}%"
    
    # In a fully scoped app we might check if user has access to these videos,
    # but for this MVP we'll just search everything.
    transcripts = db.query(Transcript).filter(Transcript.text.ilike(search_pattern)).all()
    
    results = []
    total_matches = 0
    
    lower_q = q.lower()
    
    for t in transcripts:
        if not t.segments:
            continue
            
        video_matches = []
        
        # We know the text contains the query, but we need to find which specific segments do
        for segment in t.segments:
            text = segment.get("text", "")
            if lower_q in text.lower():
                video_matches.append(
                    SearchResultMatch(
                        segment_id=str(segment.get("id", "")),
                        start_time=segment.get("start_time", 0.0),
                        end_time=segment.get("end_time", 0.0),
                        text=text
                    )
                )
        
        if video_matches:
            results.append(
                SearchResultItem(
                    video_id=t.video_id,
                    matches=video_matches
                )
            )
            total_matches += len(video_matches)
            
    return SearchResponse(
        query=q,
        total_results=total_matches,
        results=results
    )
