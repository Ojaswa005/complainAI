import React, { useState } from 'react';
import { Image, Smile, Tag, Sparkles, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import { api } from '../../services/api';
import { Complaint } from '../../types';

interface ComplaintComposerProps {
  onPostCreated?: (newPost: Complaint) => void;
}

export const ComplaintComposer: React.FC<ComplaintComposerProps> = ({ onPostCreated }) => {
  const { currentUser } = useAuth();
  const { openComplaintModal, openAuthModal, showToast } = useModal();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickSubmit = async () => {
    if (!currentUser) {
      showToast('Please log in to create a post', 'error');
      openAuthModal('login');
      return;
    }
    if (!content.trim() || content.trim().length < 5) {
      showToast('Complaint must be at least 5 characters', 'info');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await api.createPost({
        content: content.trim(),
        mood: 'Frustrated',
      });
      setContent('');
      showToast('Complaint posted to feed! 📢', 'success');
      if (onPostCreated) onPostCreated(created);
    } catch (err: any) {
      showToast(err.message || 'Failed to post complaint', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDetailedModal = () => {
    if (!currentUser) {
      showToast('Please log in to create a post', 'error');
      openAuthModal('login');
      return;
    }
    openComplaintModal({ content });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-soft">
      <div className="flex gap-3">
        <img
          src={currentUser?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
          alt={currentUser?.display_name || 'User'}
          className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 flex-shrink-0"
        />

        <div className="flex-1 min-w-0">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's your AI complaint today?"
            rows={2}
            className="w-full text-slate-800 placeholder-slate-400 text-sm resize-none outline-none focus:ring-0 border-none p-1 bg-transparent"
          />

          {/* Quick Toolbar */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleOpenDetailedModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                title="Add Image"
              >
                <Image className="w-4 h-4 text-slate-400" />
                <span className="hidden sm:inline">Add Image</span>
              </button>

              <button
                type="button"
                onClick={handleOpenDetailedModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                title="Choose mood"
              >
                <Smile className="w-4 h-4 text-slate-400" />
                <span className="hidden sm:inline">Choose mood</span>
              </button>

              <button
                type="button"
                onClick={handleOpenDetailedModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                title="Add tool"
              >
                <Tag className="w-4 h-4 text-slate-400" />
                <span className="hidden sm:inline">Add tool</span>
              </button>

              {/* Improve with AI shortcut */}
              <button
                type="button"
                onClick={handleOpenDetailedModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200/60 transition-colors cursor-pointer"
                title="AI Rant Assistant"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span className="hidden md:inline">Improve with AI</span>
              </button>
            </div>

            {/* Post button */}
            <button
              type="button"
              onClick={handleQuickSubmit}
              disabled={isSubmitting || !content.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold text-xs rounded-full shadow-sm active:scale-95 transition-all"
            >
              <span>{isSubmitting ? 'Posting...' : 'Post'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
