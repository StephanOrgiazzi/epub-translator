import { useState, useRef } from 'react';
import JSZip from 'jszip';
import { TargetLanguage } from '../types/languages';
import { translateText } from '../services/translation';
import { splitContent } from '../utils/splitContent';

interface UseEpubTranslatorProps {
  onUpload?: (file: File) => void;
  targetLanguage: TargetLanguage;
}

// Cache for translated content
const translationCache = new Map<string, string>();

// Queue for managing concurrent API calls
interface TranslationQueueState {
  running: number;
  maxConcurrent: number;
}

const createTranslationQueue = (maxConcurrent: number) => {
  const state: TranslationQueueState = {
    running: 0,
    maxConcurrent,
  };

  const add = async <T>(task: () => Promise<T>): Promise<T> => {
    while (state.running >= state.maxConcurrent) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    state.running++;
    try {
      return await task();
    } finally {
      state.running--;
    }
  };

  return { add };
};

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

  const findHtmlFiles = (epubZip: JSZip) => 
    Object.keys(epubZip.files).filter(filename => 
      filename.endsWith('.html') || filename.endsWith('.xhtml')
    );

  const translateChunk = async (
    chunk: string,
    fileIndex: number,
    totalFiles: number,
    chunkIndex: number,
    totalChunks: number,
    queue: ReturnType<typeof createTranslationQueue>
  ) => {
    if (isCancelled.current) return '';

    // Check cache first
    const cacheKey = `${chunk}_${targetLanguage}`;
    if (translationCache.has(cacheKey)) {
      console.log('Cache hit for chunk');
      return translationCache.get(cacheKey)!;
    }

    // Use queue to manage concurrent API calls
    const translation = await queue.add(() =>
      translateText(
        chunk,
        fileIndex,
        totalFiles,
        chunkIndex,
        totalChunks,
        targetLanguage,
        updateProgress,
        isCancelled
      )
    );

    // Cache the result
    translationCache.set(cacheKey, translation);
    return translation;
  };

  const translateFile = async (
    fileContent: string,
    fileIndex: number,
    totalFiles: number,
    queue: ReturnType<typeof createTranslationQueue>
  ) => {
    const CONCURRENT_CHUNKS = 5;
    const chunks = splitContent(fileContent);
    
    const chunkGroups = Array.from(
      { length: Math.ceil(chunks.length / CONCURRENT_CHUNKS) },
      (_, i) => chunks.slice(i * CONCURRENT_CHUNKS, (i + 1) * CONCURRENT_CHUNKS)
    );

    let translatedContent = '';
    for (const [groupIndex, group] of chunkGroups.entries()) {
      if (isCancelled.current) break;
      
      const startIndex = groupIndex * CONCURRENT_CHUNKS;
      // Process chunks in parallel within the group
      const translations = await Promise.all(
        group.map((chunk, index) =>
          translateChunk(
            chunk,
            fileIndex,
            totalFiles,
            startIndex + index,
            chunks.length,
            queue
          )
        )
      );
      translatedContent += translations.join('');
    }
    
    return translatedContent;
  };

  const downloadTranslatedEpub = (blob: Blob, originalName: string) => {
    const downloadUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = downloadUrl;
    downloadLink.download = originalName.replace('.epub', `_${targetLanguage}.epub`);
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(downloadUrl);
  };

  const processEpubFile = async (file: File) => {
    try {
      resetState();
      
      const zip = new JSZip();
      const epubContent = await file.arrayBuffer();
      const epubZip = await zip.loadAsync(epubContent);
      const htmlFiles = findHtmlFiles(epubZip);
      
      // Create translation queue with concurrency limit
      const queue = createTranslationQueue(3);
      
      // Process files concurrently in groups
      const FILE_CONCURRENCY = 2;
      for (let i = 0; i < htmlFiles.length; i += FILE_CONCURRENCY) {
        if (isCancelled.current) break;

        const fileGroup = htmlFiles.slice(i, i + FILE_CONCURRENCY);
        const filePromises = fileGroup.map(async (filename, groupIndex) => {
          const fileContent = await epubZip.file(filename)?.async('string');
          if (!fileContent) return;

          const translatedContent = await translateFile(
            fileContent,
            i + groupIndex,
            htmlFiles.length,
            queue
          );
          
          zip.file(filename, translatedContent);
        });

        await Promise.all(filePromises);
      }

      if (!isCancelled.current) {
        const translatedEpub = await zip.generateAsync({ 
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: { level: 9 }
        });
        downloadTranslatedEpub(translatedEpub, file.name);
        
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

  const handleCancel = () => {
    isCancelled.current = true;
    setShowCancelModal(false);
    setIsLoading(false);
    setSelectedFile(null);
    setTranslationProgress(0);
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
