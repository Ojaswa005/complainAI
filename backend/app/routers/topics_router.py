from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Dict, Any
from ..database import get_db
from ..models import Topic, Post
from ..schemas import TopicResponse

router = APIRouter(prefix="/topics", tags=["Topics"])

@router.get("", response_model=List[TopicResponse])
def get_topics(db: Session = Depends(get_db)):
    topics = db.query(Topic).order_by(desc(Topic.posts_count)).all()
    return topics

@router.get("/trending", response_model=List[TopicResponse])
def get_trending_topics(limit: int = 5, db: Session = Depends(get_db)):
    topics = db.query(Topic).order_by(desc(Topic.posts_count)).limit(limit).all()
    return topics

@router.get("/popular-tools")
def get_popular_tools(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """Returns AI tools with count of complaints"""
    results = db.query(
        Post.tool_tag,
        func.count(Post.id).label("complaints_count")
    ).filter(
        Post.tool_tag != None,
        Post.is_deleted == False
    ).group_by(Post.tool_tag).order_by(desc("complaints_count")).limit(6).all()
    
    # Defaults if none in DB yet
    defaults = [
        {"tool": "ChatGPT", "count": 12400, "icon": "bot", "color": "emerald"},
        {"tool": "Claude", "count": 4800, "icon": "sparkles", "color": "orange"},
        {"tool": "Gemini", "count": 4100, "icon": "star", "color": "blue"},
        {"tool": "Midjourney", "count": 3900, "icon": "palette", "color": "purple"},
        {"tool": "Copilot", "count": 3200, "icon": "code", "color": "indigo"},
        {"tool": "Cursor", "count": 2100, "icon": "terminal", "color": "cyan"}
    ]
    
    if not results:
        return defaults
        
    mapped = []
    for tag, cnt in results:
        matched = next((d for d in defaults if d["tool"].lower() == tag.lower()), None)
        mapped.append({
            "tool": tag,
            "count": cnt,
            "icon": matched["icon"] if matched else "cpu",
            "color": matched["color"] if matched else "orange"
        })
    return mapped
