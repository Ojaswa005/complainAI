import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Cpu, 
  Users, 
  ExternalLink, 
  Sparkles, 
  Bot, 
  Check, 
  Plus, 
  Layers
} from 'lucide-react';
import { api } from '../../services/api';
import { Topic, PopularTool, User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';

export const RightSidebar: React.FC = () => {
  const [trendingTopics, setTrendingTopics] = useState<Topic[]>([]);
  const [popularTools, setPopularTools] = useState<PopularTool[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});
  
  const { currentUser } = useAuth();
  const { showToast } = useModal();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [topics, tools, users] = await Promise.all([
          api.getTrendingTopics(5),
          api.getPopularTools(),
          api.getSuggestedUsers(),
        ]);
        setTrendingTopics(topics);
        setPopularTools(tools);
        setSuggestedUsers(users);

        const initialFollows: Record<string, boolean> = {};
        users.forEach((u) => {
          initialFollows[u.username] = Boolean(u.is_following);
        });
        setFollowingStates(initialFollows);
      } catch (err) {
        console.error('Failed to fetch right sidebar data', err);
      }
    };

    fetchData();
  }, [currentUser]);

  const handleFollowToggle = async (username: string) => {
    if (!currentUser) {
      showToast('Please log in to follow creators', 'info');
      return;
    }
    const currentlyFollowing = followingStates[username];
    setFollowingStates((prev) => ({ ...prev, [username]: !currentlyFollowing }));

    try {
      const res = await api.toggleFollow(username);
      setFollowingStates((prev) => ({ ...prev, [username]: res.is_following }));
      showToast(res.is_following ? `Following @${username}` : `Unfollowed @${username}`, 'success');
    } catch {
      setFollowingStates((prev) => ({ ...prev, [username]: currentlyFollowing }));
      showToast('Failed to update follow status', 'error');
    }
  };

  // Helper for tool badges
  const getToolIconBg = (tool: string) => {
    switch (tool.toLowerCase()) {
      case 'chatgpt':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'claude':
        return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'gemini':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'midjourney':
        return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'copilot':
        return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <aside className="hidden xl:flex flex-col w-80 h-[calc(100vh-4rem)] sticky top-16 border-l border-slate-200/80 px-4 py-6 space-y-6 overflow-y-auto">
      
      {/* 1. Trending Complaints Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-soft">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <span>Trending Complaints</span>
          </h2>
          <Link to="/explore?tab=topics" className="text-xs font-semibold text-orange-600 hover:text-orange-700">
            See all
          </Link>
        </div>

        <div className="space-y-2.5">
          {trendingTopics.map((topic, index) => (
            <button
              key={topic.id}
              onClick={() => navigate(`/home?topic=${topic.slug}`)}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 text-left transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-5 font-bold text-xs text-orange-500/80 group-hover:text-orange-600">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-xs text-slate-900 group-hover:text-orange-600 transition-colors truncate">
                    {topic.name}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {(topic.posts_count / 1000).toFixed(1)}k posts
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Popular AI Tools Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-soft">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <span>Popular AI Tools</span>
          </h2>
          <Link to="/explore?tab=tools" className="text-xs font-semibold text-orange-600 hover:text-orange-700">
            See all
          </Link>
        </div>

        <div className="space-y-2">
          {popularTools.map((item) => (
            <button
              key={item.tool}
              onClick={() => navigate(`/home?tool=${item.tool}`)}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 text-left transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border font-bold text-xs ${getToolIconBg(item.tool)}`}>
                  {item.tool.slice(0, 2)}
                </div>
                <div>
                  <p className="font-semibold text-xs text-slate-900 group-hover:text-orange-600 transition-colors">
                    {item.tool}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {(item.count / 1000).toFixed(1)}k complaints
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-medium text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity">
                Filter &rarr;
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Suggested Users Card */}
      {suggestedUsers.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-soft">
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="font-bold text-slate-900 text-sm">Suggested Users</h2>
            <Link to="/explore" className="text-xs font-semibold text-orange-600 hover:text-orange-700">
              Discover
            </Link>
          </div>

          <div className="space-y-3">
            {suggestedUsers.slice(0, 3).map((user) => (
              <div key={user.id} className="flex items-center justify-between gap-2">
                <Link to={`/u/${user.username}`} className="flex items-center gap-2.5 min-w-0 group">
                  <img
                    src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                    alt={user.display_name}
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-100"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate group-hover:text-orange-600 transition-colors">
                      {user.display_name}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">@{user.username}</p>
                  </div>
                </Link>

                <button
                  onClick={() => handleFollowToggle(user.username)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    followingStates[user.username]
                      ? 'bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {followingStates[user.username] ? 'Following' : 'Follow'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="text-[11px] text-slate-400 px-2 space-y-1">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <Link to="/" className="hover:underline">About</Link>
          <a href="#" className="hover:underline">Terms</a>
          <a href="#" className="hover:underline">Privacy</a>
          <a href="#" className="hover:underline">AI Guidelines</a>
        </div>
        <p>© 2026 Complain AI. Where AI gets called out.</p>
      </div>

    </aside>
  );
};
