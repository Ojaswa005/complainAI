import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageSquare, Trash2 } from 'lucide-react';
import { Reply } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';

interface ReplyCardProps {
  reply: Reply;
  onDeleted?: (replyId: string) => void;
  onReplyClick?: (authorHandle: string, replyId: string) => void;
}

export const ReplyCard: React.FC<ReplyCardProps> = ({ reply, onDeleted, onReplyClick }) => {
  const { currentUser } = useAuth();
  const { showToast, openConfirmModal, openAuthModal } = useModal();

  const [isLiked, setIsLiked] = useState(reply.is_liked);
  const [likesCount, setLikesCount] = useState(reply.likes_count);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatTimestamp = (dateStr: string) => {
    try {
      if (!dateStr) return '';
      const isoStr = !dateStr.endsWith('Z') && !dateStr.includes('+') ? `${dateStr}Z` : dateStr;
      const date = new Date(isoStr);
      const now = new Date();
      const diffMs = Math.max(0, now.getTime() - date.getTime());
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 45) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const handleLike = async () => {
    if (!currentUser) {
      showToast('Please log in to like replies', 'info');
      openAuthModal('login');
      return;
    }

    const previousLiked = isLiked;
    const previousCount = likesCount;

    setIsLiked(!previousLiked);
    setLikesCount(previousLiked ? previousCount - 1 : previousCount + 1);

    try {
      const res = await api.toggleLikeReply(reply.id);
      setIsLiked(res.liked);
      setLikesCount(res.likes_count);
    } catch {
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
      showToast('Failed to like reply', 'error');
    }
  };

  const handleDelete = () => {
    openConfirmModal({
      title: 'Delete Reply',
      message: 'Are you sure you want to delete this reply? This action cannot be undone.',
      confirmLabel: 'Delete',
      isDestructive: true,
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          await api.deleteReply(reply.id);
          showToast('Reply deleted', 'info');
          if (onDeleted) onDeleted(reply.id);
        } catch {
          showToast('Failed to delete reply', 'error');
          setIsDeleting(false);
        }
      },
    });
  };

  const isAuthor = currentUser?.id === reply.author.id;

  return (
    <div className="flex gap-3 py-3 border-b border-slate-100 last:border-b-0 group">
      <Link to={`/u/${reply.author.username}`} className="flex-shrink-0">
        <img
          src={reply.author.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${reply.author.username}`}
          alt={reply.author.display_name}
          className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-100"
        />
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              to={`/u/${reply.author.username}`}
              className="text-xs font-bold text-slate-900 hover:text-orange-600 transition-colors"
            >
              {reply.author.display_name}
            </Link>
            <span className="text-[11px] text-slate-400">@{reply.author.username}</span>
            {reply.created_at && (
              <>
                <span className="text-slate-300 text-[10px]">·</span>
                <span className="text-[11px] text-slate-400">{formatTimestamp(reply.created_at)}</span>
              </>
            )}
          </div>

          {isAuthor && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-1 rounded transition-opacity cursor-pointer"
              title="Delete reply"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <p className="text-xs text-slate-800 mt-1 leading-relaxed whitespace-pre-line">
          {reply.content}
        </p>

        {/* Action row */}
        <div className="flex items-center gap-4 mt-2 text-[11px] font-semibold text-slate-400">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 hover:text-rose-600 transition-colors ${
              isLiked ? 'text-rose-600 font-bold' : ''
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-600 text-rose-600' : ''}`} />
            <span>{likesCount > 0 ? likesCount : 'Like'}</span>
          </button>

          {onReplyClick && (
            <button
              onClick={() => onReplyClick(reply.author.username, reply.id)}
              className="hover:text-orange-600 transition-colors"
            >
              Reply
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
