import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, Plus, Bookmark, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';

export const BottomNav: React.FC = () => {
  const { currentUser } = useAuth();
  const { openComplaintModal, openAuthModal, showToast } = useModal();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-2 flex items-center justify-around shadow-lg">
      <NavLink
        to="/home"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
            isActive ? 'text-orange-500 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`
        }
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px]">Home</span>
      </NavLink>

      <NavLink
        to="/explore"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
            isActive ? 'text-orange-500 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`
        }
      >
        <Compass className="w-5 h-5" />
        <span className="text-[10px]">Explore</span>
      </NavLink>

      {/* Center + Action */}
      <button
        onClick={() => {
          if (!currentUser) {
            showToast('Please log in to create a post', 'error');
            openAuthModal('login');
            return;
          }
          openComplaintModal();
        }}
        className="w-11 h-11 -mt-4 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-full flex items-center justify-center shadow-md shadow-orange-500/30 transition-all cursor-pointer"
        title="New Complaint"
      >
        <Plus className="w-6 h-6 stroke-[3]" />
      </button>

      <NavLink
        to="/saved"
        onClick={(e) => {
          if (!currentUser) {
            e.preventDefault();
            showToast('Please log in to view saved posts', 'info');
            openAuthModal('login');
          }
        }}
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
            isActive ? 'text-orange-500 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`
        }
      >
        <Bookmark className="w-5 h-5" />
        <span className="text-[10px]">Saved</span>
      </NavLink>

      <NavLink
        to={currentUser ? `/u/${currentUser.username}` : '#'}
        onClick={(e) => {
          if (!currentUser) {
            e.preventDefault();
            showToast('Please log in to view your profile', 'info');
            openAuthModal('login');
          }
        }}
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
            isActive ? 'text-orange-500 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`
        }
      >
        <UserIcon className="w-5 h-5" />
        <span className="text-[10px]">Profile</span>
      </NavLink>
    </div>
  );
};
