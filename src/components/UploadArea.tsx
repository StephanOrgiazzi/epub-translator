'use client'

import { truncateFilename } from '../utils/fileUtils';

interface UploadAreaProps {
  dragActive: boolean;
  isLoading: boolean;
  selectedFile: File | null;
  onDrag: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function UploadArea({
  dragActive,
  isLoading,
  selectedFile,
  onDrag,
  onDrop,
  onChange,
}: UploadAreaProps) {
  return (
    <div
      className={`relative group ${
        dragActive
          ? 'border-blue-400 bg-blue-50/10'
          : 'border-gray-300/30 hover:border-blue-300/30 bg-white/5'
      } border-2 border-dashed rounded-xl transition-all duration-300 ease-in-out p-4 sm:p-8`}
      onDragEnter={onDrag}
      onDragLeave={onDrag}
      onDragOver={onDrag}
      onDrop={onDrop}
    >
      <input
        type="file"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        onChange={onChange}
        accept=".epub"
        disabled={isLoading}
        aria-label="Choose EPUB file to translate"
        aria-describedby="file-upload-description"
      />
      
      <div className="p-8 text-center">
        <div className="mb-4">
          <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / 0.4))' }}
              aria-label="Upload icon"
              role="img"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                aria-hidden="true"
              />
            </svg>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-lg font-medium text-white drop-shadow-md" role="status">
            {selectedFile ? truncateFilename(selectedFile.name) : 'Drop your EPUB file here'}
          </p>
          <p className="text-sm text-white/70 drop-shadow-sm" id="file-upload-description">
            or click to select a file
          </p>
        </div>
      </div>
    </div>
  );
}
