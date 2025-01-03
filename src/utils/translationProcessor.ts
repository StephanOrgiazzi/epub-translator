import JSZip from "jszip";
import { TargetLanguage } from "../types/languages";
import { translateText } from "../services/translation";
import { splitContent } from "./splitContent";
import { createTranslationQueue } from "./translationQueue";
import { downloadTranslatedEpub, findHtmlFiles } from "./fileUtils";

// Cache for translated content
export const translationCache = new Map<string, string>();

export const translateChunk = async (
  chunk: string,
  fileIndex: number,
  totalFiles: number,
  chunkIndex: number,
  totalChunks: number,
  queue: ReturnType<typeof createTranslationQueue>,
  targetLanguage: TargetLanguage,
  translationCache: Map<string, string>,
  updateProgress: (progress: number) => void,
  isCancelled: { current: boolean }
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

export const translateFile = async (
  fileContent: string,
  fileIndex: number,
  totalFiles: number,
  queue: ReturnType<typeof createTranslationQueue>,
  targetLanguage: TargetLanguage,
  translationCache: Map<string, string>,
  updateProgress: (progress: number) => void,
  isCancelled: { current: boolean }
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
          queue,
          targetLanguage,
          translationCache,
          updateProgress,
          isCancelled
        )
      )
    );
    translatedContent += translations.join('');
  }
  
  return translatedContent;
};

export const processEpubFile = async (
  file: File,
  targetLanguage: TargetLanguage,
  translationCache: Map<string, string>,
  isCancelled: { current: boolean },
  callbacks: {
    updateProgress: (progress: number) => void;
    setError: (error: string | null) => void;
    setIsLoading: (loading: boolean) => void;
    setSelectedFile: (file: File | null) => void;
  }
) => {
  const { updateProgress, setError, setIsLoading, setSelectedFile } = callbacks;

  try {
    // Reserve 1% of progress for EPUB generation and compression
    const translationProgress = (current: number) => updateProgress(current * 0.99);

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
          queue,
          targetLanguage,
          translationCache,
          translationProgress,
          isCancelled
        );
        
        zip.file(filename, translatedContent);
      });

      await Promise.all(filePromises);
    }

    if (!isCancelled.current) {
      // Show that we're starting EPUB generation
      updateProgress(99);
      
      const translatedEpub = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 }
      }, (metadata) => {
        // Update progress during compression
        const compressionProgress = 99 + (metadata.percent * 0.01);
        updateProgress(compressionProgress);
      });

      // Only proceed to download if we haven't been cancelled
      if (!isCancelled.current) {
        downloadTranslatedEpub(translatedEpub, file.name, targetLanguage);
        updateProgress(100);
        setIsLoading(false);
        setSelectedFile(null);
      }
    }
  } catch (err) {
    console.error('Error processing EPUB:', err);
    setError(err instanceof Error ? err.message : 'An error occurred while processing the EPUB file');
    setIsLoading(false);
  }
};
