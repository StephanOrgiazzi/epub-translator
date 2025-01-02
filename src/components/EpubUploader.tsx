import React, { useState } from 'react';
import { useEpubTranslator } from '../hooks/useEpubTranslator';
import { languages, TargetLanguage } from '../types/languages';
import { CancelModal } from './CancelModal';

interface EpubUploaderProps {
  targetLanguage?: TargetLanguage;
}

export const EpubUploader: React.FC<EpubUploaderProps> = ({ targetLanguage: initialLanguage = 'fr' }) => {
  const [targetLanguage, setTargetLanguage] = useState<TargetLanguage>(initialLanguage);
  
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
    handleCancel,
    showCancelModal,
    setShowCancelModal,
  } = useEpubTranslator({ targetLanguage });

  return (
    <div className="h-full bg-gradient-to-b from-teal-950 via-black-950 to-black-950 flex items-center justify-center overflow-hidden">

      <div className="w-full max-w-2xl mx-4 relative">
        {/* Background blur circles for visual interest */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-emerald-700 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob"></div>
        <div className="absolute top-60 -right-20 w-72 h-72 bg-teal-800 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob [animation-delay:2s]"></div>


        {/* Main container with glassmorphism effect */}
        <div className="relative backdrop-blur-lg bg-white/10 p-6 sm:p-8 rounded-2xl shadow-2xl border border-white/20 min-h-[400px] flex flex-col">
          <div className="space-y-6 flex-grow">
            {/* Header */}
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-white drop-shadow-lg">EPUB Translator</h2>
              <p className="text-white/80 drop-shadow-md">Translate your EPUB books with ease</p>
            </div>

            {/* Language Selector */}
            <div className="space-y-2">
              <label className="block text-white text-sm font-medium mb-1 drop-shadow-md">
                Select Target Language
              </label>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value as TargetLanguage)}
                disabled={isLoading}
                className="w-full px-4 py-2.5 rounded-xl bg-black/30 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 transition-all duration-300"
              >
                {Object.entries(languages).map(([code, { name, flag }]) => (
                  <option key={code} value={code} className="bg-gray-900 text-white">
                    {flag} {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Upload Area */}
            <div
              className={`relative group ${
                dragActive
                  ? 'border-blue-400 bg-blue-50/20'
                  : 'border-gray-300/50 hover:border-blue-300/50 bg-white/10'
              } border-2 border-dashed rounded-xl transition-all duration-300 ease-in-out p-4 sm:p-8`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={handleChange}
                accept=".epub"
                disabled={isLoading}
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
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium text-white drop-shadow-md">
                    {selectedFile ? selectedFile.name : 'Drop your EPUB file here'}
                  </p>
                  <p className="text-sm text-white/70 drop-shadow-sm">
                    or click to select a file
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-lg bg-red-500/20 backdrop-blur-sm border border-red-500/30">
                <p className="text-red-100">{error}</p>
              </div>
            )}

            {/* Translation Progress */}
            {isLoading && (
              <div className="space-y-3">
                <div className="flex items-center text-white drop-shadow-md">
                  <span>Translating to {languages[targetLanguage].name}... ({translationProgress}%)</span>
                </div>
                <div className="relative">
                  <div className="relative h-2 bg-white/10 rounded-full overflow-hidden mr-10">
                    <div
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300 ease-out rounded-full"
                      style={{ width: `${Math.min(translationProgress, 100)}%` }}
                    />
                  </div>
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="absolute -right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all duration-300 border border-white/30 z-10"
                    title="Cancel translation"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Start Translation Button */}
            {selectedFile && !isLoading && (
              <button
                onClick={startTranslation}
                className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
              >
                Translate to {languages[targetLanguage].flag} {languages[targetLanguage].name}
              </button>
            )}

            {/* Success Message */}
            {translationProgress === 100 && !isLoading && (
              <div className="p-4 rounded-lg bg-green-500/20 backdrop-blur-sm border border-green-500/30">
                <p className="text-green-100 drop-shadow-md">
                  Translation complete! EPUB succesfully downloaded.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      <CancelModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
      />
    </div>
  );
};
