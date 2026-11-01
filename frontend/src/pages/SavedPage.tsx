import React, { useState, useEffect } from 'react';
import { Bookmark, RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Complaint } from '../types';
import { ComplaintCard } from '../components/feed/ComplaintCard';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';

export const SavedPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { openAuthModal } = useModal();
  const navigate = useNavigate();

  const [bookmarks, setBookmarks] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await api.getBookmarks();
        setBookmarks(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch bookmarks');
      } finally {
        setLoading(false);
      }
    };
    fetchBookmarks();
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-2xl mx-auto space-y-4 shadow-soft">
        <Bookmark className="w-10 h-10 text-orange-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Sign in to view saved complaints</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Save funny AI fails, bug reports, and discussion threads to reference later.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-full shadow-sm"
        >
          Log in
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto w-full pb-16 lg:pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 bg-white rounded-2xl border border-slate-200/80 px-5 py-4 shadow-soft">
        <button
          onClick={() => navigate(-1)}
          className="p-1 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-extrabold text-base text-slate-900">Saved Complaints</h1>
          <p className="text-xs text-slate-400">@{currentUser.username}</p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin text-orange-500 mx-auto" />
          <p className="text-xs text-slate-500">Loading saved complaints...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl border border-red-200 p-8 text-center space-y-3 shadow-soft">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <p className="font-bold text-slate-800 text-sm">{error}</p>
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-3 shadow-soft">
          <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 mx-auto">
            <Bookmark className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-900">You haven't saved any complaints yet</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Click the bookmark icon on any complaint to save it for later.
          </p>
          <Link
            to="/home"
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-full inline-block"
          >
            Explore Feed
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookmarks.map((item) => (
            <ComplaintCard
              key={item.id}
              complaint={item}
              onDeleted={(id) => setBookmarks(bookmarks.filter((b) => b.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
};
