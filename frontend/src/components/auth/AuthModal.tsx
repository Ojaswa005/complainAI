import React, { useState } from 'react';
import { X, Bot, Sparkles, ArrowRight, UserCheck } from 'lucide-react';
import { useModal } from '../../context/ModalContext';
import { useAuth } from '../../context/AuthContext';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, authModalMode, openAuthModal, showToast } = useModal();
  const { login, register, switchDemoUser, demoUsers } = useAuth();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const isLogin = authModalMode === 'login';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(username || email, password);
        showToast('Welcome back to Complain AI! 🎉', 'success');
      } else {
        await register({
          username: username.trim(),
          display_name: displayName.trim() || username.trim(),
          email: email.trim(),
        });
        showToast('Account created successfully! 🚀', 'success');
      }
      closeAuthModal();
    } catch (err: any) {
      showToast(err.message || 'Authentication failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async (handle: string) => {
    setIsLoading(true);
    try {
      await switchDemoUser(handle);
      showToast(`Logged in as @${handle} ✨`, 'success');
      closeAuthModal();
    } catch {
      showToast('Failed to switch demo account', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-6 text-center border-b border-slate-100 bg-gradient-to-b from-orange-50/50 to-white">
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white mx-auto shadow-md shadow-orange-500/20 mb-3">
            <Bot className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-extrabold text-slate-900">
            {isLogin ? 'Welcome back' : 'Join Complain AI'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isLogin 
              ? 'Call out AI hallucinations and share your coping stories.' 
              : 'Create an account and start calling out artificial intelligence.'}
          </p>
        </div>

        {/* Instant Demo User Selection - Great for Fast Reviewer Testing */}
        <div className="px-6 pt-4 pb-2 bg-slate-50 border-b border-slate-100">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Instant Demo Logins</span>
            <Sparkles className="w-3 h-3 text-amber-500" />
          </p>
          <div className="grid grid-cols-2 gap-2">
            {demoUsers.slice(0, 4).map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => handleQuickDemoLogin(d.username)}
                className="flex items-center gap-2 p-2 bg-white hover:bg-orange-50 hover:border-orange-200 border border-slate-200/80 rounded-xl text-left transition-all group"
              >
                <img
                  src={d.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${d.username}`}
                  alt={d.username}
                  className="w-6 h-6 rounded-full object-cover"
                />
                <span className="text-xs font-semibold text-slate-700 group-hover:text-orange-600 truncate">
                  @{d.username}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">
              Username {isLogin && 'or Email'}
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={isLogin ? 'dev_survivor' : 'username'}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-orange-500 outline-none transition-all"
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Display Name</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Dev Survivor"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-orange-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-orange-500 outline-none transition-all"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-orange-500 outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold text-xs rounded-full shadow-md shadow-orange-500/20 active:scale-95 transition-all mt-2"
          >
            {isLoading ? 'Processing...' : isLogin ? 'Log In' : 'Sign Up'}
          </button>

          <div className="text-center pt-2">
            {isLogin ? (
              <p className="text-xs text-slate-500">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => openAuthModal('register')}
                  className="font-bold text-orange-600 hover:underline"
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="font-bold text-orange-600 hover:underline"
                >
                  Log in
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
