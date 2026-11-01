import React, { createContext, useContext, useState } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => Promise<void> | void;
}

interface FollowListOptions {
  username: string;
  mode: 'followers' | 'following';
}

interface ModalContextType {
  isComplaintModalOpen: boolean;
  complaintModalDraft: { content?: string; mood?: string; tool_tag?: string; topic?: string };
  openComplaintModal: (draft?: { content?: string; mood?: string; tool_tag?: string; topic?: string }) => void;
  closeComplaintModal: () => void;

  isReportModalOpen: boolean;
  reportTargetPostId: string | null;
  openReportModal: (postId: string) => void;
  closeReportModal: () => void;

  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;

  isEditProfileModalOpen: boolean;
  openEditProfileModal: () => void;
  closeEditProfileModal: () => void;

  confirmOptions: ConfirmOptions | null;
  openConfirmModal: (options: ConfirmOptions) => void;
  closeConfirmModal: () => void;

  followListOptions: FollowListOptions | null;
  openFollowListModal: (options: FollowListOptions) => void;
  closeFollowListModal: () => void;

  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [complaintModalDraft, setComplaintModalDraft] = useState<{ content?: string; mood?: string; tool_tag?: string; topic?: string }>({});

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportTargetPostId, setReportTargetPostId] = useState<string | null>(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions | null>(null);
  const [followListOptions, setFollowListOptions] = useState<FollowListOptions | null>(null);

  const [toasts, setToasts] = useState<Toast[]>([]);

  const openComplaintModal = (draft = {}) => {
    setComplaintModalDraft(draft);
    setIsComplaintModalOpen(true);
  };

  const closeComplaintModal = () => {
    setIsComplaintModalOpen(false);
  };

  const openReportModal = (postId: string) => {
    setReportTargetPostId(postId);
    setIsReportModalOpen(true);
  };

  const closeReportModal = () => {
    setIsReportModalOpen(false);
    setReportTargetPostId(null);
  };

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const openEditProfileModal = () => setIsEditProfileModalOpen(true);
  const closeEditProfileModal = () => setIsEditProfileModalOpen(false);

  const openConfirmModal = (options: ConfirmOptions) => {
    setConfirmOptions(options);
  };

  const closeConfirmModal = () => {
    setConfirmOptions(null);
  };

  const openFollowListModal = (options: FollowListOptions) => {
    setFollowListOptions(options);
  };

  const closeFollowListModal = () => {
    setFollowListOptions(null);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ModalContext.Provider
      value={{
        isComplaintModalOpen,
        complaintModalDraft,
        openComplaintModal,
        closeComplaintModal,
        isReportModalOpen,
        reportTargetPostId,
        openReportModal,
        closeReportModal,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        isEditProfileModalOpen,
        openEditProfileModal,
        closeEditProfileModal,
        confirmOptions,
        openConfirmModal,
        closeConfirmModal,
        followListOptions,
        openFollowListModal,
        closeFollowListModal,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
