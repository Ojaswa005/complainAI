from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from datetime import timezone
from ..database import get_db
from ..models import Post, User, Reaction, Bookmark, Repost, Report, Notification
from ..schemas import InteractionResponse, ReportCreate, ReportResponse, PostResponse
from ..auth import get_current_user, get_optional_user
from .posts_router import serialize_post

router = APIRouter(prefix="/interactions", tags=["Interactions"])

@router.post("/like/{post_id}", response_model=InteractionResponse)
def toggle_like(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(Post).filter(Post.id == post_id, Post.is_deleted == False).first()
    if not post:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    reaction = db.query(Reaction).filter(
        Reaction.post_id == post_id,
        Reaction.user_id == current_user.id,
        Reaction.reaction_type == "like"
    ).first()
    
    if reaction:
        db.delete(reaction)
        post.likes_count = max(0, post.likes_count - 1)
        db.commit()
        return InteractionResponse(success=True, action="unlike", is_active=False, count=post.likes_count)
    else:
        new_reaction = Reaction(
            user_id=current_user.id,
            post_id=post_id,
            reaction_type="like"
        )
        db.add(new_reaction)
        post.likes_count += 1
        
        # Create notification if liking someone else's post
        if post.author_id != current_user.id:
            notif = Notification(
                user_id=post.author_id,
                actor_id=current_user.id,
                type="like",
                post_id=post.id
            )
            db.add(notif)
            
        db.commit()
        return InteractionResponse(success=True, action="like", is_active=True, count=post.likes_count)

@router.post("/bookmark/{post_id}", response_model=InteractionResponse)
def toggle_bookmark(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(Post).filter(Post.id == post_id, Post.is_deleted == False).first()
    if not post:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    bm = db.query(Bookmark).filter(
        Bookmark.post_id == post_id,
        Bookmark.user_id == current_user.id
    ).first()
    
    if bm:
        db.delete(bm)
        post.bookmarks_count = max(0, post.bookmarks_count - 1)
        db.commit()
        return InteractionResponse(success=True, action="unbookmark", is_active=False, count=post.bookmarks_count)
    else:
        new_bm = Bookmark(user_id=current_user.id, post_id=post_id)
        db.add(new_bm)
        post.bookmarks_count += 1
        db.commit()
        return InteractionResponse(success=True, action="bookmark", is_active=True, count=post.bookmarks_count)

@router.post("/repost/{post_id}", response_model=InteractionResponse)
def toggle_repost(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(Post).filter(Post.id == post_id, Post.is_deleted == False).first()
    if not post:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    rp = db.query(Repost).filter(
        Repost.post_id == post_id,
        Repost.user_id == current_user.id
    ).first()
    
    if rp:
        db.delete(rp)
        post.reposts_count = max(0, post.reposts_count - 1)
        db.commit()
        return InteractionResponse(success=True, action="unrepost", is_active=False, count=post.reposts_count)
    else:
        new_rp = Repost(user_id=current_user.id, post_id=post_id)
        db.add(new_rp)
        post.reposts_count += 1
        
        if post.author_id != current_user.id:
            notif = Notification(
                user_id=post.author_id,
                actor_id=current_user.id,
                type="repost",
                post_id=post.id
            )
            db.add(notif)
            
        db.commit()
        return InteractionResponse(success=True, action="repost", is_active=True, count=post.reposts_count)

@router.get("/bookmarks", response_model=List[PostResponse])
def get_user_bookmarks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bookmarks = db.query(Bookmark).filter(Bookmark.user_id == current_user.id).order_by(desc(Bookmark.created_at)).all()
    post_ids = [b.post_id for b in bookmarks]
    posts = db.query(Post).filter(Post.id.in_(post_ids), Post.is_deleted == False).all()
    
    # Keep bookmarks order
    post_map = {p.id: p for p in posts}
    ordered_posts = [post_map[pid] for pid in post_ids if pid in post_map]
    
    return [serialize_post(p, current_user.id, db) for p in ordered_posts]

@router.get("/reports/me", response_model=List[ReportResponse])
def get_my_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reports = db.query(Report).filter(Report.reporter_id == current_user.id).order_by(desc(Report.created_at)).all()
    res = []
    for r in reports:
        snippet = None
        if r.post:
            snippet = r.post.content[:100] + ("..." if len(r.post.content) > 100 else "")
            
        created_at = r.created_at
        if created_at and created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
            
        res.append(ReportResponse(
            id=r.id,
            post_id=r.post_id,
            reason=r.reason,
            details=r.details,
            status=r.status,
            created_at=created_at,
            post_snippet=snippet
        ))
    return res

@router.post("/report", response_model=ReportResponse)
def report_post(
    payload: ReportCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please log in to report a complaint"
        )

    post = db.query(Post).filter(Post.id == payload.post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    report = Report(
        reporter_id=current_user.id,
        post_id=payload.post_id,
        reason=payload.reason,
        details=payload.details,
        status="pending"
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    created_at = report.created_at
    if created_at and created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)

    return ReportResponse(
        id=report.id,
        post_id=report.post_id,
        reason=report.reason,
        details=report.details,
        status=report.status,
        created_at=created_at,
        post_snippet=post.content[:100] + ("..." if len(post.content) > 100 else "")
    )
