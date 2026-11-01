# 🤖 Complain AI — The Social Network Where AI Gets Called Out

A modern, responsive, and rebellious social media MVP where people share complaints, experiences, opinions, and frustrations about artificial intelligence.

Designed to match the **Complain AI** visual identity:
- **Branding**: Primary orange (`#F97316`), soft off-white (`#F8FAFC`), crisp white cards with restrained shadows.
- **Robot Mascot**: 3D mascot holding "Roasted my code again..." with floating speech bubbles on the landing page hero.
- **Layout**: 3-column desktop layout (Left Navigation, Center Feed with Quick Composer, Right Sidebar with Trending Complaints & Popular AI Tools) and a compact mobile layout with bottom navigation.
- **The Only GenAI Feature**: **AI Rant Assistant** in the complaint composer with Funny, Sarcastic, Rant, Professional, Short, and Long modes.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, React Router v6, TanStack Query, Lucide React.
- **Backend**: Python 3.13, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2, Uvicorn.
- **Data & Auth**: PostgreSQL / SQLite (zero-config local default), Supabase Auth & JWT token verification + built-in 1-click demo user switcher (`@dev_survivor`, `@ai_skeptic`, `@creative_mind`, `@jobpanic`).
- **AI**: Gemini 1.5 Flash / OpenAI GPT-4o-mini provider abstraction + smart fallback linguistic rewrite engine.

---

## 🚀 Quick Start

### 1. Clone & Set Up Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run migrations (already generated in alembic/versions)
python -m alembic upgrade head

# Run seed script (automatically runs if DB is empty)
python -m app.seed

# Start FastAPI server (runs on http://127.0.0.1:8000)
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Set Up Frontend

```bash
cd frontend

# Install packages
npm install

# Start Vite dev server (runs on http://localhost:5173)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## ✨ Core Features & Pages

### 1. Landing Page (`/`)
- Hero section with large headline: *"Got a complaint about **AI?**"*
- 3D friendly robot mascot surrounded by floating animated speech bubbles:
  - *"Took my job? 🙀"*
  - *"Gave wrong answer 🤖"*
  - *"Still hallucinates? 😵"*
  - *"Why is it so confident?? 🤨"*
  - *"Rewrote my entire project 🤬"*
- Stats Bar: 25K+ Complaints shared, 10K+ Active members, 50+ AI tools discussed, 100+ Trending topics.
- Live community complaints preview cards and mission highlights.

### 2. Main Social Feed (`/home`)
- **Left Sidebar**: Home, Explore, Trending, Communities, AI Tools, Leaderboard, Saved, Profile, and user switcher.
- **Center Feed**:
  - Filter tabs: **For You**, **Trending**, **Latest**.
  - Quick complaint composer with mood selector, tool tag, image URL, and **Improve with AI** trigger.
  - Social complaint cards showing author, timestamp, tool badge, complaint text, topic hashtags, and actions (Like, Reply, Repost, Bookmark, Share).
- **Right Sidebar**:
  - **Trending Complaints** ranked 1 through 5 with post counts.
  - **Popular AI Tools** with complaint counts and quick filter triggers (ChatGPT, Claude, Gemini, Midjourney, Copilot, Cursor).
  - **Suggested Users** with interactive follow/unfollow toggle.

### 3. Explore & Topic Discovery (`/explore`)
- Search bar with live query filtering.
- Filter tabs: **Trending**, **Topics**, **AI Tools**, **Communities**.
- Topics Grid with vibrant cards: `#AICoding`, `#JobAnxiety`, `#WrongInfo`, `#LazyOutputs`, `#AIDesign`, `#PrivacyConcerns`, `#Education`, `#Hallucinations`, `#AITakeover`.

### 4. Complaint Details & Threaded Replies (`/complaint/:id`)
- Full complaint view with author details, tags, and reactions.
- Threaded replies with likes and sorting (Top Replies vs Latest).
- Reply composer supporting direct and nested replies.

### 5. User Profile (`/u/:username`)
- Banner gradient matching mockup, avatar, handle, verified badge.
- Follow / Unfollow state and Edit Profile modal.
- Metrics: Complaints count, Followers count, Following count.
- Tabs: **Posts**, **Replies**, **Liked**, **Saved**.

### 6. The AI Rant Assistant
Accessible via the **+ Complain** modal or the feed composer:
- Write any raw complaint:
  > *"I asked AI to fix one bug. It rewrote my entire project and introduced five more bugs."*
- Select a style mode:
  - **Sarcastic**:
    > *"I asked AI to fix ONE bug. It rewrote my entire project, introduced five new bugs, and somehow had the confidence to tell me the problem was solved. 💀"*
  - **Funny**: Comedic dialogue roast.
  - **Rant**: Exasperated developer venting with all-caps emphasis.
  - **Professional**: Corporate post-mortem style summary.
  - **Short**: Compact 1-liner.
  - **Long**: Detailed storytelling.
- Preview suggested rewrite side-by-side with original and click **"Use this"** or **"Retry"**.

---

## 🔒 Security & Data Architecture

- Entity models: Users, Posts, Replies, Topics, PostTopics, Reactions, Bookmarks, Reposts, Follows, Notifications, Reports.
- Authenticated user identity derived from verified JWT tokens on the server, never from untrusted request bodies.
- Seamless dual-auth support: Supabase JWT tokens for production and cryptographic local tokens for offline review.
