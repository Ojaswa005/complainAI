import React, { useState } from 'react';
import { X, Flag, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useModal } from '../../context/ModalContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export const ReportModal: React.FC = () => {
  const { isReportModalOpen, closeReportModal, reportTargetPostId, showToast, openAuthModal } = useModal();
  const { currentUser } = useAuth();
  const [reason, setReason] = useState('spam');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isReportModalOpen || !reportTargetPostId) return null;

  const reasons = [
    { id: 'spam', label: 'Spam, bot, or commercial promotion' },
    { id: 'harassment', label: 'Harassment or targeted hate' },
    { id: 'misinformation', label: 'Harmful AI hallucination or deepfake misinformation' },
    { id: 'hate_speech', label: 'Hate speech or violent threats' },
    { id: 'other', label: 'Other violation' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Please log in to report a complaint', 'error');
      closeReportModal();
      openAuthModal('login');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.reportPost(reportTargetPostId, reason, details.trim() || undefined);
      showToast('Report submitted. Viewable in your profile under Reports.', 'success');
      closeReportModal();
      setDetails('');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit report', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <Flag className="w-4 h-4 text-amber-500" />
            <span>Report Complaint</span>
          </div>
          <button
            onClick={closeReportModal}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-600">
            Help keep Complain AI safe and constructive. Why are you reporting this complaint?
          </p>

          <div className="space-y-2">
            {reasons.map((r) => (
              <label
                key={r.id}
                className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  reason === r.id
                    ? 'border-orange-500 bg-orange-50/50 text-slate-900 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="reportReason"
                  value={r.id}
                  checked={reason === r.id}
                  onChange={(e) => setReason(e.target.value)}
                  className="text-orange-500 focus:ring-orange-400"
                />
                <span>{r.label}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 mb-1 block">
              Additional context (optional)
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide extra details..."
              rows={2}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-orange-500 outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeReportModal}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-xs font-bold rounded-full shadow-sm active:scale-95 transition-all"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
