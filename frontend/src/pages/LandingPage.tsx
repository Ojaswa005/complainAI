import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  Bot, 
  MessageSquare, 
  ShieldAlert, 
  Flame, 
  Zap,
  CheckCircle2,
  Users,
  Compass
} from 'lucide-react';
import { useModal } from '../context/ModalContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Complaint } from '../types';
import { ComplaintCard } from '../components/feed/ComplaintCard';

export const LandingPage: React.FC = () => {
  const { openComplaintModal, openAuthModal } = useModal();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [sampleComplaints, setSampleComplaints] = useState<Complaint[]>([]);

  useEffect(() => {
    const fetchTopComplaints = async () => {
      try {
        const res = await api.getPosts({ feed_type: 'trending', limit: 3 });
        setSampleComplaints(res.posts);
      } catch (err) {
        console.error('Failed to load sample complaints', err);
      }
    };
    fetchTopComplaints();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-16 lg:pb-28">
        
        {/* Soft Background Accents */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-orange-200/30 via-purple-100/30 to-amber-100/40 blur-3xl -z-10 rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Headline, Copy & CTAs */}
            <div className="lg:col-span-7 space-y-6 text-left">
              
              {/* Eyebrow Pill */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200/80 shadow-xs text-xs font-semibold text-slate-700">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                <span>Share | Laugh | Learn | Improve AI together</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.12]">
                Got a complaint <br />
                about <span className="text-orange-500">AI?</span>
              </h1>

              {/* Supporting Copy */}
              <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
                You're not alone. Share your AI frustrations, see what others are facing, laugh, learn, and turn complaints into conversations that actually matter.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => {
                    if (currentUser) {
                      openComplaintModal();
                    } else {
                      navigate('/home');
                    }
                  }}
                  className="px-7 py-3.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-extrabold text-sm sm:text-base rounded-full shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 active:scale-95 transition-all flex items-center gap-2"
                >
                  <span>Share a Complaint</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <Link
                  to="/home"
                  className="px-7 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm sm:text-base rounded-full border border-slate-200/90 shadow-xs hover:shadow-sm active:scale-95 transition-all flex items-center gap-2"
                >
                  <Compass className="w-4 h-4 text-orange-500" />
                  <span>Explore Feed</span>
                </Link>
              </div>

            </div>

            {/* Right Column: 3D Robot Mascot & Floating Speech Bubbles (Exact Mockup Match) */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              
              {/* Mascot Container */}
              <div className="relative w-80 h-80 sm:w-96 sm:h-96 flex items-center justify-center">
                
                {/* 3D Mascot Image */}
                <div className="relative z-10 w-64 h-64 sm:w-80 sm:h-80 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/80 bg-gradient-to-b from-purple-50 to-orange-50">
                  <img
                    src="/robot_mascot.jpg"
                    alt="Complain AI Robot Mascot holding 'Roasted my code again...'"
                    className="w-full h-full object-cover select-none pointer-events-none"
                  />
                </div>

                {/* Floating Speech Bubble 1: "Took my job? 🙀" (Top Left, Yellow/Peach) */}
                <div className="absolute -top-3 left-0 z-20 bg-amber-50 border border-amber-200/80 px-3.5 py-1.5 rounded-2xl shadow-elevated text-xs font-bold text-amber-900 animate-float-1 flex items-center gap-1.5 whitespace-nowrap">
                  <span>Took my job? 🙀</span>
                </div>

                {/* Floating Speech Bubble 2: "Gave wrong answer 🤖" (Top Right, Lavender) */}
                <div className="absolute top-2 -right-4 z-20 bg-purple-50 border border-purple-200/80 px-3.5 py-1.5 rounded-2xl shadow-elevated text-xs font-bold text-purple-900 animate-float-2 flex items-center gap-1.5 whitespace-nowrap">
                  <span>Gave wrong answer 🤖</span>
                </div>

                {/* Floating Speech Bubble 3: "Still hallucinates? 😵" (Middle Right, Soft Blue) */}
                <div className="absolute top-36 -right-6 z-20 bg-blue-50 border border-blue-200/80 px-3.5 py-1.5 rounded-2xl shadow-elevated text-xs font-bold text-blue-900 animate-float-3 flex items-center gap-1.5 whitespace-nowrap">
                  <span>Still hallucinates? 😵</span>
                </div>

                {/* Floating Speech Bubble 4: "Why is it so confident??" (Bottom Right, Soft Pink) */}
                <div className="absolute -bottom-4 right-2 z-20 bg-rose-50 border border-rose-200/80 px-3.5 py-1.5 rounded-2xl shadow-elevated text-xs font-bold text-rose-900 animate-float-4 flex items-center gap-1.5 whitespace-nowrap">
                  <span>Why is it so confident?? 🤨</span>
                </div>

                {/* Floating Speech Bubble 5: "Rewrote my entire project 🤬" (Bottom Left, Soft Red) */}
                <div className="absolute bottom-6 -left-8 z-20 bg-red-50 border border-red-200/80 px-3.5 py-1.5 rounded-2xl shadow-elevated text-xs font-bold text-red-900 animate-float-5 flex items-center gap-1.5 whitespace-nowrap">
                  <span>Rewrote my entire project 🤬</span>
                </div>

              </div>

            </div>

          </div>

          {/* Stats Bar (Exact Mockup Match) */}
          <div className="mt-16 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-soft">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-slate-100">
              <div className="pt-2 md:pt-0">
                <p className="text-3xl sm:text-4xl font-black text-slate-900">25K+</p>
                <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">Complaints shared</p>
              </div>

              <div className="pt-4 md:pt-0">
                <p className="text-3xl sm:text-4xl font-black text-slate-900">10K+</p>
                <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">Active members</p>
              </div>

              <div className="pt-4 md:pt-0">
                <p className="text-3xl sm:text-4xl font-black text-slate-900">50+</p>
                <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">AI tools discussed</p>
              </div>

              <div className="pt-4 md:pt-0">
                <p className="text-3xl sm:text-4xl font-black text-slate-900">100+</p>
                <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">Trending topics</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SAMPLE COMPLAINTS SECTION */}
      {sampleComplaints.length > 0 && (
        <section className="py-16 bg-white border-t border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
              <div>
                <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">Community Feed</span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                  Latest AI callouts from the trenches
                </h2>
              </div>
              <Link
                to="/home"
                className="text-sm font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 group"
              >
                <span>View all complaints</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {sampleComplaints.map((item) => (
                <ComplaintCard key={item.id} complaint={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* WHY COMPLAIN AI SECTION */}
      <section id="about" className="py-20 bg-[#F8FAFC] border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">The Mission</span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2 max-w-2xl mx-auto">
            Why Complain AI exists
          </h2>
          <p className="text-slate-600 max-w-xl mx-auto mt-3 text-sm sm:text-base">
            Every tech giant promises flawless intelligence. We provide the public watercooler where reality checks happen.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 text-left">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg mb-4">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Track Real Hallucinations</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Benchmark bugs, phantom citations, broken libraries, and confident blunders across ChatGPT, Claude, Copilot, and Gemini.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-lg mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">AI Rant Assistant</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Use our built-in GenAI assistant to turn raw frustration into sharp sarcasm, comedic roasts, or corporate post-mortems.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Cope & Connect</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Find other developers, designers, and students dealing with the exact same AI failures. Laugh together instead of screaming alone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            Ready to call out your AI?
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Join thousands of developers, researchers, and creators holding artificial intelligence to a higher standard.
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                if (currentUser) {
                  openComplaintModal();
                } else {
                  openAuthModal('register');
                }
              }}
              className="px-8 py-4 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-extrabold text-base rounded-full shadow-lg shadow-orange-500/30 active:scale-95 transition-all inline-flex items-center gap-2"
            >
              <span>Join & Share Your Story</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 bg-slate-950 text-slate-500 text-xs text-center border-t border-slate-800">
        <p>© 2026 Complain AI. The social network where AI gets called out.</p>
      </footer>

    </div>
  );
};
