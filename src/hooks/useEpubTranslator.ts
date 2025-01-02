import { useState } from 'react';
import JSZip from 'jszip';
import OpenAI from 'openai';
import { DEEPSEEK_API_KEY } from '../config';

interface UseEpubTranslatorProps {
  onUpload?: (file: File) => void;
}

export const useEpubTranslator = ({ onUpload }: UseEpubTranslatorProps = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);

  // Ensure progress never decreases
  const updateProgress = (newProgress: number) => {
    setTranslationProgress(prev => Math.max(prev, Math.round(newProgress)));
  };

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: DEEPSEEK_API_KEY.startsWith('sk-') ? DEEPSEEK_API_KEY : `sk-${DEEPSEEK_API_KEY}`,
    baseURL: 'https://api.deepseek.com/v1',
    dangerouslyAllowBrowser: true,
    defaultHeaders: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream'
    }
  });

  const translateText = async (
    content: string,
    currentFileIndex: number,
    totalFiles: number,
    currentChunkIndex: number,
    totalChunks: number
  ): Promise<string> => {
    try {
      console.log(`Translating chunk ${currentChunkIndex + 1}/${totalChunks} of file ${currentFileIndex + 1}/${totalFiles}`);
      console.log(`Chunk size: ${content.length} characters`);

      const stream = await openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a professional translator with expertise in accurate and context-aware translations. Translate the following English text to French, maintaining the original HTML formatting and paragraph structure. Preserve all HTML tags exactly as they appear. Ensure the translation is accurate, fluent, and culturally appropriate, reflecting the intended meaning of the original text.'
          },
          {
            role: 'user',
            content: content
          }
        ],
        stream: true
      });

      let finalTranslation = '';
      let processedChars = 0;
      
      // Calculate base progress for this chunk
      const baseProgress = ((currentFileIndex * totalChunks + currentChunkIndex) / (totalFiles * totalChunks)) * 100;
      const nextChunkProgress = ((currentFileIndex * totalChunks + currentChunkIndex + 1) / (totalFiles * totalChunks)) * 100;
      const chunkProgressRange = nextChunkProgress - baseProgress;
      
      // Start at the base progress
      updateProgress(baseProgress);

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          finalTranslation += content;
          processedChars += content.length;
          
          // Simple linear progress based on characters received
          const progressInChunk = Math.min(0.95, processedChars / content.length);
          const currentProgress = baseProgress + (progressInChunk * chunkProgressRange);
          updateProgress(currentProgress);
        }
      }

      // When chunk is complete, set to exact next chunk progress
      updateProgress(nextChunkProgress);

      return finalTranslation;
    } catch (error: any) {
      console.error('Translation error:', error);
      throw new Error(`Translation failed: ${error.message}`);
    }
  };

  const processEpubFile = async (file: File) => {
    try {
      setIsLoading(true);
      setError(null);
      updateProgress(0);
      
      const zip = new JSZip();
      const epubContent = await file.arrayBuffer();
      const epubZip = await zip.loadAsync(epubContent);
      
      // Find all HTML files in the EPUB
      const htmlFiles = Object.keys(epubZip.files).filter(
        filename => filename.endsWith('.html') || filename.endsWith('.xhtml')
      );
      
      // Process files in sequence, but chunks in parallel
      for (let fileIndex = 0; fileIndex < htmlFiles.length; fileIndex++) {
        const filename = htmlFiles[fileIndex];
        const fileContent = await epubZip.file(filename)?.async('string');
        
        if (fileContent) {
          // Split content into larger chunks
          const chunks = splitContent(fileContent);
          
          // Process chunks in parallel with a concurrency limit
          const CONCURRENT_CHUNKS = 3; // Adjust based on rate limits
          let translatedContent = '';
          
          for (let i = 0; i < chunks.length; i += CONCURRENT_CHUNKS) {
            const chunkGroup = chunks.slice(i, i + CONCURRENT_CHUNKS);
            const translations = await Promise.all(
              chunkGroup.map((chunk, groupIndex) => 
                translateText(
                  chunk,
                  fileIndex,
                  htmlFiles.length,
                  i + groupIndex,
                  chunks.length
                )
              )
            );
            translatedContent += translations.join('');
          }
          
          // Update the file in the ZIP
          zip.file(filename, translatedContent);
        }
      }
      
      // Generate the translated EPUB
      const translatedEpub = await zip.generateAsync({ type: 'blob' });
      
      // Create a download link
      const downloadUrl = URL.createObjectURL(translatedEpub);
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = file.name.replace('.epub', '_translated.epub');
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(downloadUrl);
      
      updateProgress(100);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Error processing EPUB:', err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  // Helper function to split content into chunks
  const splitContent = (content: string): string[] => {
    const maxChunkSize = 4000; // Increased from 1500 to 4000
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
        await processEpubFile(file);
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
        await processEpubFile(file);
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
    handleDrag,
    handleDrop,
    handleChange,
  };
};
