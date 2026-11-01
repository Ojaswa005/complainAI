import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Link as LinkIcon, 
  CheckCircle2, 
  Sparkles, 
  Settings, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { User, Complaint } from '../types';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { ComplaintCard } from '../components/feed/ComplaintCard';
import { getMediaUrl } from '../utils/image';

export const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { currentUser } = useAuth();
  const { openEditProfileModal, showToast } = useModal();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Complaint[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'replies' | 'liked' | 'saved'>('posts');
  const [loading, setLoading] = useState<boolean>(true);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [followersCount, setFollowersCount] = useState<number>(0);

  const fetchProfile = async () => {
    if (!username) return;
    setLoading(true);
    try {
      const [u, p] = await Promise.all([
        api.getUserProfile(username),
        api.getPosts({ author: username }),
      ]);
      setProfileUser(u);
      setPosts(p.posts);
      setIsFollowing(Boolean(u.is_following));
      setFollowersCount(u.followers_count);
    } catch (err: any) {
      console.error('Failed to load profile', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const handleFollowToggle = async () => {
    if (!currentUser) {
      showToast('Please log in to follow creators', 'info');
      return;
    }
    if (!profileUser) return;

    const previousFollowing = isFollowing;
    const previousCount = followersCount;

    setIsFollowing(!previousFollowing);
    setFollowersCount(previousFollowing ? previousCount - 1 : previousCount + 1);

    try {
      const res = await api.toggleFollow(profileUser.username);
      setIsFollowing(res.is_following);
      setFollowersCount(res.followers_count);
      showToast(res.is_following ? `Following @${profileUser.username}` : `Unfollowed @${profileUser.username}`, 'success');
    } catch {
      setIsFollowing(previousFollowing);
      setFollowersCount(previousCount);
      showToast('Failed to update follow status', 'error');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-2xl mx-auto space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin text-orange-500 mx-auto" />
        <p className="text-xs text-slate-500">Loading creator profile...</p>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="bg-white rounded-3xl border border-red-200 p-8 text-center max-w-2xl mx-auto space-y-3 shadow-soft">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
        <p className="font-bold text-slate-800 text-sm">User @{username} not found</p>
        <Link to="/home" className="px-4 py-2 bg-slate-900 text-white rounded-full text-xs font-bold inline-block">
          Return to Feed
        </Link>
      </div>
    );
  }

  const isSelf = currentUser?.id === profileUser.id;

  return (
    <div className="space-y-4 max-w-2xl mx-auto w-full pb-16 lg:pb-8">
      
      {/* Profile Card Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-soft">
        
        {/* Banner with dark sleek curve gradient matching mockup */}
        <div 
          className="h-32 sm:h-40 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 relative overflow-hidden bg-cover bg-center"
          style={profileUser.banner_url ? { backgroundImage: `url("${getMediaUrl(profileUser.banner_url)}")` } : undefined}
        >
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#F97316_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-orange-500/20 rounded-full blur-2xl" />
        </div>

        {/* Profile Info Header */}
        <div className="px-6 pb-6 relative">
          
          {/* Avatar & Edit / Follow Button Row */}
          <div className="flex items-end justify-between -mt-14 sm:-mt-16 mb-4">
            <div className="relative">
              <img
                src={getMediaUrl(profileUser.avatar_url) || `https://api.dicebear.com/7.x/bottts/svg?seed=${profileUser.username}`}
                alt={profileUser.display_name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-white shadow-md bg-white"
              />
            </div>

            {isSelf ? (
              <button
                onClick={openEditProfileModal}
                className="px-5 py-2 rounded-full border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs transition-colors"
              >
                Edit Profile
              </button>
            ) : (
              <button
                onClick={handleFollowToggle}
                className={`px-6 py-2 rounded-full text-xs font-bold transition-all shadow-xs ${
                  isFollowing
                    ? 'bg-slate-100 hover:bg-red-50 text-slate-800 hover:text-red-600 border border-slate-200'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          {/* Names */}
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-black text-slate-900">{profileUser.display_name}</h1>
              {profileUser.is_verified && (
                <CheckCircle2 className="w-4 h-4 text-orange-500 fill-orange-100" />
              )}
            </div>
            <p className="text-xs text-slate-400 font-medium">@{profileUser.username}</p>
          </div>

          {/* Bio */}
          {profileUser.bio && (
            <p className="text-xs sm:text-sm text-slate-700 mt-3 leading-relaxed">
              {profileUser.bio}
            </p>
          )}

          {/* Metrics Row: Complaints | Followers | Following (Exact Mockup Match) */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-100 text-xs">
            <div>
              <span className="font-black text-slate-900 text-sm">{profileUser.complaints_count || posts.length}</span>
              <span className="text-slate-500 ml-1.5">Complaints</span>
            </div>

            <div>
              <span className="font-black text-slate-900 text-sm">
                {followersCount >= 1000 ? `${(followersCount / 1000).toFixed(1)}K` : followersCount}
              </span>
              <span className="text-slate-500 ml-1.5">Followers</span>
            </div>

            <div>
              <span className="font-black text-slate-900 text-sm">{profileUser.following_count}</span>
              <span className="text-slate-500 ml-1.5">Following</span>
            </div>
          </div>

        </div>

        {/* Profile Tabs: Posts | Replies | Liked | Saved */}
        <div className="flex border-t border-slate-100 px-4 bg-slate-50/50">
          {(['posts', 'replies', 'liked', 'saved'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-xs font-bold capitalize transition-all relative ${
                activeTab === tab ? 'text-orange-600' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <span>{tab}</span>
              {activeTab === tab && (
                <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-orange-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

      </div>

      {/* Tab Feed Content */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center text-slate-400 text-xs">
            No complaints in this tab yet.
          </div>
        ) : (
          posts.map((item) => (
            <ComplaintCard
              key={item.id}
              complaint={item}
              onDeleted={(id) => setPosts(posts.filter((p) => p.id !== id))}
            />
          ))
        )}
      </div>

    </div>
  );
};
