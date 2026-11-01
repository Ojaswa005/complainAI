from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# --- User Schemas ---
class UserBase(BaseModel):
    username: str
    display_name: str
    avatar_url: Optional[str] = None
    banner_url: Optional[str] = None
    bio: Optional[str] = None

class UserCreate(UserBase):
    email: str
    password: Optional[str] = None

class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    banner_url: Optional[str] = None
    website: Optional[str] = None

class UserResponse(UserBase):
    id: str
    email: Optional[str] = None
    website: Optional[str] = None
    role: str = "user"
    is_verified: bool = False
    complaints_count: int = 0
    followers_count: int = 0
    following_count: int = 0
    is_following: Optional[bool] = False
    created_at: datetime

    class Config:
        from_attributes = True

class UserProfileResponse(UserResponse):
    is_self: bool = False

# --- Community Schemas ---
class CommunityResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = "users"
    color: Optional[str] = "orange"
    members_count: int = 0
    is_joined: bool = False

    class Config:
        from_attributes = True

# --- Topic Schemas ---
class TopicResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    posts_count: int = 0

    class Config:
        from_attributes = True

# --- Post Schemas ---
class PostCreate(BaseModel):
    content: str = Field(..., min_length=5, max_length=1000)
    mood: Optional[str] = None
    tool_tag: Optional[str] = None
    image_url: Optional[str] = None
    images: Optional[List[str]] = []
    topics: Optional[List[str]] = [] # list of topic slugs or names

class PostResponse(BaseModel):
    id: str
    content: str
    mood: Optional[str] = None
    tool_tag: Optional[str] = None
    image_url: Optional[str] = None
    images: List[str] = []
    likes_count: int = 0
    comments_count: int = 0
    reposts_count: int = 0
    bookmarks_count: int = 0
    views_count: int = 0
    is_pinned: bool = False
    created_at: datetime
    
    author: UserResponse
    topics: List[TopicResponse] = []
    
    # User-specific interaction status
    is_liked: bool = False
    is_bookmarked: bool = False
    is_reposted: bool = False

    class Config:
        from_attributes = True

class PostListResponse(BaseModel):
    posts: List[PostResponse]
    total: int
    has_more: bool

# --- Reply Schemas ---
class ReplyCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=500)
    parent_id: Optional[str] = None

class ReplyResponse(BaseModel):
    id: str
    post_id: str
    parent_id: Optional[str] = None
    content: str
    likes_count: int = 0
    is_liked: bool = False
    created_at: datetime
    author: UserResponse
    children: List["ReplyResponse"] = []

    class Config:
        from_attributes = True

class UserReplyItemResponse(BaseModel):
    id: str
    post_id: str
    content: str
    likes_count: int = 0
    created_at: datetime
    author: UserResponse
    post: Optional[PostResponse] = None

    class Config:
        from_attributes = True

# --- Notification Schemas ---
class NotificationResponse(BaseModel):
    id: str
    type: str
    post_id: Optional[str] = None
    reply_id: Optional[str] = None
    is_read: bool = False
    created_at: datetime
    actor: UserResponse
    post_snippet: Optional[str] = None

    class Config:
        from_attributes = True

# --- Interaction Schemas ---
class ReportCreate(BaseModel):
    post_id: str
    reason: str
    details: Optional[str] = None

class ReportResponse(BaseModel):
    id: str
    post_id: str
    reason: str
    details: Optional[str] = None
    status: str
    created_at: datetime
    post_snippet: Optional[str] = None

    class Config:
        from_attributes = True

class InteractionResponse(BaseModel):
    success: bool
    action: str
    is_active: bool
    count: int

# --- AI Schemas ---
class AIRewriteRequest(BaseModel):
    content: str = Field(..., min_length=5, max_length=600)
    mode: str = Field("sarcastic", description="funny, sarcastic, rant, professional, short, long")

class AIRewriteResponse(BaseModel):
    original: str
    suggestion: str
    mode: str
    explanation: Optional[str] = None
    is_fallback: bool = False

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class LoginRequest(BaseModel):
    username_or_email: str
    password: Optional[str] = None
