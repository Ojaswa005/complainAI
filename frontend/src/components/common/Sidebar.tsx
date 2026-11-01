import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Compass, 
  Flame, 
  Users, 
  Cpu, 
  Trophy, 
  Bookmark, 
  User as UserIcon,
  Sparkles,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';

export const Sidebar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { openComplaintModal, openAuthModal, showToast } = useModal();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Home', path: '/home', icon: Home },
    { name: 'Explore', path: '/explore', icon: Compass },
    { name: 'Trending', path: '/trending', icon: Flame },
    { name: 'Communities', path: '/explore?tab=communities', icon: Users },
    { name: 'AI Tools', path: '/explore?tab=tools', icon: Cpu },
    { name: 'Leaderboard', path: '/explore?tab=trending', icon: Trophy },
    { name: 'Saved', path: '/saved', icon: Bookmark },
    { name: 'Profile', path: currentUser ? `/u/${currentUser.username}` : '#', icon: UserIcon },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 h-[calc(100vh-4rem)] sticky top-16 border-r border-slate-200/80 px-4 py-6 justify-between select-none">
      <div className="space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={(e) => {
                if (item.name === 'Profile' && !currentUser) {
                  e.preventDefault();
                  showToast('Please log in to view your profile', 'info');
                  openAuthModal('login');
                } else if (item.name === 'Saved' && !currentUser) {
                  e.preventDefault();
                  showToast('Please log in to view saved posts', 'info');
                  openAuthModal('login');
                }
              }}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-orange-50 text-orange-600 shadow-sm shadow-orange-500/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}

        {/* Quick Complain Button in Sidebar */}
        <div className="pt-4">
          <button
            onClick={() => {
              if (!currentUser) {
                showToast('Please log in to create a post', 'error');
                openAuthModal('login');
                return;
              }
              openComplaintModal();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-2xl shadow-md shadow-orange-500/20 active:scale-98 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Vent AI Frustration</span>
          </button>
        </div>
      </div>

      {/* User Quick Info at Bottom */}
      {currentUser && (
        <div className="pt-4 border-t border-slate-100">
          <div 
            onClick={() => navigate(`/u/${currentUser.username}`)}
            className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-100/80 cursor-pointer transition-colors group"
          >
            <img
              src={currentUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.username}`}
              alt={currentUser.display_name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 group-hover:ring-orange-200 transition-all"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate group-hover:text-orange-600 transition-colors">
                {currentUser.display_name}
              </p>
              <p className="text-xs text-slate-500 truncate">@{currentUser.username}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                logout();
              }}
              className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-white transition-colors"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
