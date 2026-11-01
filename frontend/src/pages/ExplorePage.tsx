import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Code, 
  Briefcase, 
  AlertTriangle, 
  Coffee, 
  Palette, 
  Shield, 
  GraduationCap, 
  Eye, 
  Cpu, 
  TrendingUp, 
  Users, 
  Layers, 
  Sparkles,
  Bot,
  Check,
  Loader2
} from 'lucide-react';
import { api } from '../services/api';
import { Topic, PopularTool, Community } from '../types';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';

export const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'topics';
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast, openAuthModal } = useModal();

  const [topics, setTopics] = useState<Topic[]>([]);
  const [popularTools, setPopularTools] = useState<PopularTool[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [joiningSlug, setJoiningSlug] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [topicsData, toolsData, commsData] = await Promise.all([
          api.getTopics(),
          api.getPopularTools(),
          api.getCommunities(),
        ]);
        setTopics(topicsData);
        setPopularTools(toolsData);
        setCommunities(commsData);
      } catch (err) {
        console.error('Failed to load explore data', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentUser]);

  const handleJoinToggle = async (comm: Community, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      showToast('Please log in to join communities', 'info');
      openAuthModal('login');
      return;
    }

    setJoiningSlug(comm.slug);
    try {
      const res = await api.toggleJoinCommunity(comm.slug);
      setCommunities((prev) =>
        prev.map((c) =>
          c.slug === comm.slug
            ? { ...c, is_joined: res.is_joined, members_count: res.members_count }
            : c
        )
      );
      showToast(
        res.is_joined
          ? `Joined ${comm.name}! 🎉`
          : `Left ${comm.name}`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to update community membership', 'error');
    } finally {
      setJoiningSlug(null);
    }
  };

  const handleTabSelect = (tab: string) => {
    setSearchParams({ tab });
  };

  // Mockup card color definitions
  const getCardTheme = (slug: string, index: number) => {
    const themes = [
      { bg: 'bg-orange-50 border-orange-200 text-orange-950', iconBg: 'bg-orange-500 text-white', icon: Code },
      { bg: 'bg-amber-50 border-amber-200 text-amber-950', iconBg: 'bg-amber-500 text-white', icon: Briefcase },
      { bg: 'bg-red-50 border-red-200 text-red-950', iconBg: 'bg-red-500 text-white', icon: AlertTriangle },
      { bg: 'bg-emerald-50 border-emerald-200 text-emerald-950', iconBg: 'bg-emerald-500 text-white', icon: Coffee },
      { bg: 'bg-cyan-50 border-cyan-200 text-cyan-950', iconBg: 'bg-cyan-500 text-white', icon: Palette },
      { bg: 'bg-purple-50 border-purple-200 text-purple-950', iconBg: 'bg-purple-500 text-white', icon: Shield },
      { bg: 'bg-indigo-50 border-indigo-200 text-indigo-950', iconBg: 'bg-indigo-500 text-white', icon: GraduationCap },
      { bg: 'bg-pink-50 border-pink-200 text-pink-950', iconBg: 'bg-pink-500 text-white', icon: Eye },
      { bg: 'bg-blue-50 border-blue-200 text-blue-950', iconBg: 'bg-blue-500 text-white', icon: Cpu },
    ];
    return themes[index % themes.length];
  };

  const filteredTopics = topics.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto w-full pb-16 lg:pb-8">
      
      {/* Search Header */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-soft space-y-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Explore</h1>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search topics, hallucinations, or tools..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-orange-500 outline-none transition-all"
          />
        </div>

        {/* Tabs matching mockup: Trending | Topics | AI Tools | Communities */}
        <div className="flex border-b border-slate-100 gap-6 text-xs font-bold pt-1">
          {[
            { id: 'trending', label: 'Trending' },
            { id: 'topics', label: 'Topics' },
            { id: 'tools', label: 'AI Tools' },
            { id: 'communities', label: 'Communities' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabSelect(tab.id)}
              className={`pb-3 relative transition-colors ${
                activeTab === tab.id ? 'text-orange-600' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* TOPICS GRID (Matching Mockup Screen) */}
      {activeTab === 'topics' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {filteredTopics.map((topic, idx) => {
            const theme = getCardTheme(topic.slug, idx);
            const Icon = theme.icon;

            return (
              <button
                key={topic.id}
                onClick={() => navigate(`/home?topic=${topic.slug}`)}
                className={`p-5 rounded-3xl border shadow-soft hover:shadow-card hover:scale-[1.02] active:scale-98 text-left transition-all flex flex-col justify-between h-36 ${theme.bg}`}
              >
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-xs ${theme.iconBg}`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div>
                  <h3 className="font-extrabold text-sm tracking-tight">#{topic.name}</h3>
                  <p className="text-[11px] font-medium opacity-70 mt-0.5">
                    {(topic.posts_count / 1000).toFixed(1)}K posts
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* AI TOOLS TAB */}
      {activeTab === 'tools' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {popularTools.map((tool) => (
            <button
              key={tool.tool}
              onClick={() => navigate(`/home?tool=${tool.tool}`)}
              className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-soft hover:shadow-card hover:border-orange-300 text-left transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center font-bold text-orange-600 text-sm group-hover:scale-105 transition-transform">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-orange-600 transition-colors">
                    {tool.tool}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {(tool.count / 1000).toFixed(1)}k complaints filed
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity">
                View &rarr;
              </span>
            </button>
          ))}
        </div>
      )}

      {/* TRENDING TAB */}
      {activeTab === 'trending' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-soft space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            Top AI Complaints Ranked
          </h2>
          <div className="space-y-3">
            {topics.slice(0, 6).map((topic, i) => (
              <button
                key={topic.id}
                onClick={() => navigate(`/home?topic=${topic.slug}`)}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-orange-50/50 border border-transparent hover:border-orange-100 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-sm font-black text-orange-500">{i + 1}</span>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-orange-600 transition-colors">
                      #{topic.name}
                    </h3>
                    <p className="text-xs text-slate-400">{topic.description || 'Trending discussion'}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  {(topic.posts_count / 1000).toFixed(1)}k posts
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* COMMUNITIES TAB */}
      {activeTab === 'communities' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {communities.map((comm) => {
            const isJoining = joiningSlug === comm.slug;
            return (
              <div
                key={comm.id || comm.slug}
                onClick={() => navigate(`/home?topic=${comm.topic_slug || 'AICoding'}`)}
                className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-soft flex flex-col justify-between space-y-4 hover:shadow-card hover:border-orange-200 transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg flex-shrink-0 group-hover:scale-105 transition-transform">
                    {comm.icon || '💬'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-orange-600 transition-colors">
                      {comm.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      {comm.members_count.toLocaleString()} members
                    </p>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-2">
                      {comm.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-semibold text-orange-600 group-hover:underline">
                    View complaints &rarr;
                  </span>
                  <button
                    type="button"
                    disabled={isJoining}
                    onClick={(e) => handleJoinToggle(comm, e)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      comm.is_joined
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                        : 'bg-orange-500 hover:bg-orange-600 text-white shadow-xs'
                    }`}
                  >
                    {isJoining ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : comm.is_joined ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Joined</span>
                      </>
                    ) : (
                      <span>Join Community</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
