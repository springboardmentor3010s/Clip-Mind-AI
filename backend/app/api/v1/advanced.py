"""
Advanced feature routes: AI chat, similarity, sentiment timeline,
multi-video search, and PDF export.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from io import BytesIO

from app.db.mongodb import transcripts_collection, summaries_collection, key_moments_collection
from app.models.user import User
from app.api.deps import get_current_user
from app.services.advanced import answer_question, compute_similarity, sentiment_timeline, search_across_transcripts
from app.services.keywords import extract_keywords
from app.services.pdf_report import generate_video_report

router = APIRouter()


# ---------------- AI Chat with Video ----------------

class ChatRequest(BaseModel):
    video_id: str
    question: str


@router.post("/chat")
async def chat_with_video(payload: ChatRequest, current_user: User = Depends(get_current_user)):
    doc = await transcripts_collection.find_one({"video_id": payload.video_id, "user_id": str(current_user.user_id)})
    if not doc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No transcript found for this video.")

    from app.services.qagen import get_qg_pipeline
    qa_pipeline = get_qg_pipeline()

    answer = answer_question(payload.question, doc["text"], qa_pipeline)
    return {"question": payload.question, "answer": answer}


# ---------------- Video Similarity ----------------

@router.get("/similar/{video_id}")
async def get_similar_videos(video_id: str, current_user: User = Depends(get_current_user)):
    target_doc = await transcripts_collection.find_one({"video_id": video_id, "user_id": str(current_user.user_id)})
    if not target_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No transcript found for this video.")

    target_keywords = extract_keywords(target_doc["text"], top_n=10)

    results = []
    cursor = transcripts_collection.find({"user_id": str(current_user.user_id)})
    async for doc in cursor:
        if doc["video_id"] == video_id:
            continue
        other_keywords = extract_keywords(doc["text"], top_n=10)
        score = compute_similarity(target_keywords, other_keywords)
        if score > 0:
            results.append({"video_id": doc["video_id"], "video_title": doc.get("video_title", "Video"), "similarity": score})

    results.sort(key=lambda r: r["similarity"], reverse=True)
    return {"similar_videos": results[:5]}


# ---------------- Sentiment Timeline ----------------

@router.get("/sentiment/{video_id}")
async def get_sentiment_timeline(video_id: str, current_user: User = Depends(get_current_user)):
    doc = await transcripts_collection.find_one({"video_id": video_id, "user_id": str(current_user.user_id)})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No transcript found for this video.")

    timeline = sentiment_timeline(doc["segments"])
    return {"timeline": timeline}


# ---------------- Multi-Video Search ----------------

@router.get("/search")
async def search_all_videos(q: str, current_user: User = Depends(get_current_user)):
    if not q or len(q.strip()) < 2:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Search query too short.")

    all_docs = []
    cursor = transcripts_collection.find({"user_id": str(current_user.user_id)})
    async for doc in cursor:
        all_docs.append(doc)

    results = search_across_transcripts(q, all_docs)
    return {"results": results}


# ---------------- PDF Export ----------------

@router.get("/report/{video_id}")
async def download_pdf_report(video_id: str, current_user: User = Depends(get_current_user)):
    transcript_doc = await transcripts_collection.find_one({"video_id": video_id, "user_id": str(current_user.user_id)})
    summary_doc = await summaries_collection.find_one({"video_id": video_id, "user_id": str(current_user.user_id)})
    moments_doc = await key_moments_collection.find_one({"video_id": video_id, "user_id": str(current_user.user_id)})

    if not transcript_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No transcript found for this video.")

    title = transcript_doc.get("video_title", "Video")
    pdf_bytes = generate_video_report(
        title=title,
        summary=summary_doc,
        moments=moments_doc.get("moments") if moments_doc else None,
        transcript_snippet=transcript_doc.get("text", ""),
    )

    filename = f"{title.rsplit('.', 1)[0]}_report.pdf"
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )