import React, { useState } from 'react';
import { Send, Image, Smile } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import { api } from '../../services/api';
import { Reply } from '../../types';

interface ReplyComposerProps {
  postId: string;
  parentId?: string;
  replyingToUsername?: string;
  onReplyCreated: (reply: Reply) => void;
  onCancelReplyTo?: () => void;
}

export const ReplyComposer: React.FC<ReplyComposerProps> = ({
  postId,
  parentId,
  replyingToUsername,
  onReplyCreated,
  onCancelReplyTo,
}) => {
  const { currentUser } = useAuth();
  const { openAuthModal, showToast } = useModal();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Please log in to post a reply', 'error');
      openAuthModal('login');
      return;
    }
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const newReply = await api.createReply(postId, content.trim(), parentId);
      setContent('');
      showToast('Reply posted! 💬', 'success');
      onReplyCreated(newReply);
      if (onCancelReplyTo) onCancelReplyTo();
    } catch (err: any) {
      showToast(err.message || 'Failed to post reply', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80">
      {replyingToUsername && (
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60 text-xs text-slate-500">
          <span>
            Replying to <span className="font-semibold text-orange-600">@{replyingToUsername}</span>
          </span>
          {onCancelReplyTo && (
            <button
              onClick={onCancelReplyTo}
              className="text-slate-400 hover:text-slate-700 font-semibold"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <img
          src={currentUser?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
          alt={currentUser?.display_name || 'User'}
          className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 flex-shrink-0"
        />

        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a reply..."
          className="flex-1 bg-white border border-slate-200 rounded-full px-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 transition-colors"
        />

        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="p-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-full transition-all active:scale-95 flex-shrink-0 shadow-xs"
          title="Send reply"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
