import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Text, Integer, Boolean, DateTime, ForeignKey, Table, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from .database import Base

def generate_uuid():
    return str(uuid.uuid4())

# Association table for Post-Topic many-to-many relationship
post_topics = Table(
    "post_topics",
    Base.metadata,
    Column("post_id", String(36), ForeignKey("posts.id", ondelete="CASCADE"), primary_key=True),
    Column("topic_id", String(36), ForeignKey("topics.id", ondelete="CASCADE"), primary_key=True),
)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    supabase_uid = Column(String(128), unique=True, nullable=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    display_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True) # for built-in dev auth
    avatar_url = Column(Text, nullable=True)
    banner_url = Column(Text, nullable=True)
    bio = Column(Text, nullable=True, default="")
    website = Column(String(255), nullable=True)
    role = Column(String(20), default="user") # 'user', 'moderator', 'admin'
    is_verified = Column(Boolean, default=False)
    
    # Counts
    complaints_count = Column(Integer, default=0)
    followers_count = Column(Integer, default=0)
    following_count = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    posts = relationship("Post", back_populates="author", cascade="all, delete-orphan")
    replies = relationship("Reply", back_populates="author", cascade="all, delete-orphan")
    reactions = relationship("Reaction", back_populates="user", cascade="all, delete-orphan")
    bookmarks = relationship("Bookmark", back_populates="user", cascade="all, delete-orphan")
    reposts = relationship("Repost", back_populates="user", cascade="all, delete-orphan")
    reports_submitted = relationship("Report", back_populates="reporter", cascade="all, delete-orphan")
    community_memberships = relationship("CommunityMember", back_populates="user", cascade="all, delete-orphan")

class Topic(Base):
    __tablename__ = "topics"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(50), unique=True, nullable=False)
    slug = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    icon = Column(String(50), nullable=True)
    color = Column(String(50), nullable=True) # e.g., 'orange', 'peach', 'purple', 'green'
    posts_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    posts = relationship("Post", secondary=post_topics, back_populates="topics")

class Community(Base):
    __tablename__ = "communities"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), unique=True, nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    icon = Column(String(50), default="users")
    color = Column(String(50), default="orange")
    members_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    members = relationship("CommunityMember", back_populates="community", cascade="all, delete-orphan")

class CommunityMember(Base):
    __tablename__ = "community_members"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    community_id = Column(String(36), ForeignKey("communities.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("community_id", "user_id", name="uq_community_user"),
    )

    community = relationship("Community", back_populates="members")
    user = relationship("User", back_populates="community_memberships")

class Post(Base):
    __tablename__ = "posts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    author_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    mood = Column(String(50), nullable=True) # e.g., 'Sarcastic', 'Frustrated', 'Mindblown', 'Funny'
    tool_tag = Column(String(50), nullable=True, index=True) # e.g. 'ChatGPT', 'Claude', 'Copilot', 'Midjourney', 'Gemini'
    image_url = Column(Text, nullable=True)
    images = Column(Text, nullable=True) # JSON list of image URLs
    
    # Engagement counts
    likes_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    reposts_count = Column(Integer, default=0)
    bookmarks_count = Column(Integer, default=0)
    views_count = Column(Integer, default=0)
    
    is_pinned = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    author = relationship("User", back_populates="posts")
    topics = relationship("Topic", secondary=post_topics, back_populates="posts")
    replies = relationship("Reply", back_populates="post", cascade="all, delete-orphan")
    reactions = relationship("Reaction", back_populates="post", cascade="all, delete-orphan")
    bookmarks = relationship("Bookmark", back_populates="post", cascade="all, delete-orphan")
    reposts = relationship("Repost", back_populates="post", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="post", cascade="all, delete-orphan")

class Reply(Base):
    __tablename__ = "replies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    post_id = Column(String(36), ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_id = Column(String(36), ForeignKey("replies.id", ondelete="CASCADE"), nullable=True)
    content = Column(Text, nullable=False)
    likes_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    post = relationship("Post", back_populates="replies")
    author = relationship("User", back_populates="replies")
    reactions = relationship("ReplyReaction", back_populates="reply", cascade="all, delete-orphan")
    parent = relationship("Reply", remote_side=[id], backref="children")

class Reaction(Base):
    __tablename__ = "reactions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    post_id = Column(String(36), ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    reaction_type = Column(String(20), default="like")
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "post_id", "reaction_type", name="uq_user_post_reaction"),
    )

    user = relationship("User", back_populates="reactions")
    post = relationship("Post", back_populates="reactions")

class ReplyReaction(Base):
    __tablename__ = "reply_reactions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reply_id = Column(String(36), ForeignKey("replies.id", ondelete="CASCADE"), nullable=False)
    reaction_type = Column(String(20), default="like")
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "reply_id", "reaction_type", name="uq_user_reply_reaction"),
    )

    reply = relationship("Reply", back_populates="reactions")

class Follow(Base):
    __tablename__ = "follows"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    follower_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    following_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("follower_id", "following_id", name="uq_follower_following"),
    )

class Bookmark(Base):
    __tablename__ = "bookmarks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    post_id = Column(String(36), ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "post_id", name="uq_user_post_bookmark"),
    )

    user = relationship("User", back_populates="bookmarks")
    post = relationship("Post", back_populates="bookmarks")

class Repost(Base):
    __tablename__ = "reposts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    post_id = Column(String(36), ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "post_id", name="uq_user_post_repost"),
    )

    user = relationship("User", back_populates="reposts")
    post = relationship("Post", back_populates="reposts")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(30), nullable=False) # 'like', 'reply', 'repost', 'follow'
    post_id = Column(String(36), ForeignKey("posts.id", ondelete="CASCADE"), nullable=True)
    reply_id = Column(String(36), ForeignKey("replies.id", ondelete="CASCADE"), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    actor = relationship("User", foreign_keys=[actor_id])
    post = relationship("Post", foreign_keys=[post_id])

class Report(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    reporter_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    post_id = Column(String(36), ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    reason = Column(String(100), nullable=False) # 'spam', 'hate_speech', 'harassment', 'misinformation', 'other'
    details = Column(Text, nullable=True)
    status = Column(String(20), default="pending") # 'pending', 'reviewed', 'resolved'
    created_at = Column(DateTime, default=datetime.utcnow)

    reporter = relationship("User", back_populates="reports_submitted")
    post = relationship("Post", back_populates="reports")
