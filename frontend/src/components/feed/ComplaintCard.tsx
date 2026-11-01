import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Heart, 
  MessageCircle, 
  Repeat, 
  Bookmark, 
  Share2, 
  MoreHorizontal, 
  Trash2, 
  Flag, 
  Check, 
  Bot,
  Sparkles
} from 'lucide-react';
import { Complaint } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import { getMediaUrl } from '../../utils/image';

interface ComplaintCardProps {
  complaint: Complaint;
  onDeleted?: (id: string) => void;
}

export const ComplaintCard: React.FC<ComplaintCardProps> = ({ complaint, onDeleted }) => {
  const { currentUser } = useAuth();
  const { showToast, openReportModal, openConfirmModal } = useModal();
  const navigate = useNavigate();

  const [isLiked, setIsLiked] = useState(complaint.is_liked);
  const [likesCount, setLikesCount] = useState(complaint.likes_count);

  const [isBookmarked, setIsBookmarked] = useState(complaint.is_bookmarked);
  const [bookmarksCount, setBookmarksCount] = useState(complaint.bookmarks_count);

  const [isReposted, setIsReposted] = useState(complaint.is_reposted);
  const [repostsCount, setRepostsCount] = useState(complaint.reposts_count);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    } catch {
      return '';
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      showToast('Please log in to like complaints', 'info');
      return;
    }

    const previousLiked = isLiked;
    const previousCount = likesCount;

    setIsLiked(!previousLiked);
    setLikesCount(previousLiked ? previousCount - 1 : previousCount + 1);

    try {
      const res = await api.toggleLike(complaint.id);
      setIsLiked(res.is_active);
      setLikesCount(res.count);
    } catch {
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
      showToast('Failed to update reaction', 'error');
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      showToast('Please log in to bookmark complaints', 'info');
      return;
    }

    const previousBookmarked = isBookmarked;
    setIsBookmarked(!previousBookmarked);
    setBookmarksCount(previousBookmarked ? bookmarksCount - 1 : bookmarksCount + 1);

    try {
      const res = await api.toggleBookmark(complaint.id);
      setIsBookmarked(res.is_active);
      showToast(res.is_active ? 'Complaint saved' : 'Removed from bookmarks', 'success');
    } catch {
      setIsBookmarked(previousBookmarked);
      showToast('Failed to bookmark', 'error');
    }
  };

  const handleRepost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      showToast('Please log in to repost complaints', 'info');
      return;
    }

    const previousReposted = isReposted;
    setIsReposted(!previousReposted);
    setRepostsCount(previousReposted ? repostsCount - 1 : repostsCount + 1);

    try {
      const res = await api.toggleRepost(complaint.id);
      setIsReposted(res.is_active);
      showToast(res.is_active ? 'Reposted to your followers' : 'Repost removed', 'success');
    } catch {
      setIsReposted(previousReposted);
      showToast('Failed to repost', 'error');
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/complaint/${complaint.id}`;
    const shareData = {
      title: `${complaint.author.display_name} on Complain AI`,
      text: complaint.content.length > 100 ? `${complaint.content.slice(0, 100)}...` : complaint.content,
      url: url,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        showToast('Shared successfully!', 'success');
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard! 📋', 'success');
    } catch {
      showToast('Could not copy link to clipboard', 'error');
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);

    openConfirmModal({
      title: 'Delete Complaint',
      message: 'Are you sure you want to delete this complaint? This action cannot be undone.',
      confirmLabel: 'Delete',
      isDestructive: true,
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          await api.deletePost(complaint.id);
          showToast('Complaint deleted', 'info');
          if (onDeleted) onDeleted(complaint.id);
        } catch {
          showToast('Failed to delete complaint', 'error');
          setIsDeleting(false);
        }
      },
    });
  };

  const isAuthor = currentUser?.id === complaint.author.id;

  return (
    <article 
      onClick={() => navigate(`/complaint/${complaint.id}`)}
      className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft hover:shadow-card transition-all duration-200 cursor-pointer relative group"
    >
      {/* Top Header: Author + Timestamp + Tool Tag + Menu */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link 
            to={`/u/${complaint.author.username}`} 
            onClick={(e) => e.stopPropagation()}
            className="relative flex-shrink-0"
          >
            <img
              src={getMediaUrl(complaint.author.avatar_url) || `https://api.dicebear.com/7.x/bottts/svg?seed=${complaint.author.username}`}
              alt={complaint.author.display_name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 group-hover:ring-orange-100 transition-all"
            />
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link 
                to={`/u/${complaint.author.username}`}
                onClick={(e) => e.stopPropagation()}
                className="font-bold text-sm text-slate-900 hover:text-orange-600 transition-colors truncate"
              >
                {complaint.author.display_name}
              </Link>
              <span className="text-xs text-slate-400">@{complaint.author.username}</span>
              <span className="text-slate-300 text-xs">·</span>
              <span className="text-xs text-slate-400">{formatTimestamp(complaint.created_at)}</span>
            </div>

            {/* Optional Tool / Mood badges */}
            {(complaint.tool_tag || complaint.mood) && (
              <div className="flex items-center gap-1.5 mt-0.5">
                {complaint.tool_tag && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                    <Bot className="w-3 h-3 text-orange-500" />
                    {complaint.tool_tag}
                  </span>
                )}
                {complaint.mood && (
                  <span className="text-[11px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                    {complaint.mood}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* More options menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-8 w-44 bg-white rounded-xl shadow-elevated border border-slate-100 py-1.5 z-30 animate-in fade-in duration-100"
            >
              <button
                onClick={(e) => {
                  handleShare(e);
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-400" />
                Copy link
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                  openReportModal(complaint.id);
                }}
                className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <Flag className="w-3.5 h-3.5 text-amber-500" />
                Report complaint
              </button>

              {isAuthor && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full text-left px-3.5 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-100 mt-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isDeleting ? 'Deleting...' : 'Delete complaint'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Complaint Text */}
      <p className="text-slate-800 text-[15px] leading-relaxed mb-3 font-normal whitespace-pre-line">
        {complaint.content}
      </p>

      {/* Attached Images (1-4 images) */}
      {(() => {
        const rawImages = (complaint.images && complaint.images.length > 0)
          ? complaint.images
          : (complaint.image_url ? [complaint.image_url] : []);
        const postImages = rawImages.map((u) => getMediaUrl(u)).filter(Boolean);
        
        if (postImages.length === 0) return null;

        if (postImages.length === 1) {
          return (
            <div className="mb-3 rounded-2xl overflow-hidden border border-slate-100 max-h-96 bg-slate-50">
              <img
                src={postImages[0]}
                alt="Complaint attachment"
                className="w-full h-auto max-h-96 object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/png?text=Image+Unavailable';
                }}
              />
            </div>
          );
        }

        if (postImages.length === 2) {
          return (
            <div className="mb-3 grid grid-cols-2 gap-2 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
              {postImages.map((url, i) => (
                <div key={i} className="aspect-square overflow-hidden">
                  <img
                    src={url}
                    alt={`Attachment ${i + 1}`}
                    className="w-full h-full object-cover hover:scale-102 transition-transform"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          );
        }

        if (postImages.length === 3) {
          return (
            <div className="mb-3 grid grid-cols-3 gap-2 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
              <div className="col-span-2 aspect-[4/3] overflow-hidden">
                <img
                  src={postImages[0]}
                  alt="Attachment 1"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="flex flex-col gap-2">
                {postImages.slice(1).map((url, i) => (
                  <div key={i} className="flex-1 overflow-hidden">
                    <img
                      src={url}
                      alt={`Attachment ${i + 2}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        }

        return (
          <div className="mb-3 grid grid-cols-2 gap-2 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
            {postImages.slice(0, 4).map((url, i) => (
              <div key={i} className="aspect-square overflow-hidden">
                <img
                  src={url}
                  alt={`Attachment ${i + 1}`}
                  className="w-full h-full object-cover hover:scale-102 transition-transform"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        );
      })()}

      {/* Topics / Hashtags */}
      {complaint.topics && complaint.topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {complaint.topics.map((t) => (
            <button
              key={t.id || t.slug}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/home?topic=${t.slug}`);
              }}
              className="text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 hover:text-orange-700 px-2.5 py-0.5 rounded-full transition-colors"
            >
              #{t.name}
            </button>
          ))}
        </div>
      )}

      {/* Interactive Action Bar */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-slate-500 text-xs font-semibold">
        {/* Like */}
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full hover:bg-red-50 transition-colors ${
            isLiked ? 'text-rose-600' : 'hover:text-rose-600'
          }`}
          title="Like"
        >
          <Heart className={`w-4 h-4 transition-transform active:scale-125 ${isLiked ? 'fill-rose-600 text-rose-600' : ''}`} />
          <span>{likesCount > 0 ? (likesCount >= 1000 ? `${(likesCount / 1000).toFixed(1)}k` : likesCount) : 'Like'}</span>
        </button>

        {/* Reply / Comment */}
        <Link
          to={`/complaint/${complaint.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full hover:bg-orange-50 hover:text-orange-600 transition-colors"
          title="Replies"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{complaint.comments_count > 0 ? complaint.comments_count : 'Reply'}</span>
        </Link>

        {/* Repost */}
        <button
          onClick={handleRepost}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full hover:bg-emerald-50 transition-colors ${
            isReposted ? 'text-emerald-600' : 'hover:text-emerald-600'
          }`}
          title="Repost"
        >
          <Repeat className="w-4 h-4" />
          <span>{repostsCount > 0 ? repostsCount : 'Repost'}</span>
        </button>

        {/* Bookmark */}
        <button
          onClick={handleBookmark}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full hover:bg-orange-50 transition-colors ${
            isBookmarked ? 'text-orange-500' : 'hover:text-orange-500'
          }`}
          title="Bookmark"
        >
          <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-orange-500 text-orange-500' : ''}`} />
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="p-1.5 rounded-full hover:bg-slate-100 hover:text-slate-800 transition-colors"
          title="Share"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

    </article>
  );
};
