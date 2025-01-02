import { useState, useRef } from 'react';
import JSZip from 'jszip';
import { DEEPSEEK_API_KEY } from '../config';
import { languagePrompts, TargetLanguage } from '../types/languages';

interface UseEpubTranslatorProps {
  onUpload?: (file: File) => void;
  targetLanguage: TargetLanguage;
}

const translateText = async (
  content: string,
  currentFileIndex: number,
  totalFiles: number,
  currentChunkIndex: number,
  totalChunks: number,
  targetLanguage: TargetLanguage,
  updateProgress: (progress: number) => void,
  isCancelled: React.RefObject<boolean>
): Promise<string> => {
  try {
    if (isCancelled.current) {
      return '';
    }

    console.log(`Translating chunk ${currentChunkIndex + 1}/${totalChunks} of file ${currentFileIndex + 1}/${totalFiles}`);
    console.log(`Chunk size: ${content.length} characters`);

    // Calculate base progress for this chunk
    const baseProgress = ((currentFileIndex * totalChunks + currentChunkIndex) / (totalFiles * totalChunks)) * 100;
    const nextChunkProgress = ((currentFileIndex * totalChunks + currentChunkIndex + 1) / (totalFiles * totalChunks)) * 100;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY.startsWith('sk-') ? DEEPSEEK_API_KEY : `sk-${DEEPSEEK_API_KEY}`}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: languagePrompts[targetLanguage]
          },
          {
            role: 'user',
            content: content
          }
        ],
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`Translation failed: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let finalTranslation = '';
    let processedChars = 0;
    let totalChars = content.length; // Use input content length as an estimate
    let buffer = ''; // Buffer for incomplete chunks

    // Calculate progress boundaries for this chunk
    const chunkProgressRange = nextChunkProgress - baseProgress;

    // Start at the base progress
    updateProgress(baseProgress);

    try {
      while (true) {
        if (isCancelled.current) {
          reader.cancel();
          return '';
        }

        const { done, value } = await reader.read();
        if (done) break;

        // Append new chunk to buffer and split into lines
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last line in buffer if it's incomplete
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;
          
          if (trimmedLine.startsWith('data: ')) {
            try {
              const data = trimmedLine.slice(5).trim();
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                finalTranslation += content;
                processedChars += content.length;

                // Update progress based on characters processed
                const progressInChunk = Math.min(0.95, processedChars / totalChars);
                const currentProgress = baseProgress + (progressInChunk * chunkProgressRange);
                updateProgress(currentProgress);
              }
            } catch (e) {
              // Only log parsing errors for non-empty data
              if (trimmedLine !== 'data: ') {
                console.debug('Skipping malformed chunk:', trimmedLine);
              }
            }
          }
        }
      }
      
      // Process any remaining data in the buffer
      if (buffer.trim()) {
        const trimmedLine = buffer.trim();
        if (trimmedLine.startsWith('data: ') && trimmedLine !== 'data: [DONE]') {
          try {
            const data = trimmedLine.slice(5).trim();
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              finalTranslation += content;
            }
          } catch (e) {
            console.debug('Skipping malformed final chunk:', trimmedLine);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // When chunk is complete, set to exact next chunk progress
    updateProgress(nextChunkProgress);

    return finalTranslation;
  } catch (error: any) {
    console.error('Translation error:', error);
    throw new Error(`Translation failed: ${error.message}`);
  }
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

// Helper function to split content into chunks
const splitContent = (content: string): string[] => {
  const maxChunkSize = 4000;
  const chunks: string[] = [];
  let currentChunk = '';

  // First, find all HTML tags that we want to keep together
  const elements = content.split(/(<(?:p|div|h[1-6]|section)[^>]*>.*?<\/(?:p|div|h[1-6]|section)>)/gs);

  for (const element of elements) {
    // If it's a complete HTML element
    if (element.startsWith('<') && element.endsWith('>')) {
      // If adding this element would exceed maxChunkSize
      if (currentChunk.length + element.length > maxChunkSize) {
        // If the current chunk is not empty, push it
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = '';
        }
        // If the element itself is larger than maxChunkSize
        if (element.length > maxChunkSize) {
          // Split while preserving HTML structure
          const openTagMatch = element.match(/<([a-zA-Z0-9]+)[^>]*>/);
          const closeTagMatch = element.match(/<\/([a-zA-Z0-9]+)>/);
          
          if (openTagMatch && closeTagMatch) {
            const [openTag] = openTagMatch;
            const [closeTag] = closeTagMatch;
            const content = element.slice(openTag.length, -closeTag.length);
            
            // Split content into smaller pieces
            const contentChunks = content.match(new RegExp(`.{1,${maxChunkSize - openTag.length - closeTag.length}}`, 'g')) || [];
            
            // Add tags back to each chunk
            contentChunks.forEach(chunk => {
              chunks.push(openTag + chunk + closeTag);
            });
          } else {
            // Fallback: split without preserving structure
            const subChunks = element.match(new RegExp(`.{1,${maxChunkSize}}`, 'g')) || [];
            chunks.push(...subChunks);
          }
        } else {
          currentChunk = element;
        }
      } else {
        currentChunk += element;
      }
    } else {
      // For text nodes, split if needed
      if (currentChunk.length + element.length > maxChunkSize) {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        const subChunks = element.match(new RegExp(`.{1,${maxChunkSize}}`, 'g')) || [];
        chunks.push(...subChunks.slice(0, -1));
        currentChunk = subChunks[subChunks.length - 1] || '';
      } else {
        currentChunk += element;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  console.log(`Split content into ${chunks.length} chunks`);
  chunks.forEach((chunk, i) => {
    console.log(`Chunk ${i + 1} size: ${chunk.length} characters`);
  });

  return chunks;
};
