from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from ..database import get_db
from ..models import Community, CommunityMember, User
from ..schemas import CommunityResponse
from ..auth import get_current_user, get_optional_user

router = APIRouter(prefix="/communities", tags=["Communities"])

@router.get("", response_model=List[CommunityResponse])
def get_communities(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    communities = db.query(Community).order_by(desc(Community.members_count)).all()
    
    joined_ids = set()
    if current_user:
        joined_ids = set(
            cm.community_id for cm in db.query(CommunityMember.community_id).filter(
                CommunityMember.user_id == current_user.id
            ).all()
        )

    res = []
    for c in communities:
        item = CommunityResponse(
            id=c.id,
            name=c.name,
            slug=c.slug,
            description=c.description,
            icon=c.icon or "users",
            color=c.color or "orange",
            members_count=c.members_count,
            is_joined=(c.id in joined_ids)
        )
        res.append(item)
    return res

@router.post("/{slug}/join")
def toggle_join_community(
    slug: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    community = db.query(Community).filter(Community.slug == slug.lower()).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    membership = db.query(CommunityMember).filter(
        CommunityMember.community_id == community.id,
        CommunityMember.user_id == current_user.id
    ).first()

    if membership:
        db.delete(membership)
        community.members_count = max(0, community.members_count - 1)
        db.commit()
        return {"is_joined": False, "members_count": community.members_count}
    else:
        new_membership = CommunityMember(
            community_id=community.id,
            user_id=current_user.id
        )
        db.add(new_membership)
        community.members_count += 1
        db.commit()
        return {"is_joined": True, "members_count": community.members_count}
