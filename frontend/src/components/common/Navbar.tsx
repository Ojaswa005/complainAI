import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Bot, 
  Search, 
  Bell, 
  Plus, 
  User as UserIcon, 
  Bookmark, 
  LogOut, 
  Users, 
  Check, 
  ChevronDown,
  Sparkles,
  Heart,
  MessageCircle,
  Repeat,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import { api } from '../../services/api';
import { NotificationItem } from '../../types';

export const Navbar: React.FC = () => {
  const { currentUser, logout, demoUsers, switchDemoUser } = useAuth();
  const { openComplaintModal, openAuthModal, showToast } = useModal();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isLandingPage = location.pathname === '/';

  // Fetch unread count for current user
  useEffect(() => {
    if (!currentUser) {
      setUnreadCount(0);
      setNotifications([]);
      return;
    }

    const checkUnread = async () => {
      try {
        const data = await api.getUnreadNotificationsCount();
        setUnreadCount(data.unread_count);
      } catch {
        // silent fallback
      }
    };

    checkUnread();
    const interval = setInterval(checkUnread, 30000); // 30s poll
    return () => clearInterval(interval);
  }, [currentUser]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenNotifications = async () => {
    if (!currentUser) {
      showToast('Please log in to view notifications', 'info');
      openAuthModal('login');
      return;
    }

    const nextState = !isNotificationsOpen;
    setIsNotificationsOpen(nextState);

    if (nextState) {
      setLoadingNotifs(true);
      try {
        const list = await api.getNotifications(10);
        setNotifications(list);
        if (unreadCount > 0) {
          await api.markNotificationsRead();
          setUnreadCount(0);
        }
      } catch {
        // silent
      } finally {
        setLoadingNotifs(false);
      }
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/home?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const formatNotifTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : `${dateStr}Z`);
      const diffMs = Date.now() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch {
      return '';
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />;
      case 'reply':
        return <MessageCircle className="w-3.5 h-3.5 text-orange-500" />;
      case 'repost':
        return <Repeat className="w-3.5 h-3.5 text-emerald-500" />;
      case 'follow':
        return <UserPlus className="w-3.5 h-3.5 text-blue-500" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  const getNotifText = (n: NotificationItem) => {
    switch (n.type) {
      case 'like':
        return 'liked your complaint';
      case 'reply':
        return 'replied to your complaint';
      case 'repost':
        return 'reposted your complaint';
      case 'follow':
        return 'started following you';
      default:
        return 'interacted with your content';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <Link to={isLandingPage ? "/" : "/home"} className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform duration-200">
            <Bot className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-orange-600 transition-colors flex items-center gap-1">
              Complain <span className="text-orange-500">AI</span>
            </span>
          </div>
        </Link>

        {/* If Landing Page Navbar Links */}
        {isLandingPage ? (
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-semibold text-orange-600 transition-colors">
              Home
            </Link>
            <Link to="/explore" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Explore
            </Link>
            <Link to="/home" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Feed
            </Link>
            <a href="#about" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              About
            </a>
          </nav>
        ) : (
          /* Search Bar (Feed & App Pages) */
          <div className="flex-1 max-w-lg hidden sm:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search complaints, topics, or users..."
                className="w-full pl-10 pr-4 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-sm text-slate-900 placeholder-slate-400 rounded-full border border-transparent focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
              />
            </form>
          </div>
        )}

        {/* Right Section Actions */}
        <div className="flex items-center gap-3">
          {/* Notification icon */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={handleOpenNotifications}
              className="relative p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {currentUser && unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
              )}
            </button>

            {/* Notifications Popover */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-elevated border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-orange-500" />
                    <span className="font-bold text-sm text-slate-900">Notifications</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Recent activity</span>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                  {loadingNotifs ? (
                    <div className="py-8 text-center text-xs text-slate-400">Loading notifications...</div>
                  ) : notifications.length === 0 ? (
                    <div className="py-8 text-center space-y-1">
                      <p className="text-xs font-semibold text-slate-700">No notifications yet</p>
                      <p className="text-[11px] text-slate-400">When people interact with your complaints, you will see it here.</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div 
                        key={n.id}
                        onClick={() => {
                          setIsNotificationsOpen(false);
                          if (n.post_id) navigate(`/complaint/${n.post_id}`);
                          else navigate(`/u/${n.actor.username}`);
                        }}
                        className="p-3 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-3"
                      >
                        <div className="relative flex-shrink-0">
                          <img
                            src={n.actor.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${n.actor.username}`}
                            alt={n.actor.display_name}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-100"
                          />
                          <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow-xs">
                            {getNotifIcon(n.type)}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0 text-xs">
                          <p className="text-slate-800">
                            <span className="font-bold text-slate-900">@{n.actor.username}</span>{' '}
                            {getNotifText(n)}
                          </p>
                          {n.post_snippet && (
                            <p className="text-[11px] text-slate-500 truncate mt-0.5 italic">
                              "{n.post_snippet}"
                            </p>
                          )}
                          <p className="text-[10px] text-slate-400 mt-1">{formatNotifTime(n.created_at)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Avatar & Menu OR Auth Buttons */}
          {currentUser ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-full hover:bg-slate-100 transition-colors border border-slate-200/60"
              >
                <img
                  src={currentUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.username}`}
                  alt={currentUser.display_name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-orange-100"
                />
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-elevated border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="font-semibold text-sm text-slate-900">{currentUser.display_name}</p>
                    <p className="text-xs text-slate-500">@{currentUser.username}</p>
                  </div>

                  <div className="py-1">
                    <Link
                      to={`/u/${currentUser.username}`}
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      View Profile
                    </Link>
                    <Link
                      to="/saved"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                    >
                      <Bookmark className="w-4 h-4 text-slate-400" />
                      Saved Complaints
                    </Link>
                  </div>

                  {/* Demo User Switcher Submenu */}
                  <div className="border-t border-slate-100 pt-2 pb-1">
                    <div className="px-4 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Switch Demo User</span>
                      <Sparkles className="w-3 h-3 text-amber-500" />
                    </div>
                    {demoUsers.map((demo) => (
                      <button
                        key={demo.id}
                        onClick={async () => {
                          await switchDemoUser(demo.username);
                          setIsDropdownOpen(false);
                          showToast(`Switched to @${demo.username}`, 'success');
                        }}
                        className={`w-full text-left flex items-center justify-between px-4 py-1.5 text-xs transition-colors ${
                          currentUser.username === demo.username
                            ? 'bg-orange-50 font-bold text-orange-600'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate">@{demo.username}</span>
                        {currentUser.username === demo.username && (
                          <Check className="w-3.5 h-3.5 text-orange-500" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={() => {
                        logout();
                        setIsDropdownOpen(false);
                        showToast('Logged out successfully', 'info');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal('login')}
                className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-orange-600 transition-colors"
              >
                Log in
              </button>
              <button
                onClick={() => openAuthModal('register')}
                className="px-4 py-1.5 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-full shadow-xs transition-all"
              >
                Sign up
              </button>
            </div>
          )}

          {/* Primary "+ Complain" CTA Button */}
          <button
            onClick={() => {
              if (!currentUser) {
                showToast('Please log in to create a post', 'info');
                openAuthModal('login');
              } else {
                openComplaintModal();
              }
            }}
            className="flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold text-sm rounded-full shadow-sm hover:shadow-md hover:shadow-orange-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Complain</span>
          </button>
        </div>

      </div>
    </header>
  );
};
