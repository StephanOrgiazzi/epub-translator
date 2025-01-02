import React from 'react';
import { useEpubTranslator } from '../hooks/useEpubTranslator';

interface EpubUploaderProps {
  onUpload?: (file: File) => void;
}

export const EpubUploader: React.FC<EpubUploaderProps> = ({ onUpload }) => {
  const {
    isLoading,
    error,
    dragActive,
    translationProgress,
    handleDrag,
    handleDrop,
    handleChange,
  } = useEpubTranslator({ onUpload });

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[400px] p-4">
      <form
        className={`relative w-full max-w-xl h-64 ${
          dragActive ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-800'
        } rounded-lg border-2 border-dashed ${
          dragActive ? 'border-blue-400 dark:border-blue-500' : 'border-gray-300 dark:border-gray-600'
        } flex flex-col items-center justify-center p-4 text-center`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept=".epub"
          onChange={handleChange}
        />
        
        <div className="flex flex-col items-center space-y-2">
          <svg
            className={`w-12 h-12 ${dragActive ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M24 32V16m0 0l-8 8m8-8l8 8M6 40h36a2 2 0 002-2V10a2 2 0 00-2-2H6a2 2 0 00-2 2v28a2 2 0 002 2z"
            />
          </svg>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Drag and drop your EPUB file here, or click to select
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Only .epub files are supported
          </p>
        </div>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="mt-4 flex flex-col items-center space-y-2">
          <div className="w-full max-w-xl h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all duration-300"
              style={{ width: `${translationProgress}%` }}
            />
          </div>
          <span className="text-gray-600 dark:text-gray-300">
            Translating your EPUB... ({Math.round(translationProgress)}%)
          </span>
        </div>
      )}
    </div>
  );
};
