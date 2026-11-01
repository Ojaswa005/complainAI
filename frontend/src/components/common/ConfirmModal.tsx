import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useModal } from '../../context/ModalContext';

export const ConfirmModal: React.FC = () => {
  const { confirmOptions, closeConfirmModal } = useModal();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!confirmOptions) return null;

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await confirmOptions.onConfirm();
      closeConfirmModal();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center space-y-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto shadow-sm ${
            confirmOptions.isDestructive ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-orange-50 text-orange-600 border border-orange-100'
          }`}>
            {confirmOptions.isDestructive ? (
              <Trash2 className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>

          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              {confirmOptions.title}
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {confirmOptions.message}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={closeConfirmModal}
              className="flex-1 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-full border border-slate-200 transition-colors"
            >
              {confirmOptions.cancelLabel || 'Cancel'}
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleConfirm}
              className={`flex-1 py-2.5 text-xs font-bold text-white rounded-full shadow-sm active:scale-95 transition-all ${
                confirmOptions.isDestructive
                  ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
                  : 'bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300'
              }`}
            >
              {isProcessing ? 'Processing...' : confirmOptions.confirmLabel || 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
