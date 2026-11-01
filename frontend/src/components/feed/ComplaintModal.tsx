import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  Image as ImageIcon, 
  Tag, 
  Smile, 
  Check, 
  RefreshCw, 
  Wand2, 
  AlertCircle,
  Hash,
  Upload,
  Link as LinkIcon,
  Loader2
} from 'lucide-react';
import { useModal } from '../../context/ModalContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Complaint } from '../../types';

interface ComplaintModalProps {
  onCreated?: (post: Complaint) => void;
}

export const ComplaintModal: React.FC<ComplaintModalProps> = ({ onCreated }) => {
  const { isComplaintModalOpen, closeComplaintModal, complaintModalDraft, showToast, openAuthModal } = useModal();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'write' | 'ai'>('write');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<string>('Frustrated');
  const [toolTag, setToolTag] = useState<string>('ChatGPT');
  const [images, setImages] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState<string>('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [topics, setTopics] = useState<string[]>(['AICoding']);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Rant Assistant states
  const [aiMode, setAiMode] = useState<string>('sarcastic');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Authentication enforcement
  useEffect(() => {
    if (isComplaintModalOpen && !currentUser) {
      showToast('Please log in to create a post', 'error');
      closeComplaintModal();
      openAuthModal('login');
    }
  }, [isComplaintModalOpen, currentUser]);

  // Sync draft text if opened with initial content
  useEffect(() => {
    if (isComplaintModalOpen) {
      if (complaintModalDraft.content) {
        setContent(complaintModalDraft.content);
      }
      if (complaintModalDraft.mood) {
        setMood(complaintModalDraft.mood);
      }
      if (complaintModalDraft.tool_tag) {
        setToolTag(complaintModalDraft.tool_tag);
      }
      if (complaintModalDraft.topic && !topics.includes(complaintModalDraft.topic)) {
        setTopics([complaintModalDraft.topic]);
      }
    }
  }, [isComplaintModalOpen, complaintModalDraft]);

  if (!isComplaintModalOpen || !currentUser) return null;

  const moods = ['Frustrated', 'Sarcastic', 'Funny', 'Mindblown', 'Tired'];
  const tools = ['ChatGPT', 'Claude', 'Gemini', 'Copilot', 'Midjourney', 'Cursor', 'Other'];
  const availableTopics = ['AICoding', 'JobAnxiety', 'WrongInfo', 'LazyOutputs', 'AIDesign', 'PrivacyConcerns', 'Hallucinations', 'DeveloperLife'];
  const aiModes = [
    { id: 'funny', label: 'Funny' },
    { id: 'sarcastic', label: 'Sarcastic' },
    { id: 'rant', label: 'Rant' },
    { id: 'professional', label: 'Professional' },
    { id: 'short', label: 'Short' },
    { id: 'long', label: 'Long' },
  ];

  const handleImproveWithAI = async (selectedMode = aiMode) => {
    if (!content.trim() || content.trim().length < 5) {
      showToast('Write a brief complaint first so AI can improve it!', 'info');
      return;
    }

    setAiLoading(true);
    setAiSuggestion(null);

    try {
      const res = await api.improveComplaint(content.trim(), selectedMode);
      setAiSuggestion(res.suggestion);
      showToast('AI suggestion ready! ✨', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to get AI improvement', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplySuggestion = () => {
    if (aiSuggestion) {
      setContent(aiSuggestion);
      setAiSuggestion(null);
      showToast('Applied AI suggestion to your complaint!', 'success');
    }
  };

  const toggleTopic = (t: string) => {
    if (topics.includes(t)) {
      setTopics(topics.filter((x) => x !== t));
    } else {
      if (topics.length >= 4) {
        showToast('Maximum 4 topics per complaint', 'info');
        return;
      }
      setTopics([...topics, t]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (images.length + files.length > 4) {
      showToast('Maximum 4 images allowed per post', 'error');
      if (e.target) e.target.value = '';
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    let totalNewSize = 0;
    for (const f of files) {
      if (!allowedTypes.includes(f.type)) {
        showToast(`Invalid format (${f.name}). Allowed: JPEG, PNG, WebP only.`, 'error');
        if (e.target) e.target.value = '';
        return;
      }
      if (f.size > 5 * 1024 * 1024) {
        showToast(`Image ${f.name} exceeds 5 MB limit.`, 'error');
        if (e.target) e.target.value = '';
        return;
      }
      totalNewSize += f.size;
    }
    if (totalNewSize > 15 * 1024 * 1024) {
      showToast('Combined image uploads cannot exceed 15 MB.', 'error');
      if (e.target) e.target.value = '';
      return;
    }

    setUploadingImages(true);
    try {
      const res = await api.uploadImages(files);
      setImages((prev) => [...prev, ...res.urls].slice(0, 4));
      showToast(`Attached ${files.length} image${files.length > 1 ? 's' : ''}! 🖼️`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Image upload failed', 'error');
    } finally {
      setUploadingImages(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleAddImageUrl = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (images.length >= 4) {
      showToast('Maximum 4 images allowed per post', 'error');
      return;
    }
    if (!/^https?:\/\//i.test(trimmed)) {
      showToast('Image URL must start with http:// or https://', 'error');
      return;
    }

    setUploadingImages(true);
    try {
      const validated = await api.validateImageUrl(trimmed);
      setImages((prev) => [...prev, validated.url].slice(0, 4));
      setUrlInput('');
      setShowUrlInput(false);
      showToast('Image URL attached! 🖼️', 'success');
    } catch (err: any) {
      showToast(err.message || 'Invalid or unreachable image URL', 'error');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || content.trim().length < 5) {
      showToast('Complaint must be at least 5 characters', 'info');
      return;
    }

    setIsSubmitting(true);
    try {
      const newPost = await api.createPost({
        content: content.trim(),
        mood,
        tool_tag: toolTag,
        image_url: images.length > 0 ? images[0] : undefined,
        images: images,
        topics,
      });

      showToast('Complaint posted to Complain AI! 🔥', 'success');
      setContent('');
      setImages([]);
      setUrlInput('');
      setAiSuggestion(null);
      closeComplaintModal();
      if (onCreated) onCreated(newPost);
    } catch (err: any) {
      showToast(err.message || 'Failed to submit complaint', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Create Your Complaint</h2>
          <button
            onClick={closeComplaintModal}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls: Write | AI Assist */}
        <div className="flex border-b border-slate-100 px-6">
          <button
            onClick={() => setActiveTab('write')}
            className={`py-2.5 px-4 text-xs font-bold transition-all relative cursor-pointer ${
              activeTab === 'write' ? 'text-orange-500' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            Write
            {activeTab === 'write' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('ai');
              if (!aiSuggestion && content.trim()) {
                handleImproveWithAI();
              }
            }}
            className={`py-2.5 px-4 text-xs font-bold flex items-center gap-1.5 transition-all relative cursor-pointer ${
              activeTab === 'ai' ? 'text-purple-600' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Assist
            {activeTab === 'ai' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />
            )}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Main Textarea */}
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="I asked AI to fix one bug. It rewrote my entire project and introduced five more bugs..."
              rows={4}
              maxLength={500}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition-all resize-none"
            />
            <div className="flex justify-between items-center mt-1 px-1 text-[11px] text-slate-400">
              <span>{content.length < 5 ? 'Minimum 5 characters' : 'Ready to post'}</span>
              <span>{content.length}/500</span>
            </div>
          </div>

          {/* Attached Images Preview Grid */}
          {images.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Attached Images ({images.length}/4)</span>
                <span className="text-[11px] text-slate-400">JPEG, PNG, WebP (max 5MB ea)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden aspect-square border border-slate-200 bg-slate-100">
                    <img 
                      src={img} 
                      alt={`Attached ${idx + 1}`} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/300x300/png?text=Image+Error';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-600 text-white rounded-full transition-colors cursor-pointer"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/50 text-[10px] text-white rounded font-mono">
                      #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Image Input Options (PC Upload / URL Input) */}
          <div className="space-y-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
            />

            {showUrlInput && (
              <div className="flex gap-2 animate-in fade-in duration-150">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Paste direct image URL (https://...)"
                  className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-orange-500 outline-none transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddImageUrl();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  disabled={uploadingImages || !urlInput.trim()}
                  className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          {/* Quick Toolbar: Upload PC, URL, Tag tool, Mood */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              disabled={uploadingImages || images.length >= 4}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50 transition-colors cursor-pointer"
              title="Upload image from PC (max 5MB)"
            >
              {uploadingImages ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
              ) : (
                <Upload className="w-3.5 h-3.5 text-orange-500" />
              )}
              <span>Upload PC</span>
            </button>

            <button
              type="button"
              disabled={uploadingImages || images.length >= 4}
              onClick={() => setShowUrlInput(!showUrlInput)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-colors cursor-pointer ${
                showUrlInput
                  ? 'bg-orange-50 text-orange-600 border-orange-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title="Attach image via Web URL"
            >
              <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Image URL</span>
            </button>

            {/* AI Tool selector */}
            <div className="relative">
              <select
                value={toolTag}
                onChange={(e) => setToolTag(e.target.value)}
                className="appearance-none pl-7 pr-6 py-1.5 text-xs font-medium bg-white text-slate-700 border border-slate-200 rounded-full hover:bg-slate-50 outline-none cursor-pointer"
              >
                {tools.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
            </div>

            {/* Mood selector */}
            <div className="relative">
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="appearance-none pl-7 pr-6 py-1.5 text-xs font-medium bg-white text-slate-700 border border-slate-200 rounded-full hover:bg-slate-50 outline-none cursor-pointer"
              >
                {moods.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <Smile className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
            </div>
          </div>

          {/* Topic Pills Selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Hash className="w-3 h-3" /> Topic tags
            </label>
            <div className="flex flex-wrap gap-1.5">
              {availableTopics.map((t) => {
                const isSelected = topics.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTopic(t)}
                    className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-all ${
                      isSelected
                        ? 'bg-orange-500 text-white shadow-xs font-bold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    #{t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Rant Assistant Box (Exact Mockup Match) */}
          <div className="bg-gradient-to-br from-purple-50/70 via-orange-50/30 to-purple-50/50 rounded-2xl border border-purple-100 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-purple-600" />
                Improve with AI (optional)
              </span>
              {aiLoading && (
                <span className="text-[11px] text-purple-600 font-semibold flex items-center gap-1 animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Rewriting...
                </span>
              )}
            </div>

            {/* Style Mode Selector Buttons */}
            <div className="flex flex-wrap gap-1.5">
              {aiModes.map((mode) => {
                const isActive = aiMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => {
                      setAiMode(mode.id);
                      handleImproveWithAI(mode.id);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-orange-500 text-white shadow-xs scale-102'
                        : 'bg-white text-slate-700 border border-slate-200/80 hover:border-orange-300'
                    }`}
                  >
                    {mode.label}
                  </button>
                );
              })}
            </div>

            {/* Generated Suggestion Card */}
            {aiSuggestion && (
              <div className="bg-white rounded-xl border border-purple-200 p-3.5 shadow-sm space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-700 flex items-center gap-1">
                    <span>✨</span>
                    <span className="capitalize">{aiMode} version</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleImproveWithAI()}
                      className="text-[11px] text-slate-400 hover:text-slate-700 flex items-center gap-1"
                      title="Regenerate"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Retry
                    </button>
                    <button
                      type="button"
                      onClick={handleApplySuggestion}
                      className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs active:scale-95 transition-all"
                    >
                      Use this
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-800 italic leading-relaxed whitespace-pre-line">
                  "{aiSuggestion}"
                </p>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeComplaintModal}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !content.trim() || content.trim().length < 5}
              className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-xs font-bold rounded-full shadow-md shadow-orange-500/20 active:scale-95 transition-all"
            >
              {isSubmitting ? 'Posting...' : 'Post Complaint'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
