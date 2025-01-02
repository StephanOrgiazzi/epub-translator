import React from 'react';

interface CancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const CancelModal: React.FC<CancelModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal with glassmorphism */}
      <div className="relative w-full max-w-md p-6 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl m-4">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white drop-shadow-lg">
            Cancel Translation?
          </h3>
          <p className="text-white/80 drop-shadow-md">
            Are you sure you want to cancel the current translation? This action cannot be undone.
          </p>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all duration-300 border border-white/30 drop-shadow-md"
            >
              Keep Translating
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 rounded-lg bg-red-500/30 hover:bg-red-500/40 text-white backdrop-blur-sm transition-all duration-300 border border-red-500/30 drop-shadow-md"
            >
              Cancel Translation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
