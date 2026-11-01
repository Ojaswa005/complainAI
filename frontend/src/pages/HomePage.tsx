import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, TrendingUp, Clock, Filter, X, RefreshCw, AlertCircle, Bot } from 'lucide-react';
import { api } from '../services/api';
import { Complaint } from '../types';
import { ComplaintComposer } from '../components/feed/ComplaintComposer';
import { ComplaintCard } from '../components/feed/ComplaintCard';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';

export const HomePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentFeedTab = searchParams.get('tab') || 'for-you';
  const topicFilter = searchParams.get('topic');
  const toolFilter = searchParams.get('tool');
  const searchQuery = searchParams.get('search');

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);

  const { currentUser } = useAuth();
  const { openComplaintModal } = useModal();

  const fetchFeed = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPosts({
        feed_type: currentFeedTab,
        topic: topicFilter || undefined,
        tool_tag: toolFilter || undefined,
        search: searchQuery || undefined,
        limit: 30,
      });
      setComplaints(data.posts);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [currentFeedTab, topicFilter, toolFilter, searchQuery]);

  const handleTabChange = (tab: string) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', tab);
    setSearchParams(nextParams);
  };

  const clearFilter = (key: string) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete(key);
    setSearchParams(nextParams);
  };

  const handlePostCreated = (newPost: Complaint) => {
    setComplaints([newPost, ...complaints]);
    setTotal((prev) => prev + 1);
  };

  const handlePostDeleted = (deletedId: string) => {
    setComplaints(complaints.filter((c) => c.id !== deletedId));
    setTotal((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto w-full pb-16 lg:pb-8">
      
      {/* Top Header Tabs: For You | Trending | Latest (matching mockup) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-1 flex items-center justify-around sticky top-16 z-30 backdrop-blur-md bg-white/95">
        <button
          onClick={() => handleTabChange('for-you')}
          className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all relative ${
            currentFeedTab === 'for-you'
              ? 'text-orange-600 bg-orange-50/60 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <span>For You</span>
          {currentFeedTab === 'for-you' && (
            <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-orange-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => handleTabChange('trending')}
          className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all relative ${
            currentFeedTab === 'trending'
              ? 'text-orange-600 bg-orange-50/60 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <span>Trending</span>
          {currentFeedTab === 'trending' && (
            <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-orange-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => handleTabChange('latest')}
          className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all relative ${
            currentFeedTab === 'latest'
              ? 'text-orange-600 bg-orange-50/60 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <span>Latest</span>
          {currentFeedTab === 'latest' && (
            <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-orange-500 rounded-full" />
          )}
        </button>
      </div>

      {/* Active Filter Indicators */}
      {(topicFilter || toolFilter || searchQuery) && (
        <div className="bg-orange-50/80 border border-orange-200/80 rounded-2xl p-3 flex items-center justify-between gap-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 flex-wrap text-xs text-orange-900">
            <span className="font-bold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-orange-600" /> Active filter:
            </span>
            {topicFilter && (
              <span className="bg-white px-2.5 py-1 rounded-full border border-orange-200 font-semibold flex items-center gap-1">
                #{topicFilter}
                <button onClick={() => clearFilter('topic')} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {toolFilter && (
              <span className="bg-white px-2.5 py-1 rounded-full border border-orange-200 font-semibold flex items-center gap-1">
                🤖 {toolFilter}
                <button onClick={() => clearFilter('tool')} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="bg-white px-2.5 py-1 rounded-full border border-orange-200 font-semibold flex items-center gap-1">
                Search: "{searchQuery}"
                <button onClick={() => clearFilter('search')} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          <button
            onClick={() => setSearchParams({ tab: currentFeedTab })}
            className="text-xs font-bold text-orange-700 hover:text-orange-900 underline flex-shrink-0"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Quick Composer Box */}
      <ComplaintComposer onPostCreated={handlePostCreated} />

      {/* Feed Content */}
      {loading ? (
        <div className="space-y-4 pt-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200" />
                <div className="space-y-1.5 flex-1">
                  <div className="w-32 h-3.5 bg-slate-200 rounded" />
                  <div className="w-20 h-2.5 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="w-full h-12 bg-slate-100 rounded-xl" />
              <div className="w-24 h-4 bg-slate-200 rounded-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl border border-red-200 p-8 text-center space-y-3 shadow-soft">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <p className="font-bold text-slate-800 text-sm">{error}</p>
          <button
            onClick={fetchFeed}
            className="px-4 py-2 bg-slate-900 text-white rounded-full text-xs font-bold hover:bg-slate-800"
          >
            Try Again
          </button>
        </div>
      ) : complaints.length === 0 ? (
        /* Empty State with Mascot */
        <div className="bg-white rounded-3xl border border-slate-200/80 p-10 text-center space-y-4 shadow-soft">
          <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto shadow-md border-2 border-orange-100 bg-orange-50">
            <img src="/robot_mascot.jpg" alt="Mascot" className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">No complaints found</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
              Be the first to call out artificial intelligence in this feed!
            </p>
          </div>
          <button
            onClick={() => openComplaintModal()}
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-full shadow-sm"
          >
            Share First Complaint
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map((item) => (
            <ComplaintCard
              key={item.id}
              complaint={item}
              onDeleted={handlePostDeleted}
            />
          ))}
        </div>
      )}

    </div>
  );
};
