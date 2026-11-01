from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from ..database import get_db
from ..models import Post, Reply, User, ReplyReaction, Notification
from ..schemas import ReplyCreate, ReplyResponse
from ..auth import get_current_user, get_optional_user

router = APIRouter(tags=["Replies"])

def serialize_reply(reply: Reply, current_user_id: Optional[str], db: Session) -> ReplyResponse:
    is_liked = False
    if current_user_id:
        is_liked = db.query(ReplyReaction).filter(
            ReplyReaction.reply_id == reply.id,
            ReplyReaction.user_id == current_user_id,
            ReplyReaction.reaction_type == "like"
        ).first() is not None
        
    children = [serialize_reply(c, current_user_id, db) for c in reply.children] if reply.children else []
    
    created_at = reply.created_at
    if created_at and created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)

    return ReplyResponse(
        id=reply.id,
        post_id=reply.post_id,
        parent_id=reply.parent_id,
        content=reply.content,
        likes_count=reply.likes_count,
        is_liked=is_liked,
        created_at=created_at,
        author=reply.author,
        children=children
    )

@router.get("/posts/{post_id}/replies", response_model=List[ReplyResponse])
def get_post_replies(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    post = db.query(Post).filter(Post.id == post_id, Post.is_deleted == False).first()
    if not post:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    # Get top-level replies (parent_id is None)
    top_replies = db.query(Reply).filter(
        Reply.post_id == post_id,
        Reply.parent_id == None
    ).order_by(desc(Reply.likes_count), desc(Reply.created_at)).all()
    
    current_user_id = current_user.id if current_user else None
    return [serialize_reply(r, current_user_id, db) for r in top_replies]

@router.post("/posts/{post_id}/replies", response_model=ReplyResponse, status_code=status.HTTP_201_CREATED)
def create_reply(
    post_id: str,
    payload: ReplyCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please log in to reply"
        )

    post = db.query(Post).filter(Post.id == post_id, Post.is_deleted == False).first()
    if not post:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    reply = Reply(
        post_id=post_id,
        author_id=current_user.id,
        parent_id=payload.parent_id,
        content=payload.content.strip(),
        created_at=datetime.now(timezone.utc).replace(tzinfo=None)
    )
    
    post.comments_count += 1
    db.add(reply)
    
    # Notify post author if different
    if post.author_id != current_user.id:
        notif = Notification(
            user_id=post.author_id,
            actor_id=current_user.id,
            type="reply",
            post_id=post.id,
            reply_id=reply.id
        )
        db.add(notif)
        
    db.commit()
    db.refresh(reply)
    
    return serialize_reply(reply, current_user.id, db)

@router.post("/replies/like/{reply_id}")
def toggle_like_reply(
    reply_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reply = db.query(Reply).filter(Reply.id == reply_id).first()
    if not reply:
        raise HTTPException(status_code=404, detail="Reply not found")
        
    rxn = db.query(ReplyReaction).filter(
        ReplyReaction.reply_id == reply_id,
        ReplyReaction.user_id == current_user.id
    ).first()
    
    if rxn:
        db.delete(rxn)
        reply.likes_count = max(0, reply.likes_count - 1)
        db.commit()
        return {"liked": False, "likes_count": reply.likes_count}
    else:
        new_rxn = ReplyReaction(reply_id=reply_id, user_id=current_user.id, reaction_type="like")
        db.add(new_rxn)
        reply.likes_count += 1
        db.commit()
        return {"liked": True, "likes_count": reply.likes_count}

@router.delete("/replies/{reply_id}")
def delete_reply(
    reply_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reply = db.query(Reply).filter(Reply.id == reply_id).first()
    if not reply:
        raise HTTPException(status_code=404, detail="Reply not found")
        
    if reply.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this reply")
        
    post = db.query(Post).filter(Post.id == reply.post_id).first()
    if post and post.comments_count > 0:
        post.comments_count -= 1
        
    db.delete(reply)
    db.commit()
    return {"success": True, "message": "Reply deleted"}
