import React, { useState, useRef } from 'react';
import { 
  X, 
  Repeat, 
  Image as ImageIcon, 
  Upload, 
  Link as LinkIcon, 
  Smile, 
  Loader2,
  Sparkles 
} from 'lucide-react';
import { useModal } from '../../context/ModalContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Complaint } from '../../types';
import { getMediaUrl } from '../../utils/image';

interface QuoteRepostModalProps {
  onCreated?: (newPost: Complaint) => void;
}

const MOODS = ['Sarcastic', 'Frustrated', 'Mindblown', 'Funny', 'Exhausted', 'Venting'];

export const QuoteRepostModal: React.FC<QuoteRepostModalProps> = ({ onCreated }) => {
  const { isQuoteModalOpen, quoteTargetPost, closeQuoteModal, showToast } = useModal();
  const { currentUser } = useAuth();

  const [thoughts, setThoughts] = useState('');
  const [mood, setMood] = useState<string>('Sarcastic');
  const [images, setImages] = useState<string[]>([]);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isQuoteModalOpen || !quoteTargetPost) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (images.length + files.length > 4) {
      showToast('Maximum 4 images allowed', 'error');
      if (e.target) e.target.value = '';
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
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
      showToast('Maximum 4 images allowed', 'error');
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
      showToast('Image attached! 🖼️', 'success');
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
    if (!thoughts.trim()) {
      showToast('Please write some thoughts for your Quote Repost', 'info');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await api.createPost({
        content: thoughts.trim(),
        mood: mood || undefined,
        tool_tag: quoteTargetPost.tool_tag || undefined,
        images: images,
        image_url: images.length > 0 ? images[0] : undefined,
        repost_of_id: quoteTargetPost.id,
      });

      showToast('Quote Repost published! 🔁', 'success');
      setThoughts('');
      setImages([]);
      closeQuoteModal();
      if (onCreated) {
        onCreated(created);
      } else {
        // Soft refresh feed
        window.dispatchEvent(new CustomEvent('complain_created', { detail: created }));
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to submit quote repost', 'error');
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
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Repeat className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Quote Complaint</h2>
              <p className="text-[11px] text-slate-400">Add your own commentary and images</p>
            </div>
          </div>
          <button
            onClick={closeQuoteModal}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Thoughts Input */}
          <div className="space-y-1">
            <textarea
              value={thoughts}
              onChange={(e) => setThoughts(e.target.value)}
              placeholder="Add your thoughts... What's your take on this?"
              rows={3}
              maxLength={1000}
              className="w-full text-sm text-slate-900 placeholder-slate-400 border-none outline-none resize-none focus:ring-0 leading-relaxed bg-transparent"
              autoFocus
            />
            <div className="text-right text-[11px] text-slate-400">
              {thoughts.length}/1000
            </div>
          </div>

          {/* Attached Images Preview */}
          {images.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs text-slate-500 font-medium">
                Attached Images ({images.length}/4)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden aspect-square border border-slate-200 bg-slate-100">
                    <img 
                      src={getMediaUrl(img)} 
                      alt={`Attached ${idx + 1}`} 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-600 text-white rounded-full transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quoted Complaint Preview Card */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2">
            <div className="flex items-center gap-2">
              <img
                src={getMediaUrl(quoteTargetPost.author.avatar_url) || `https://api.dicebear.com/7.x/bottts/svg?seed=${quoteTargetPost.author.username}`}
                alt={quoteTargetPost.author.display_name}
                className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200"
              />
              <span className="font-bold text-xs text-slate-900">
                {quoteTargetPost.author.display_name}
              </span>
              <span className="text-[11px] text-slate-400">
                @{quoteTargetPost.author.username}
              </span>
              {quoteTargetPost.tool_tag && (
                <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700">
                  {quoteTargetPost.tool_tag}
                </span>
              )}
            </div>
            
            <p className="text-xs text-slate-700 leading-relaxed line-clamp-3 whitespace-pre-line">
              {quoteTargetPost.content}
            </p>

            {/* Quoted Image preview */}
            {quoteTargetPost.image_url && (
              <div className="rounded-xl overflow-hidden max-h-36 border border-slate-200/80 bg-slate-100">
                <img
                  src={getMediaUrl(quoteTargetPost.image_url)}
                  alt="Quoted media"
                  className="w-full h-auto max-h-36 object-cover"
                />
              </div>
            )}
          </div>

          {/* Quick Toolbar: Upload PC, URL, Mood */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            
            {showUrlInput && (
              <div className="flex gap-2 animate-in fade-in duration-150">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Paste direct image URL (https://...)"
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-orange-500 outline-none"
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
                  className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Add
                </button>
              </div>
            )}

            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                />
                
                {/* Upload PC */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImages || images.length >= 4}
                  className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Upload image from PC (max 5MB)"
                >
                  {uploadingImages ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 text-orange-500" />
                  )}
                  <span>Upload PC</span>
                </button>

                {/* Paste URL */}
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  disabled={uploadingImages || images.length >= 4}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    showUrlInput ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                  title="Attach direct image URL"
                >
                  <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>URL</span>
                </button>
              </div>

              {/* Mood selector */}
              <div className="flex items-center gap-1">
                <Smile className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 outline-none font-medium"
                >
                  {MOODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={closeQuoteModal}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || uploadingImages || !thoughts.trim()}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 text-white text-xs font-bold rounded-full shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <Repeat className="w-3.5 h-3.5" />
                  <span>Quote Repost</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
