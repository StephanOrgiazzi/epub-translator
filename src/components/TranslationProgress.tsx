'use client'

interface TranslationProgressProps {
  progress: number;
  isLoading: boolean;
  onCancel: () => void;
}

export function TranslationProgress({ progress, isLoading, onCancel }: TranslationProgressProps) {
  if (!isLoading) return null;

  return (
    <div className="space-y-4">
      <div className="relative w-full h-2 bg-gray-700/30 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/70">{Math.round(progress)}% complete</span>
        <button
          onClick={onCancel}
          className="text-white/70 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
