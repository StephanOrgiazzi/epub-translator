import React from 'react';
import { useEpubTranslator } from '../hooks/useEpubTranslator';

export const languages = {
  fr: { name: 'French', flag: '🇫🇷' },
  nl: { name: 'Dutch', flag: '🇳🇱' },
  de: { name: 'German', flag: '🇩🇪' },
  it: { name: 'Italian', flag: '🇮🇹' },
  pl: { name: 'Polish', flag: '🇵🇱' },
  pt_br: { name: 'Portuguese (Brazilian)', flag: '🇧🇷' },
  pt_pt: { name: 'Portuguese (European)', flag: '🇵🇹' },
  ro: { name: 'Romanian', flag: '🇷🇴' },
  es: { name: 'Spanish', flag: '🇪🇸' },
  sv: { name: 'Swedish', flag: '🇸🇪' }
} as const;

export type TargetLanguage = keyof typeof languages;

interface EpubUploaderProps {
  onUpload?: (file: File) => void;
}

export const EpubUploader: React.FC<EpubUploaderProps> = ({ onUpload }) => {
  const [targetLanguage, setTargetLanguage] = React.useState<TargetLanguage>('fr');
  
  const {
    isLoading,
    error,
    dragActive,
    translationProgress,
    selectedFile,
    handleDrag,
    handleDrop,
    handleChange,
    startTranslation,
  } = useEpubTranslator({ onUpload, targetLanguage });

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[400px] p-4">
      <div className="w-full max-w-xl mb-6">
        <label htmlFor="language" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
          Select Target Language
        </label>
        <select
          id="language"
          className="block w-full px-4 py-3 text-base rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors duration-200"
          value={targetLanguage}
          onChange={(e) => setTargetLanguage(e.target.value as TargetLanguage)}
          disabled={isLoading}
        >
          {Object.entries(languages).map(([code, { name, flag }]) => (
            <option key={code} value={code} className="py-2">
              {flag} {name}
            </option>
          ))}
        </select>
      </div>

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
          disabled={isLoading}
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
          <div className="flex text-sm text-gray-600 dark:text-gray-400">
            <label className="relative cursor-pointer rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
              <span>Upload a file</span>
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">EPUB files only</p>
        </div>
      </form>

      {selectedFile && !isLoading && (
        <div className="mt-6 w-full max-w-xl">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-700 dark:text-gray-300 font-medium">{selectedFile.name}</span>
            </div>
          </div>
          <button
            onClick={startTranslation}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors duration-200 flex items-center justify-center space-x-2"
            type="button"
          >
            <span>Start Translation to {languages[targetLanguage].flag} {languages[targetLanguage].name}</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      )}

      {isLoading && (
        <div className="mt-4 w-full max-w-xl">
          <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <span>Translating to {languages[targetLanguage].flag} {languages[targetLanguage].name}...</span>
            <span>{Math.round(translationProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${translationProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  );
};
