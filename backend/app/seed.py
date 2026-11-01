from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from .models import User, Post, Topic, Reply, Reaction, Bookmark, Follow, Community, CommunityMember

def seed_communities_if_empty(db: Session):
    existing = db.query(Community).count()
    if existing > 0:
        return

    communities_data = [
        {
            "name": "Fullstack Dev Survivors",
            "slug": "fullstack-dev-survivors",
            "description": "Venting about copilot, melted imports, and endless code rewrites",
            "icon": "code",
            "color": "orange",
            "members_count": 14200
        },
        {
            "name": "AI Art Refugees",
            "slug": "ai-art-refugees",
            "description": "Six-fingered hands, melted corporate logos, prompt fatigue",
            "icon": "palette",
            "color": "cyan",
            "members_count": 8900
        },
        {
            "name": "Hallucination Hunters",
            "slug": "hallucination-hunters",
            "description": "Cataloging fabricated research papers, imaginary court cases & citations",
            "icon": "eye",
            "color": "pink",
            "members_count": 12100
        },
        {
            "name": "Job Anxiety Club",
            "slug": "job-anxiety-club",
            "description": "Navigating entry-level hiring in the era of LLMs and automated rejections",
            "icon": "briefcase",
            "color": "peach",
            "members_count": 24500
        },
        {
            "name": "Prompt Fatigue Society",
            "slug": "prompt-fatigue",
            "description": "Spending 45 minutes crafting a prompt for a 2-minute task",
            "icon": "coffee",
            "color": "green",
            "members_count": 6300
        },
        {
            "name": "Copilot Skeptics",
            "slug": "copilot-skeptics",
            "description": "When autocompleting the next line creates 12 subtle vulnerabilities",
            "icon": "terminal",
            "color": "slate",
            "members_count": 10400
        }
    ]

    for c in communities_data:
        comm = Community(
            name=c["name"],
            slug=c["slug"],
            description=c["description"],
            icon=c["icon"],
            color=c["color"],
            members_count=c["members_count"]
        )
        db.add(comm)
    db.commit()

def seed_demo_follows_if_needed(db: Session):
    users = db.query(User).all()
    if len(users) < 2:
        return

    users_by_name = {u.username: u for u in users}
    pairs = [
        ("dev_survivor", "ai_skeptic"),
        ("dev_survivor", "creative_mind"),
        ("dev_survivor", "jobpanic"),
        ("ai_skeptic", "dev_survivor"),
        ("ai_skeptic", "creative_mind"),
        ("ai_skeptic", "code_nomad"),
        ("creative_mind", "dev_survivor"),
        ("creative_mind", "jobpanic"),
        ("jobpanic", "dev_survivor"),
        ("jobpanic", "ai_skeptic"),
        ("code_nomad", "dev_survivor"),
        ("code_nomad", "debugging_life"),
        ("debugging_life", "dev_survivor"),
        ("debugging_life", "code_nomad"),
    ]

    for f_name, t_name in pairs:
        f_user = users_by_name.get(f_name)
        t_user = users_by_name.get(t_name)
        if f_user and t_user and f_user.id != t_user.id:
            exists = db.query(Follow).filter(
                Follow.follower_id == f_user.id,
                Follow.following_id == t_user.id
            ).first()
            if not exists:
                db.add(Follow(follower_id=f_user.id, following_id=t_user.id))
    db.commit()

    # Sync live counts
    for u in users:
        u.followers_count = db.query(Follow).filter(Follow.following_id == u.id).count()
        u.following_count = db.query(Follow).filter(Follow.follower_id == u.id).count()
        u.complaints_count = db.query(Post).filter(Post.author_id == u.id, Post.is_deleted == False).count()
    db.commit()

def seed_database_if_empty(db: Session):
    existing_users = db.query(User).count()
    if existing_users > 0:
        seed_communities_if_empty(db)
        seed_demo_follows_if_needed(db)
        return  # Database already seeded with users

    print("🌱 Seeding Complain AI database with demo data...")

    # 1. Topics
    topics_data = [
        {"name": "AICoding", "slug": "ai-coding", "color": "orange", "icon": "code", "posts_count": 12400},
        {"name": "JobAnxiety", "slug": "job-anxiety", "color": "peach", "icon": "briefcase", "posts_count": 8700},
        {"name": "WrongInfo", "slug": "wrong-info", "color": "red", "icon": "alert-triangle", "posts_count": 6100},
        {"name": "LazyOutputs", "slug": "lazy-outputs", "color": "green", "icon": "coffee", "posts_count": 5900},
        {"name": "AIDesign", "slug": "ai-design", "color": "cyan", "icon": "palette", "posts_count": 5200},
        {"name": "PrivacyConcerns", "slug": "privacy-concerns", "color": "purple", "icon": "shield", "posts_count": 4800},
        {"name": "Education", "slug": "education", "color": "indigo", "icon": "graduation-cap", "posts_count": 4100},
        {"name": "Hallucinations", "slug": "hallucinations", "color": "pink", "icon": "eye", "posts_count": 3900},
        {"name": "AITakeover", "slug": "ai-takeover", "color": "blue", "icon": "cpu", "posts_count": 3600},
        {"name": "AIFail", "slug": "ai-fail", "color": "red", "icon": "x-circle", "posts_count": 7200},
        {"name": "DeveloperLife", "slug": "developer-life", "color": "slate", "icon": "terminal", "posts_count": 9400},
        {"name": "WhySoConfident", "slug": "why-so-confident", "color": "amber", "icon": "help-circle", "posts_count": 4300},
    ]

    topics_map = {}
    for t in topics_data:
        topic_obj = Topic(
            name=t["name"],
            slug=t["slug"],
            color=t["color"],
            icon=t["icon"],
            posts_count=t["posts_count"]
        )
        db.add(topic_obj)
        db.flush()
        topics_map[t["name"]] = topic_obj

    # 2. Users
    users_data = [
        {
            "username": "dev_survivor",
            "display_name": "dev_survivor",
            "email": "dev@complain.ai",
            "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            "bio": "Fullstack engineer debugging AI-generated hallucinations since 2023. Coffee > Token count.",
            "complaints_count": 42,
            "followers_count": 3840,
            "following_count": 180,
            "is_verified": True
        },
        {
            "username": "creative_mind",
            "display_name": "creative_mind",
            "email": "design@complain.ai",
            "avatar_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
            "bio": "Brand & Product Designer. AI stole my color palettes and gave my characters 6 fingers.",
            "complaints_count": 28,
            "followers_count": 2100,
            "following_count": 240,
            "is_verified": True
        },
        {
            "username": "jobpanic",
            "display_name": "jobpanic",
            "email": "panic@complain.ai",
            "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
            "bio": "CS Graduate. Applying to 500 jobs while competing against an algorithm that wrote my rejection letters.",
            "complaints_count": 35,
            "followers_count": 5200,
            "following_count": 310,
            "is_verified": False
        },
        {
            "username": "ai_skeptic",
            "display_name": "ai_skeptic",
            "email": "skeptic@complain.ai",
            "avatar_url": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
            "bio": "Complaining about AI so we can build a better AI. ✨ Developer | Meme Enjoyer | Reality Checker",
            "complaints_count": 128,
            "followers_count": 4200,
            "following_count": 320,
            "is_verified": True
        },
        {
            "username": "code_nomad",
            "display_name": "code_nomad",
            "email": "nomad@complain.ai",
            "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
            "bio": "Senior Systems Architect. Missing the days when code errors were caused by real humans.",
            "complaints_count": 64,
            "followers_count": 1950,
            "following_count": 140,
            "is_verified": False
        },
        {
            "username": "debugging_life",
            "display_name": "debugging_life",
            "email": "debug@complain.ai",
            "avatar_url": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
            "bio": "QA Lead. AI promises 0 bugs. AI delivers infinity bugs with reassuring smileys.",
            "complaints_count": 19,
            "followers_count": 890,
            "following_count": 95,
            "is_verified": False
        }
    ]

    users_map = {}
    for u in users_data:
        user_obj = User(
            username=u["username"],
            display_name=u["display_name"],
            email=u["email"],
            avatar_url=u["avatar_url"],
            bio=u["bio"],
            complaints_count=u["complaints_count"],
            followers_count=u["followers_count"],
            following_count=u["following_count"],
            is_verified=u["is_verified"]
        )
        db.add(user_obj)
        db.flush()
        users_map[u["username"]] = user_obj

    # 3. Follow relationships
    dev_user = users_map["dev_survivor"]
    skeptic_user = users_map["ai_skeptic"]
    creative_user = users_map["creative_mind"]
    
    db.add(Follow(follower_id=skeptic_user.id, following_id=dev_user.id))
    db.add(Follow(follower_id=skeptic_user.id, following_id=creative_user.id))
    db.add(Follow(follower_id=dev_user.id, following_id=skeptic_user.id))
    db.flush()

    # 4. Posts (Mockup complaints)
    now = datetime.utcnow()
    
    post1 = Post(
        author_id=users_map["dev_survivor"].id,
        content="I asked AI to fix one bug. It rewrote my entire project and introduced five more bugs. 🤦‍♂️",
        mood="Frustrated",
        tool_tag="ChatGPT",
        likes_count=1200,
        comments_count=210,
        reposts_count=87,
        bookmarks_count=420,
        views_count=18500,
        is_pinned=True,
        created_at=now - timedelta(hours=2),
        topics=[topics_map["AICoding"], topics_map["AIFail"], topics_map["DeveloperLife"]]
    )
    db.add(post1)
    db.flush()

    post2 = Post(
        author_id=users_map["creative_mind"].id,
        content="AI said it could design a logo for my brand. Now my brand looks like a toothpaste company from 2010. 😭",
        mood="Funny",
        tool_tag="Midjourney",
        likes_count=856,
        comments_count=124,
        reposts_count=45,
        bookmarks_count=190,
        views_count=12300,
        created_at=now - timedelta(hours=5),
        topics=[topics_map["AIDesign"], topics_map["WhySoConfident"]]
    )
    db.add(post2)
    db.flush()

    post3 = Post(
        author_id=users_map["jobpanic"].id,
        content="Not AI writing better cover letters than me... what's the point of my degree now? 💀",
        mood="Sarcastic",
        tool_tag="Claude",
        likes_count=2400,
        comments_count=309,
        reposts_count=110,
        bookmarks_count=580,
        views_count=34200,
        created_at=now - timedelta(hours=8),
        topics=[topics_map["AITakeover"], topics_map["JobAnxiety"]]
    )
    db.add(post3)
    db.flush()

    post4 = Post(
        author_id=users_map["ai_skeptic"].id,
        content="AI summarized my 10-page report... and missed the entire point. It somehow invented two statistics that never existed and cited a paper by authors who don't exist.",
        mood="Mindblown",
        tool_tag="Gemini",
        likes_count=642,
        comments_count=96,
        reposts_count=34,
        bookmarks_count=145,
        views_count=9800,
        created_at=now - timedelta(days=1),
        topics=[topics_map["WrongInfo"], topics_map["Education"], topics_map["Hallucinations"]]
    )
    db.add(post4)
    db.flush()

    post5 = Post(
        author_id=users_map["code_nomad"].id,
        content="Copilot suggested an auth validation check that always returns true because 'simplicity ensures higher throughput.' I am not making this up.",
        mood="Sarcastic",
        tool_tag="Copilot",
        likes_count=1540,
        comments_count=182,
        reposts_count=92,
        bookmarks_count=310,
        views_count=21400,
        created_at=now - timedelta(days=1, hours=3),
        topics=[topics_map["AICoding"], topics_map["PrivacyConcerns"]]
    )
    db.add(post5)
    db.flush()

    # 5. Replies for Post 1 (matching mockup screen!)
    reply1 = Reply(
        post_id=post1.id,
        author_id=users_map["code_nomad"].id,
        content="Classic AI move. Fixes the leaf, burns the forest. 🔥🪵",
        likes_count=248,
        created_at=now - timedelta(hours=1, minutes=45)
    )
    db.add(reply1)

    reply2 = Reply(
        post_id=post1.id,
        author_id=users_map["jobpanic"].id,
        content="It's not a bug, it's a feature... now you have more bugs to learn! 💀",
        likes_count=132,
        created_at=now - timedelta(hours=1, minutes=20)
    )
    db.add(reply2)

    reply3 = Reply(
        post_id=post1.id,
        author_id=users_map["debugging_life"].id,
        content="At this point, I just ask AI to explain what it changed before I run it.",
        likes_count=89,
        created_at=now - timedelta(minutes=50)
    )
    db.add(reply3)

    # 6. Sample reactions and bookmarks
    db.add(Reaction(user_id=skeptic_user.id, post_id=post1.id, reaction_type="like"))
    db.add(Reaction(user_id=skeptic_user.id, post_id=post2.id, reaction_type="like"))
    db.add(Bookmark(user_id=skeptic_user.id, post_id=post1.id))
    db.add(Bookmark(user_id=skeptic_user.id, post_id=post3.id))

    db.commit()
    print("✅ Seed data successfully populated!")

if __name__ == "__main__":
    from .database import SessionLocal
    db = SessionLocal()
    try:
        seed_database_if_empty(db)
    finally:
        db.close()
