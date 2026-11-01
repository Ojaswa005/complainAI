import React, { useState, useEffect } from 'react';
import { X, Users, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useModal } from '../../context/ModalContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { User } from '../../types';

export const FollowListModal: React.FC = () => {
  const { followListOptions, closeFollowListModal, showToast } = useModal();
  const { currentUser } = useAuth();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!followListOptions) return;
    const loadList = async () => {
      setLoading(true);
      try {
        const data = followListOptions.mode === 'followers'
          ? await api.getFollowers(followListOptions.username)
          : await api.getFollowing(followListOptions.username);
        setUsers(data);

        const states: Record<string, boolean> = {};
        data.forEach((u) => {
          states[u.username] = Boolean(u.is_following);
        });
        setFollowingStates(states);
      } catch (err: any) {
        showToast(err.message || 'Failed to load users list', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadList();
  }, [followListOptions]);

  if (!followListOptions) return null;

  const handleFollowToggle = async (username: string) => {
    if (!currentUser) {
      showToast('Please log in to follow creators', 'info');
      return;
    }
    const current = followingStates[username];
    setFollowingStates((prev) => ({ ...prev, [username]: !current }));

    try {
      const res = await api.toggleFollow(username);
      setFollowingStates((prev) => ({ ...prev, [username]: res.is_following }));
      showToast(res.is_following ? `Following @${username}` : `Unfollowed @${username}`, 'success');
    } catch {
      setFollowingStates((prev) => ({ ...prev, [username]: current }));
      showToast('Failed to update follow status', 'error');
    }
  };

  const isFollowers = followListOptions.mode === 'followers';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-500" />
            <h2 className="text-base font-bold text-slate-900">
              {isFollowers ? 'Followers' : 'Following'}
            </h2>
            <span className="text-xs text-slate-400">@{followListOptions.username}</span>
          </div>

          <button
            onClick={closeFollowListModal}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100">
          {loading ? (
            <div className="py-12 text-center space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-orange-500 mx-auto" />
              <p className="text-xs text-slate-400">Loading {isFollowers ? 'followers' : 'following'}...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-700">
                {isFollowers ? 'No followers yet' : 'Not following anyone yet'}
              </p>
              <p className="text-xs text-slate-400">
                {isFollowers ? 'When people follow this creator, they will appear here.' : 'When this creator follows others, they will appear here.'}
              </p>
            </div>
          ) : (
            users.map((u) => {
              const isSelf = currentUser?.id === u.id;
              const following = followingStates[u.username];

              return (
                <div key={u.id} className="py-3 flex items-center justify-between gap-3 group">
                  <Link
                    to={`/u/${u.username}`}
                    onClick={closeFollowListModal}
                    className="flex items-center gap-3 min-w-0 flex-1"
                  >
                    <img
                      src={u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`}
                      alt={u.display_name}
                      className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-100 group-hover:ring-orange-200 transition-all flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-bold text-slate-900 group-hover:text-orange-600 transition-colors truncate">
                          {u.display_name}
                        </p>
                        {u.is_verified && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-orange-500 fill-orange-100 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">@{u.username}</p>
                      {u.bio && (
                        <p className="text-[11px] text-slate-600 truncate mt-0.5 max-w-xs">{u.bio}</p>
                      )}
                    </div>
                  </Link>

                  {!isSelf && (
                    <button
                      onClick={() => handleFollowToggle(u.username)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex-shrink-0 shadow-xs ${
                        following
                          ? 'bg-slate-100 hover:bg-red-50 text-slate-800 hover:text-red-600 border border-slate-200'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      {following ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
