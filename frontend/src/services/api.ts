import { 
  Complaint, 
  Reply, 
  User, 
  Topic, 
  PopularTool, 
  AIRewriteResponse,
  Community,
  NotificationItem,
  ReportItem,
  UserReplyItem
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

export function getAuthToken(): string | null {
  return localStorage.getItem('complain_ai_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('complain_ai_token', token);
  } else {
    localStorage.removeItem('complain_ai_token');
  }
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errorDetail = 'An error occurred';
    try {
      const errData = await response.json();
      errorDetail = errData.detail || errData.message || errorDetail;
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // --- Auth ---
  login: async (usernameOrEmail: string, password?: string) => {
    return fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username_or_email: usernameOrEmail, password }),
    });
  },

  register: async (data: { username: string; display_name: string; email: string; avatar_url?: string }) => {
    return fetchWithAuth('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getMe: async (): Promise<User> => {
    return fetchWithAuth('/auth/me');
  },

  getDemoUsers: async (): Promise<User[]> => {
    return fetchWithAuth('/auth/demo-users');
  },

  switchDemoUser: async (username: string) => {
    return fetchWithAuth(`/auth/demo-switch/${username}`, { method: 'POST' });
  },

  // --- Posts ---
  getPosts: async (params: {
    feed_type?: string;
    topic?: string;
    tool_tag?: string;
    author?: string;
    search?: string;
    skip?: number;
    limit?: number;
  } = {}): Promise<{ posts: Complaint[]; total: number; has_more: boolean }> => {
    const query = new URLSearchParams();
    if (params.feed_type) query.set('feed_type', params.feed_type);
    if (params.topic) query.set('topic', params.topic);
    if (params.tool_tag) query.set('tool_tag', params.tool_tag);
    if (params.author) query.set('author', params.author);
    if (params.search) query.set('search', params.search);
    if (params.skip !== undefined) query.set('skip', params.skip.toString());
    if (params.limit !== undefined) query.set('limit', params.limit.toString());

    return fetchWithAuth(`/posts?${query.toString()}`);
  },

  getPost: async (id: string): Promise<Complaint> => {
    return fetchWithAuth(`/posts/${id}`);
  },

  createPost: async (data: {
    content: string;
    mood?: string;
    tool_tag?: string;
    image_url?: string;
    images?: string[];
    topics?: string[];
    repost_of_id?: string;
  }): Promise<Complaint> => {
    return fetchWithAuth('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deletePost: async (id: string) => {
    return fetchWithAuth(`/posts/${id}`, { method: 'DELETE' });
  },

  // --- Uploads & Images ---
  uploadImage: async (file: File, purpose: 'post' | 'avatar' | 'banner' = 'post'): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('purpose', purpose);
    return fetchWithAuth('/uploads/image', {
      method: 'POST',
      body: formData,
    });
  },

  uploadImages: async (files: File[]): Promise<{ urls: string[] }> => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    return fetchWithAuth('/uploads/images', {
      method: 'POST',
      body: formData,
    });
  },

  validateImageUrl: async (url: string): Promise<{ valid: boolean; url: string }> => {
    return fetchWithAuth('/uploads/validate-url', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  },

  // --- Interactions ---
  toggleLike: async (postId: string): Promise<{ success: boolean; action: string; is_active: boolean; count: number }> => {
    return fetchWithAuth(`/interactions/like/${postId}`, { method: 'POST' });
  },

  toggleBookmark: async (postId: string): Promise<{ success: boolean; action: string; is_active: boolean; count: number }> => {
    return fetchWithAuth(`/interactions/bookmark/${postId}`, { method: 'POST' });
  },

  toggleRepost: async (postId: string): Promise<{ success: boolean; action: string; is_active: boolean; count: number }> => {
    return fetchWithAuth(`/interactions/repost/${postId}`, { method: 'POST' });
  },

  getBookmarks: async (): Promise<Complaint[]> => {
    return fetchWithAuth('/interactions/bookmarks');
  },

  reportPost: async (postId: string, reason: string, details?: string): Promise<ReportItem> => {
    return fetchWithAuth('/interactions/report', {
      method: 'POST',
      body: JSON.stringify({ post_id: postId, reason, details }),
    });
  },

  getMyReports: async (): Promise<ReportItem[]> => {
    return fetchWithAuth('/interactions/reports/me');
  },

  // --- Notifications ---
  getNotifications: async (limit: number = 30): Promise<NotificationItem[]> => {
    return fetchWithAuth(`/notifications?limit=${limit}`);
  },

  getUnreadNotificationsCount: async (): Promise<{ unread_count: number }> => {
    return fetchWithAuth('/notifications/unread-count');
  },

  markNotificationsRead: async (): Promise<{ success: boolean }> => {
    return fetchWithAuth('/notifications/mark-read', { method: 'POST' });
  },

  // --- Replies ---
  getReplies: async (postId: string): Promise<Reply[]> => {
    return fetchWithAuth(`/posts/${postId}/replies`);
  },

  createReply: async (postId: string, content: string, parentId?: string): Promise<Reply> => {
    return fetchWithAuth(`/posts/${postId}/replies`, {
      method: 'POST',
      body: JSON.stringify({ content, parent_id: parentId }),
    });
  },

  toggleLikeReply: async (replyId: string): Promise<{ liked: boolean; likes_count: number }> => {
    return fetchWithAuth(`/replies/like/${replyId}`, { method: 'POST' });
  },

  deleteReply: async (replyId: string) => {
    return fetchWithAuth(`/replies/${replyId}`, { method: 'DELETE' });
  },

  // --- Users ---
  getUserProfile: async (username: string): Promise<User> => {
    return fetchWithAuth(`/users/${username}`);
  },

  getFollowers: async (username: string): Promise<User[]> => {
    return fetchWithAuth(`/users/${username}/followers`);
  },

  getFollowing: async (username: string): Promise<User[]> => {
    return fetchWithAuth(`/users/${username}/following`);
  },

  getUserReplies: async (username: string): Promise<UserReplyItem[]> => {
    return fetchWithAuth(`/users/${username}/replies`);
  },

  getUserLikedPosts: async (username: string): Promise<Complaint[]> => {
    return fetchWithAuth(`/users/${username}/liked`);
  },

  getUserReposts: async (username: string): Promise<Complaint[]> => {
    return fetchWithAuth(`/users/${username}/reposts`);
  },

  getUserSavedPosts: async (username: string): Promise<Complaint[]> => {
    return fetchWithAuth(`/users/${username}/saved`);
  },

  toggleFollow: async (username: string): Promise<{ is_following: boolean; followers_count: number }> => {
    return fetchWithAuth(`/users/${username}/follow`, { method: 'POST' });
  },

  updateProfile: async (data: { 
    display_name?: string; 
    bio?: string; 
    avatar_url?: string; 
    banner_url?: string; 
    website?: string 
  }): Promise<User> => {
    return fetchWithAuth('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  getSuggestedUsers: async (): Promise<User[]> => {
    return fetchWithAuth('/users/suggested');
  },

  searchUsers: async (q: string): Promise<User[]> => {
    return fetchWithAuth(`/users/search?q=${encodeURIComponent(q)}`);
  },

  // --- Communities ---
  getCommunities: async (): Promise<Community[]> => {
    return fetchWithAuth('/communities');
  },

  toggleJoinCommunity: async (slug: string): Promise<{ is_joined: boolean; members_count: number }> => {
    return fetchWithAuth(`/communities/${slug}/join`, { method: 'POST' });
  },

  // --- Topics ---
  getTopics: async (): Promise<Topic[]> => {
    return fetchWithAuth('/topics');
  },

  getTrendingTopics: async (limit: number = 5): Promise<Topic[]> => {
    return fetchWithAuth(`/topics/trending?limit=${limit}`);
  },

  getPopularTools: async (): Promise<PopularTool[]> => {
    return fetchWithAuth('/topics/popular-tools');
  },

  // --- AI Rant Assistant ---
  improveComplaint: async (content: string, mode: string): Promise<AIRewriteResponse> => {
    return fetchWithAuth('/ai/improve', {
      method: 'POST',
      body: JSON.stringify({ content, mode }),
    });
  },
};
