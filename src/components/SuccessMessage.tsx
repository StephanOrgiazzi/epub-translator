'use client'

interface SuccessMessageProps {
  show: boolean;
}

export function SuccessMessage({ show }: SuccessMessageProps) {
  if (!show) return null;

  return (
    <div className="p-4 rounded-lg bg-green-500/20 backdrop-blur-sm border border-green-500/30">
      <p className="text-green-100 drop-shadow-md">
        Translation complete! EPUB successfully downloaded.
      </p>
    </div>
  );
}
