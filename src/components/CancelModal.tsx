'use client'

interface CancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function CancelModal({ isOpen, onClose, onConfirm }: CancelModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900/90 backdrop-blur-lg border border-white/20 rounded-2xl p-6 max-w-sm w-full shadow-xl">
        <h2 className="text-xl font-bold mb-4 text-white">Cancel Translation?</h2>
        <p className="mb-6 text-white/80">Are you sure you want to cancel the current translation?</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-white/70 hover:text-white transition-colors"
          >
            No, continue
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-colors"
          >
            Yes, cancel
          </button>
        </div>
      </div>
    </div>
  );
}
