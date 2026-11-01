from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from typing import List, Optional
from ..database import get_db
from ..models import User, Follow, Notification, Post, Reply, Reaction, Bookmark
from ..schemas import (
    UserResponse,
    UserProfileResponse,
    UserUpdate,
    PostResponse,
    UserReplyItemResponse
)
from ..auth import get_current_user, get_optional_user
from .posts_router import serialize_post

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/suggested", response_model=List[UserResponse])
def get_suggested_users(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    query = db.query(User)
    if current_user:
        # Exclude self and users already followed
        following_ids = [
            f.following_id for f in db.query(Follow.following_id).filter(Follow.follower_id == current_user.id).all()
        ]
        query = query.filter(User.id != current_user.id, ~User.id.in_(following_ids))
        
    users = query.order_by(desc(User.followers_count)).limit(limit).all()
    
    res = []
    for u in users:
        item = UserResponse.from_orm(u)
        item.is_following = False
        res.append(item)
    return res

@router.get("/search", response_model=List[UserResponse])
def search_users(
    q: str = Query(..., min_length=1),
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    term = f"%{q}%"
    users = db.query(User).filter(
        or_(User.username.ilike(term), User.display_name.ilike(term))
    ).limit(limit).all()
    
    following_ids = set()
    if current_user:
        following_ids = set(
            f.following_id for f in db.query(Follow.following_id).filter(Follow.follower_id == current_user.id).all()
        )
        
    res = []
    for u in users:
        item = UserResponse.from_orm(u)
        item.is_following = u.id in following_ids
        res.append(item)
    return res

@router.get("/{username}", response_model=UserProfileResponse)
def get_user_profile(
    username: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    user = db.query(User).filter(User.username.ilike(username)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Calculate accurate live statistics
    user.complaints_count = db.query(Post).filter(Post.author_id == user.id, Post.is_deleted == False).count()
    user.followers_count = db.query(Follow).filter(Follow.following_id == user.id).count()
    user.following_count = db.query(Follow).filter(Follow.follower_id == user.id).count()

    is_following = False
    is_self = False
    
    if current_user:
        is_self = (current_user.id == user.id)
        if not is_self:
            is_following = db.query(Follow).filter(
                Follow.follower_id == current_user.id,
                Follow.following_id == user.id
            ).first() is not None
            
    res = UserProfileResponse.from_orm(user)
    res.is_following = is_following
    res.is_self = is_self
    return res

@router.get("/{username}/followers", response_model=List[UserResponse])
def get_user_followers(
    username: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    user = db.query(User).filter(User.username.ilike(username)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    follows = db.query(Follow).filter(Follow.following_id == user.id).all()
    follower_ids = [f.follower_id for f in follows]
    followers = db.query(User).filter(User.id.in_(follower_ids)).all() if follower_ids else []

    current_following_ids = set()
    if current_user:
        current_following_ids = set(
            f.following_id for f in db.query(Follow.following_id).filter(Follow.follower_id == current_user.id).all()
        )

    res = []
    for f in followers:
        item = UserResponse.from_orm(f)
        item.is_following = f.id in current_following_ids
        res.append(item)
    return res

@router.get("/{username}/following", response_model=List[UserResponse])
def get_user_following(
    username: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    user = db.query(User).filter(User.username.ilike(username)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    follows = db.query(Follow).filter(Follow.follower_id == user.id).all()
    following_ids = [f.following_id for f in follows]
    following_users = db.query(User).filter(User.id.in_(following_ids)).all() if following_ids else []

    current_following_ids = set()
    if current_user:
        current_following_ids = set(
            f.following_id for f in db.query(Follow.following_id).filter(Follow.follower_id == current_user.id).all()
        )

    res = []
    for f in following_users:
        item = UserResponse.from_orm(f)
        item.is_following = f.id in current_following_ids
        res.append(item)
    return res

@router.get("/{username}/replies", response_model=List[UserReplyItemResponse])
def get_user_replies(
    username: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    user = db.query(User).filter(User.username.ilike(username)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    replies = db.query(Reply).filter(Reply.author_id == user.id).order_by(desc(Reply.created_at)).all()
    
    current_user_id = current_user.id if current_user else None
    res = []
    for r in replies:
        serialized_post = None
        if r.post and not r.post.is_deleted:
            serialized_post = serialize_post(r.post, current_user_id, db)
        
        res.append(UserReplyItemResponse(
            id=r.id,
            post_id=r.post_id,
            content=r.content,
            likes_count=r.likes_count,
            created_at=r.created_at,
            author=UserResponse.from_orm(user),
            post=serialized_post
        ))
    return res

@router.get("/{username}/liked", response_model=List[PostResponse])
def get_user_liked_posts(
    username: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    user = db.query(User).filter(User.username.ilike(username)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    reactions = db.query(Reaction).filter(
        Reaction.user_id == user.id,
        Reaction.reaction_type == "like"
    ).order_by(desc(Reaction.created_at)).all()
    
    post_ids = [rxn.post_id for rxn in reactions]
    posts = db.query(Post).filter(Post.id.in_(post_ids), Post.is_deleted == False).all()
    post_map = {p.id: p for p in posts}
    
    current_user_id = current_user.id if current_user else None
    ordered_posts = [post_map[pid] for pid in post_ids if pid in post_map]
    return [serialize_post(p, current_user_id, db) for p in ordered_posts]

@router.get("/{username}/saved", response_model=List[PostResponse])
def get_user_saved_posts(
    username: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = db.query(User).filter(User.username.ilike(username)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Privacy check: only the account owner can view their saved posts
    if current_user.id != user.id and current_user.role != "admin":
        return []

    bookmarks = db.query(Bookmark).filter(Bookmark.user_id == user.id).order_by(desc(Bookmark.created_at)).all()
    post_ids = [b.post_id for b in bookmarks]
    posts = db.query(Post).filter(Post.id.in_(post_ids), Post.is_deleted == False).all()
    post_map = {p.id: p for p in posts}
    
    ordered_posts = [post_map[pid] for pid in post_ids if pid in post_map]
    return [serialize_post(p, current_user.id, db) for p in ordered_posts]

@router.post("/{username}/follow")
def toggle_follow(
    username: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_user = db.query(User).filter(User.username.ilike(username)).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
        
    follow = db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.following_id == target_user.id
    ).first()
    
    if follow:
        db.delete(follow)
        current_user.following_count = max(0, current_user.following_count - 1)
        target_user.followers_count = max(0, target_user.followers_count - 1)
        db.commit()
        return {"is_following": False, "followers_count": target_user.followers_count}
    else:
        new_follow = Follow(follower_id=current_user.id, following_id=target_user.id)
        db.add(new_follow)
        current_user.following_count += 1
        target_user.followers_count += 1
        
        notif = Notification(
            user_id=target_user.id,
            actor_id=current_user.id,
            type="follow"
        )
        db.add(notif)
        
        db.commit()
        return {"is_following": True, "followers_count": target_user.followers_count}

@router.patch("/me", response_model=UserResponse)
def update_profile(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if payload.display_name is not None:
        current_user.display_name = payload.display_name.strip()
    if payload.bio is not None:
        current_user.bio = payload.bio.strip()
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url.strip() or None
    if payload.banner_url is not None:
        current_user.banner_url = payload.banner_url.strip() or None
    if payload.website is not None:
        current_user.website = payload.website.strip() or None
        
    db.commit()
    db.refresh(current_user)
    return current_user
