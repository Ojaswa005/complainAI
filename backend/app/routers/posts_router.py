import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, or_
from typing import Optional, List
from ..database import get_db
from ..models import Post, User, Topic, Reaction, Bookmark, Repost, Follow, Notification
from ..schemas import PostCreate, PostResponse, PostListResponse, UserResponse
from ..auth import get_current_user, get_optional_user
from ..services.image_service import validate_url_ssrf_safe

router = APIRouter(prefix="/posts", tags=["Posts"])

def serialize_post(
    post: Post, 
    current_user_id: Optional[str] = None, 
    db: Session = None,
    include_repost_of: bool = True,
    reposted_by: Optional[User] = None
) -> PostResponse:
    is_liked = False
    is_bookmarked = False
    is_reposted = False
    
    if current_user_id and db:
        is_liked = db.query(Reaction).filter(
            Reaction.post_id == post.id,
            Reaction.user_id == current_user_id,
            Reaction.reaction_type == "like"
        ).first() is not None
        
        is_bookmarked = db.query(Bookmark).filter(
            Bookmark.post_id == post.id,
            Bookmark.user_id == current_user_id
        ).first() is not None
        
        is_reposted = db.query(Repost).filter(
            Repost.post_id == post.id,
            Repost.user_id == current_user_id
        ).first() is not None

    images = []
    if post.images:
        try:
            images = json.loads(post.images)
        except Exception:
            images = [post.images]
    elif post.image_url:
        images = [post.image_url]

    # Ensure UTC timezone awareness for accurate frontend client parsing
    created_at = post.created_at
    if created_at and created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)

    serialized_repost_of = None
    if include_repost_of and getattr(post, 'repost_of_id', None) and post.repost_of and not post.repost_of.is_deleted:
        serialized_repost_of = serialize_post(post.repost_of, current_user_id, db, include_repost_of=False)

    serialized_reposted_by = None
    if reposted_by:
        serialized_reposted_by = UserResponse.from_orm(reposted_by)

    return PostResponse(
        id=post.id,
        content=post.content,
        mood=post.mood,
        tool_tag=post.tool_tag,
        image_url=post.image_url or (images[0] if images else None),
        images=images,
        likes_count=post.likes_count,
        comments_count=post.comments_count,
        reposts_count=post.reposts_count,
        bookmarks_count=post.bookmarks_count,
        views_count=post.views_count,
        is_pinned=post.is_pinned,
        created_at=created_at,
        author=post.author,
        topics=post.topics,
        is_liked=is_liked,
        is_bookmarked=is_bookmarked,
        is_reposted=is_reposted,
        repost_of_id=getattr(post, 'repost_of_id', None),
        repost_of=serialized_repost_of,
        reposted_by=serialized_reposted_by
    )

@router.get("", response_model=PostListResponse)
def get_posts(
    feed_type: str = Query("for-you", description="for-you, trending, latest, following"),
    topic: Optional[str] = Query(None, description="Topic slug or name filter"),
    tool_tag: Optional[str] = Query(None, description="AI tool filter"),
    author: Optional[str] = Query(None, description="Author username"),
    search: Optional[str] = Query(None, description="Search query"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    query = db.query(Post).filter(Post.is_deleted == False)
    
    # Filter by author (includes authored posts + simple reposts)
    if author:
        user = db.query(User).filter(User.username.ilike(author)).first()
        if not user:
            return PostListResponse(posts=[], total=0, has_more=False)
        
        authored_posts = db.query(Post).filter(
            Post.author_id == user.id,
            Post.is_deleted == False
        ).all()

        user_reposts = db.query(Repost).filter(Repost.user_id == user.id).all()
        repost_time_map = {r.post_id: r.created_at for r in user_reposts}
        reposted_ids = [r.post_id for r in user_reposts]

        reposted_posts = []
        if reposted_ids:
            reposted_posts = db.query(Post).filter(
                Post.id.in_(reposted_ids),
                Post.is_deleted == False
            ).all()

        timeline_items = []
        for p in authored_posts:
            timeline_items.append((p.created_at, p, None))
        for p in reposted_posts:
            if p.author_id == user.id:
                continue
            rep_time = repost_time_map.get(p.id, p.created_at)
            timeline_items.append((rep_time, p, user))

        timeline_items.sort(key=lambda x: x[0], reverse=True)
        total = len(timeline_items)
        page_items = timeline_items[skip:skip + limit]

        current_user_id = current_user.id if current_user else None
        serialized = [
            serialize_post(item[1], current_user_id, db, reposted_by=item[2])
            for item in page_items
        ]
        return PostListResponse(
            posts=serialized,
            total=total,
            has_more=(skip + limit) < total
        )
            
    # Filter by topic
    if topic:
        query = query.join(Post.topics).filter(
            or_(Topic.slug == topic.lower(), Topic.name.ilike(topic))
        )
        
    # Filter by tool tag
    if tool_tag:
        query = query.filter(Post.tool_tag.ilike(tool_tag))
        
    # Search query
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Post.content.ilike(search_term),
                Post.tool_tag.ilike(search_term),
                Post.mood.ilike(search_term)
            )
        )
        
    # Feed algorithm
    if feed_type == "following":
        if not current_user:
            return PostListResponse(posts=[], total=0, has_more=False)
        following_ids = [
            f.following_id for f in db.query(Follow.following_id).filter(Follow.follower_id == current_user.id).all()
        ]
        query = query.filter(Post.author_id.in_(following_ids)).order_by(desc(Post.created_at))
    elif feed_type == "trending":
        # Trending ranks by popularity (likes * 2 + comments * 3 + reposts * 2)
        score_calc = (Post.likes_count * 2 + Post.comments_count * 3 + Post.reposts_count * 2)
        query = query.order_by(desc(score_calc), desc(Post.created_at))
    elif feed_type == "latest":
        query = query.order_by(desc(Post.created_at))
    else:
        # Default 'for-you': pinned first, then high engagement & fresh
        query = query.order_by(desc(Post.is_pinned), desc(Post.created_at))
        
    total = query.count()
    raw_posts = query.offset(skip).limit(limit).all()
    
    current_user_id = current_user.id if current_user else None
    serialized = [serialize_post(p, current_user_id, db) for p in raw_posts]
    
    return PostListResponse(
        posts=serialized,
        total=total,
        has_more=(skip + limit) < total
    )

@router.get("/{post_id}", response_model=PostResponse)
def get_post(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    post = db.query(Post).filter(Post.id == post_id, Post.is_deleted == False).first()
    if not post:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    # Increment view count
    post.views_count += 1
    db.commit()
    
    current_user_id = current_user.id if current_user else None
    return serialize_post(post, current_user_id, db)

@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
def create_post(
    payload: PostCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please log in to create a post"
        )

    # Extract topics
    assigned_topics = []
    if payload.topics:
        for t_name in payload.topics:
            t_clean = t_name.strip().lstrip("#")
            if not t_clean:
                continue
            slug = t_clean.lower().replace(" ", "-")
            topic_obj = db.query(Topic).filter(or_(Topic.slug == slug, Topic.name.ilike(t_clean))).first()
            if not topic_obj:
                topic_obj = Topic(
                    name=t_clean,
                    slug=slug,
                    color="orange"
                )
                db.add(topic_obj)
                db.flush()
            topic_obj.posts_count += 1
            assigned_topics.append(topic_obj)

    # Process images list (max 4)
    images_list = []
    if payload.images:
        for img_u in payload.images[:4]:
            img_u = img_u.strip()
            if not img_u:
                continue
            if img_u.startswith("http://") or img_u.startswith("https://"):
                safe_u = validate_url_ssrf_safe(img_u)
                images_list.append(safe_u)
            elif img_u.startswith("/uploads/"):
                images_list.append(img_u)
    elif payload.image_url:
        img_u = payload.image_url.strip()
        if img_u.startswith("http://") or img_u.startswith("https://"):
            safe_u = validate_url_ssrf_safe(img_u)
            images_list.append(safe_u)
        elif img_u.startswith("/uploads/"):
            images_list.append(img_u)

    # Check if this is a quote repost
    quoted_post = None
    if payload.repost_of_id:
        quoted_post = db.query(Post).filter(Post.id == payload.repost_of_id, Post.is_deleted == False).first()
        if not quoted_post:
            raise HTTPException(status_code=404, detail="Quoted complaint not found")

    primary_image = images_list[0] if images_list else None

    post = Post(
        author_id=current_user.id,
        content=payload.content.strip(),
        mood=payload.mood,
        tool_tag=payload.tool_tag,
        image_url=primary_image,
        images=json.dumps(images_list) if images_list else None,
        repost_of_id=payload.repost_of_id if quoted_post else None,
        created_at=datetime.now(timezone.utc).replace(tzinfo=None),
        topics=assigned_topics
    )
    
    current_user.complaints_count += 1
    if quoted_post:
        quoted_post.reposts_count += 1
        existing_rp = db.query(Repost).filter(Repost.post_id == quoted_post.id, Repost.user_id == current_user.id).first()
        if not existing_rp:
            new_rp = Repost(user_id=current_user.id, post_id=quoted_post.id)
            db.add(new_rp)

        if quoted_post.author_id != current_user.id:
            notif = Notification(
                user_id=quoted_post.author_id,
                actor_id=current_user.id,
                type="repost",
                post_id=quoted_post.id
            )
            db.add(notif)

    db.add(post)
    db.commit()
    db.refresh(post)
    
    return serialize_post(post, current_user.id, db)

@router.delete("/{post_id}")
def delete_post(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    if post.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this complaint")
        
    post.is_deleted = True
    if current_user.complaints_count > 0:
        current_user.complaints_count -= 1
    db.commit()
    
    return {"success": True, "message": "Complaint deleted"}
