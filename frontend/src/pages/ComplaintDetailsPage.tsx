import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MessageCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { Complaint, Reply } from '../types';
import { ComplaintCard } from '../components/feed/ComplaintCard';
import { ReplyCard } from '../components/feed/ReplyCard';
import { ReplyComposer } from '../components/feed/ReplyComposer';
import { useModal } from '../context/ModalContext';

export const ComplaintDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useModal();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'top' | 'latest'>('top');
  
  // Replying to another reply
  const [replyingTo, setReplyingTo] = useState<{ username: string; parentId: string } | null>(null);

  const fetchPostAndReplies = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [postData, repliesData] = await Promise.all([
        api.getPost(id),
        api.getReplies(id),
      ]);
      setComplaint(postData);
      setReplies(repliesData);
    } catch (err: any) {
      setError(err.message || 'Could not load complaint details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostAndReplies();
  }, [id]);

  const handleReplyCreated = (newReply: Reply) => {
    setReplies([newReply, ...replies]);
    if (complaint) {
      setComplaint({
        ...complaint,
        comments_count: complaint.comments_count + 1,
      });
    }
  };

  const handleReplyDeleted = (replyId: string) => {
    setReplies(replies.filter((r) => r.id !== replyId));
    if (complaint && complaint.comments_count > 0) {
      setComplaint({
        ...complaint,
        comments_count: complaint.comments_count - 1,
      });
    }
  };

  const sortedReplies = [...replies].sort((a, b) => {
    if (sortBy === 'top') {
      return b.likes_count - a.likes_count;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-4 max-w-2xl mx-auto w-full pb-16 lg:pb-8">
      
      {/* Top Breadcrumb Header */}
      <div className="flex items-center gap-3 bg-white rounded-2xl border border-slate-200/80 px-4 py-3 shadow-soft sticky top-16 z-20 backdrop-blur-md bg-white/95">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-extrabold text-sm text-slate-900">Complaint Discussion</span>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin text-orange-500 mx-auto" />
          <p className="text-xs text-slate-500">Loading complaint thread...</p>
        </div>
      ) : error || !complaint ? (
        <div className="bg-white rounded-2xl border border-red-200 p-8 text-center space-y-3 shadow-soft">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <p className="font-bold text-slate-800 text-sm">{error || 'Complaint not found'}</p>
          <Link
            to="/home"
            className="px-4 py-2 bg-slate-900 text-white rounded-full text-xs font-bold inline-block"
          >
            Back to Feed
          </Link>
        </div>
      ) : (
        <>
          {/* Main Complaint Card */}
          <ComplaintCard complaint={complaint} onDeleted={() => navigate('/home')} />

          {/* Replies Thread Section */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft space-y-4">
            
            {/* Thread Header with Sort */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">Replies</span>
                <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                  {replies.length}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setSortBy('top')}
                  className={`font-semibold transition-colors ${
                    sortBy === 'top' ? 'text-orange-600 font-bold' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Top Replies
                </button>
                <span className="text-slate-300">·</span>
                <button
                  onClick={() => setSortBy('latest')}
                  className={`font-semibold transition-colors ${
                    sortBy === 'latest' ? 'text-orange-600 font-bold' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Latest
                </button>
              </div>
            </div>

            {/* Replies List */}
            {sortedReplies.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No replies yet. Be the first to share your thoughts!
              </div>
            ) : (
              <div className="space-y-1">
                {sortedReplies.map((r) => (
                  <ReplyCard
                    key={r.id}
                    reply={r}
                    onDeleted={handleReplyDeleted}
                    onReplyClick={(username, parentId) => setReplyingTo({ username, parentId })}
                  />
                ))}
              </div>
            )}

            {/* Write a Reply Input Box */}
            <div className="pt-2">
              <ReplyComposer
                postId={complaint.id}
                parentId={replyingTo?.parentId}
                replyingToUsername={replyingTo?.username}
                onReplyCreated={handleReplyCreated}
                onCancelReplyTo={() => setReplyingTo(null)}
              />
            </div>

          </div>
        </>
      )}

    </div>
  );
};
