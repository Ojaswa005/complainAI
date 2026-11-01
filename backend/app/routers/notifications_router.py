from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from datetime import timezone
from ..database import get_db
from ..models import Notification, User, Post
from ..schemas import NotificationResponse, UserResponse
from ..auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationResponse])
def get_user_notifications(
    limit: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notifs = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(desc(Notification.created_at)).limit(limit).all()

    res = []
    for n in notifs:
        actor = db.query(User).filter(User.id == n.actor_id).first()
        if not actor:
            continue

        snippet = None
        if n.post_id:
            p = db.query(Post).filter(Post.id == n.post_id).first()
            if p:
                snippet = p.content[:80] + ("..." if len(p.content) > 80 else "")

        created_at = n.created_at
        if created_at and created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)

        res.append(NotificationResponse(
            id=n.id,
            type=n.type,
            post_id=n.post_id,
            reply_id=n.reply_id,
            is_read=n.is_read,
            created_at=created_at,
            actor=UserResponse.from_orm(actor),
            post_snippet=snippet
        ))
    return res

@router.get("/unread-count")
def get_unread_notifications_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    return {"unread_count": count}

@router.post("/mark-read")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"success": True}
