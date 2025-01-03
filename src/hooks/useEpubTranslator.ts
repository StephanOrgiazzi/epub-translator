import { useState, useRef } from 'react';
import { TargetLanguage } from '../types/languages';
import { processEpubFile, translationCache } from '../utils/translationProcessor';

interface UseEpubTranslatorProps {
  onUpload?: (file: File) => void;
  targetLanguage: TargetLanguage;
}

export const useEpubTranslator = ({ onUpload, targetLanguage }: UseEpubTranslatorProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const isCancelled = useRef(false);

  // Ensure progress never decreases during translation
  const updateProgress = (newProgress: number) => {
    if (!isCancelled.current) {
      setTranslationProgress(prev => Math.max(prev, Math.round(newProgress)));
    }
  };

  const resetState = () => {
    isCancelled.current = false;
    setIsLoading(true);
    setError(null);
    setTranslationProgress(0);
  };

  const startTranslation = async () => {
    if (selectedFile) {
      resetState();
      await processEpubFile(
        selectedFile,
        targetLanguage,
        translationCache,
        isCancelled,
        {
          updateProgress,
          setError,
          setIsLoading,
          setSelectedFile
        }
      );
    }
  };

  const handleCancel = () => {
    isCancelled.current = true;
    setShowCancelModal(false);
    setIsLoading(false);
    setSelectedFile(null);
    setError(null);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/epub+zip') {
        setSelectedFile(file);
        if (onUpload) onUpload(file);
      } else {
        setError('Please upload an EPUB file');
      }
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/epub+zip') {
        setSelectedFile(file);
        if (onUpload) onUpload(file);
      } else {
        setError('Please upload an EPUB file');
      }
    }
  };

  return {
    isLoading,
    error,
    dragActive,
    translationProgress,
    selectedFile,
    showCancelModal,
    setShowCancelModal,
    handleCancel,
    handleDrag,
    handleDrop,
    handleChange,
    startTranslation,
  };
};
