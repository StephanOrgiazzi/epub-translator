'use client'

import React, { useState } from 'react';
import { useEpubTranslator } from '../hooks/useEpubTranslator';
import { TargetLanguage } from '../types/languages';
import { CancelModal } from './CancelModal';
import { LanguageSelector } from './LanguageSelector';
import { UploadArea } from './UploadArea';
import { TranslationProgress } from './TranslationProgress';
import { SuccessMessage } from './SuccessMessage';

interface EpubUploaderProps {
  targetLanguage?: TargetLanguage;
}

export default function EpubUploader({ targetLanguage: initialLanguage = 'fr' }: EpubUploaderProps) {
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
    <div className="space-y-6 flex-grow">
      <CancelModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
      />

      <LanguageSelector
        value={targetLanguage}
        onChange={setTargetLanguage}
        disabled={isLoading}
      />

      <UploadArea
        dragActive={dragActive}
        isLoading={isLoading}
        selectedFile={selectedFile}
        onDrag={handleDrag}
        onDrop={handleDrop}
        onChange={handleChange}
      />

      {error && (
        <p className="text-red-400 text-sm text-center" role="alert">
          {error}
        </p>
      )}

      <TranslationProgress
        progress={translationProgress}
        isLoading={isLoading}
        onCancel={() => setShowCancelModal(true)}
      />

      <SuccessMessage 
        show={translationProgress === 100 && !isLoading} 
      />

      {selectedFile && !isLoading && (
        <button
          onClick={startTranslation}
          className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
          disabled={isLoading}
        >
          Start Translation
        </button>
      )}
    </div>
  );
}
