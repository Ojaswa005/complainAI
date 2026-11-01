import React, { useState, useRef } from 'react';
import { X, Upload, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useModal } from '../../context/ModalContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export const EditProfileModal: React.FC = () => {
  const { isEditProfileModalOpen, closeEditProfileModal, showToast } = useModal();
  const { currentUser, refreshUser } = useAuth();

  const [displayName, setDisplayName] = useState(currentUser?.display_name || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [website, setWebsite] = useState(currentUser?.website || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar_url || '');
  const [bannerUrl, setBannerUrl] = useState(currentUser?.banner_url || '');

  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bannerFileRef = useRef<HTMLInputElement>(null);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  if (!isEditProfileModalOpen || !currentUser) return null;

  const handleBannerFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      showToast('Invalid format. Banner must be JPEG, PNG, or WebP.', 'error');
      if (e.target) e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Banner exceeds maximum limit of 5 MB.', 'error');
      if (e.target) e.target.value = '';
      return;
    }

    setUploadingBanner(true);
    try {
      const res = await api.uploadImage(file, 'banner');
      setBannerUrl(res.url);
      showToast('Banner image uploaded! 🖼️', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload banner', 'error');
    } finally {
      setUploadingBanner(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      showToast('Invalid format. Avatar must be JPEG, PNG, or WebP.', 'error');
      if (e.target) e.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast('Avatar exceeds maximum limit of 2 MB.', 'error');
      if (e.target) e.target.value = '';
      return;
    }

    setUploadingAvatar(true);
    try {
      const res = await api.uploadImage(file, 'avatar');
      setAvatarUrl(res.url);
      showToast('Avatar image uploaded! 👤', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload avatar', 'error');
    } finally {
      setUploadingAvatar(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.updateProfile({
        display_name: displayName.trim(),
        bio: bio.trim(),
        website: website.trim() || undefined,
        avatar_url: avatarUrl.trim() || undefined,
        banner_url: bannerUrl.trim() || '',
      });
      await refreshUser();
      showToast('Profile updated successfully! ✨', 'success');
      closeEditProfileModal();
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
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
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Edit Profile</h2>
          <button
            onClick={closeEditProfileModal}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Banner Section */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              Profile Banner (max 5 MB, JPEG/PNG/WebP)
            </label>
            <div 
              className="h-28 rounded-2xl overflow-hidden relative border border-slate-200 flex items-center justify-center bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950"
              style={{
                backgroundImage: bannerUrl ? `url("${bannerUrl}")` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
              <div className="relative z-10 flex items-center gap-2">
                <input
                  type="file"
                  ref={bannerFileRef}
                  onChange={handleBannerFileSelect}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={uploadingBanner}
                  onClick={() => bannerFileRef.current?.click()}
                  className="px-3 py-1.5 bg-white/90 hover:bg-white text-slate-800 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {uploadingBanner ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 text-orange-600" />
                  )}
                  <span>{bannerUrl ? 'Change Banner' : 'Upload Banner'}</span>
                </button>

                {bannerUrl && (
                  <button
                    type="button"
                    onClick={() => setBannerUrl('')}
                    className="p-1.5 bg-red-600/90 hover:bg-red-600 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                    title="Remove banner"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <input
              type="url"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              placeholder="Or enter direct banner image URL (https://...)"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-orange-500 outline-none"
            />
          </div>

          {/* Avatar Section */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              Profile Avatar (max 2 MB)
            </label>
            <div className="flex items-center gap-3">
              <img
                src={avatarUrl || currentUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.username}`}
                alt="Avatar preview"
                className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100 flex-shrink-0"
              />
              <input
                type="file"
                ref={avatarFileRef}
                onChange={handleAvatarFileSelect}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
              />
              <button
                type="button"
                disabled={uploadingAvatar}
                onClick={() => avatarFileRef.current?.click()}
                className="px-3 py-1.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {uploadingAvatar ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5 text-orange-600" />
                )}
                <span>Upload PC Avatar</span>
              </button>
            </div>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="Or paste avatar URL (https://...)"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-orange-500 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Display Name</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-orange-500 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={200}
              placeholder="What are your thoughts on AI?"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-orange-500 outline-none resize-none"
            />
            <span className="text-[10px] text-slate-400 block text-right">{bio.length}/200</span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Website or Link</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://github.com/..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-orange-500 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={closeEditProfileModal}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || uploadingBanner || uploadingAvatar}
              className="px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-xs font-bold rounded-full shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
