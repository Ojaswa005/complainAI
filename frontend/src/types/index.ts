export interface User {
  id: string;
  username: string;
  display_name: string;
  email?: string;
  avatar_url?: string;
  banner_url?: string;
  bio?: string;
  website?: string;
  role: string;
  is_verified: boolean;
  complaints_count: number;
  followers_count: number;
  following_count: number;
  is_following?: boolean;
  is_self?: boolean;
  created_at: string;
}

export interface Topic {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  posts_count: number;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  members_count: number;
  is_joined?: boolean;
}

export interface Complaint {
  id: string;
  content: string;
  mood?: string;
  tool_tag?: string;
  image_url?: string;
  images?: string[];
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  bookmarks_count: number;
  views_count: number;
  is_pinned: boolean;
  created_at: string;
  author: User;
  topics: Topic[];
  is_liked: boolean;
  is_bookmarked: boolean;
  is_reposted: boolean;
}

export interface Reply {
  id: string;
  post_id: string;
  parent_id?: string;
  content: string;
  likes_count: number;
  is_liked: boolean;
  created_at: string;
  author: User;
  children?: Reply[];
}

export interface UserReplyItem {
  id: string;
  post_id: string;
  content: string;
  likes_count: number;
  created_at: string;
  author: User;
  post?: Complaint;
}

export interface NotificationItem {
  id: string;
  type: string;
  post_id?: string;
  reply_id?: string;
  is_read: boolean;
  created_at: string;
  actor: User;
  post_snippet?: string;
}

export interface ReportItem {
  id: string;
  post_id: string;
  reason: string;
  details?: string;
  status: string;
  created_at: string;
  post_snippet?: string;
}

export interface AIRewriteResponse {
  original: string;
  suggestion: string;
  mode: string;
  explanation?: string;
  is_fallback: boolean;
}

export interface PopularTool {
  tool: string;
  count: number;
  icon: string;
  color: string;
}
