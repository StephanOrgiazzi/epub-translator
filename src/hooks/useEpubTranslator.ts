import { useState, useRef } from 'react';
import JSZip from 'jszip';
import { TargetLanguage } from '../types/languages';
import { translateText } from '../services/translation';
import { splitContent } from '../utils/content';

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

  const handleCancel = () => {
    isCancelled.current = true;
    setShowCancelModal(false);
    setIsLoading(false);
    setSelectedFile(null);
    setTranslationProgress(0);
    setError(null);
  };

  const processEpubFile = async (file: File) => {
    try {
      isCancelled.current = false;
      setIsLoading(true);
      setError(null);
      setTranslationProgress(0);
      
      const zip = new JSZip();
      const epubContent = await file.arrayBuffer();
      const epubZip = await zip.loadAsync(epubContent);
      
      // Find all HTML files in the EPUB
      const htmlFiles = Object.keys(epubZip.files).filter(
        filename => filename.endsWith('.html') || filename.endsWith('.xhtml')
      );
      
      // Process files in sequence, but chunks in parallel
      for (let fileIndex = 0; fileIndex < htmlFiles.length; fileIndex++) {
        if (isCancelled.current) break;

        const filename = htmlFiles[fileIndex];
        const fileContent = await epubZip.file(filename)?.async('string');
        
        if (fileContent) {
          // Split content into larger chunks
          const chunks = splitContent(fileContent);
          
          // Process chunks in parallel with a concurrency limit
          const CONCURRENT_CHUNKS = 3; // Adjust based on rate limits
          let translatedContent = '';
          
          for (let i = 0; i < chunks.length; i += CONCURRENT_CHUNKS) {
            if (isCancelled.current) break;

            const chunkGroup = chunks.slice(i, i + CONCURRENT_CHUNKS);
            const translations = await Promise.all(
              chunkGroup.map((chunk, groupIndex) => 
                translateText(
                  chunk,
                  fileIndex,
                  htmlFiles.length,
                  i + groupIndex,
                  chunks.length,
                  targetLanguage,
                  updateProgress,
                  isCancelled
                )
              )
            );
            translatedContent += translations.join('');
          }
          
          // Update the file in the ZIP
          zip.file(filename, translatedContent);
        }
      }

      if (!isCancelled.current) {
        // Generate the translated EPUB
        const translatedEpub = await zip.generateAsync({ type: 'blob' });
        
        // Create a download link
        const downloadUrl = URL.createObjectURL(translatedEpub);
        const downloadLink = document.createElement('a');
        downloadLink.href = downloadUrl;
        downloadLink.download = file.name.replace('.epub', `_${targetLanguage}.epub`);
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(downloadUrl);
        
        updateProgress(100);
        setIsLoading(false);
        setSelectedFile(null);
      }
    } catch (err: any) {
      console.error('Error processing EPUB:', err);
      setError(err.message);
      setIsLoading(false);
    }
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
      if (file.name.endsWith('.epub')) {
        onUpload?.(file);
        setSelectedFile(file);
        setError(null);
        setTranslationProgress(0);
      } else {
        setError('Please upload an EPUB file');
      }
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith('.epub')) {
        onUpload?.(file);
        setSelectedFile(file);
        setError(null);
        setTranslationProgress(0);
      } else {
        setError('Please upload an EPUB file');
      }
    }
  };

  const startTranslation = async () => {
    if (selectedFile) {
      await processEpubFile(selectedFile);
    }
  };

  return {
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
  };
};
