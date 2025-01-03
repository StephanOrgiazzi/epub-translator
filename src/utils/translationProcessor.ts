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
  const translation = await queue.enqueueAndExecute(() =>
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

const processChunksConcurrently = async (
  chunks: string[],
  fileIndex: number,
  totalFiles: number,
  queue: ReturnType<typeof createTranslationQueue>,
  targetLanguage: TargetLanguage,
  translationCache: Map<string, string>,
  translationProgress: (progress: number) => void,
  isCancelled: { current: boolean },
  concurrentChunks: number
): Promise<string> => {
  let translatedContent = '';
  
  for (const [index] of chunks.entries()) {
    const isStartOfChunkGroup = index % concurrentChunks === 0;
    if (isStartOfChunkGroup) {
      if (isCancelled.current) break;

      const chunkGroup = chunks.slice(index, index + concurrentChunks);
      const translations = await Promise.all(
        chunkGroup.map((chunk, groupIndex) =>
          translateChunk(
            chunk,
            fileIndex,
            totalFiles,
            index + groupIndex,
            chunks.length,
            queue,
            targetLanguage,
            translationCache,
            translationProgress,
            isCancelled
          )
        )
      );
      translatedContent += translations.join('');
    }
  }

  return translatedContent;
};

export const translateFile = async (
  fileContent: string,
  fileIndex: number,
  totalFiles: number,
  queue: ReturnType<typeof createTranslationQueue>,
  targetLanguage: TargetLanguage,
  translationCache: Map<string, string>,
  translationProgress: (progress: number) => void,
  isCancelled: { current: boolean }
) => {
  const CONCURRENT_CHUNKS = 5;
  const chunks = splitContent(fileContent);

  return processChunksConcurrently(
    chunks,
    fileIndex,
    totalFiles,
    queue,
    targetLanguage,
    translationCache,
    translationProgress,
    isCancelled,
    CONCURRENT_CHUNKS
  );
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
    
    for (const [index] of htmlFiles.entries()) {
      if (index % FILE_CONCURRENCY === 0) {
        if (isCancelled.current) break;

        const fileGroup = htmlFiles.slice(index, index + FILE_CONCURRENCY);
        const filePromises = fileGroup.map(async (filename, groupIndex) => {
          const fileContent = await epubZip.file(filename)?.async('string');
          if (!fileContent) return;

          const translatedContent = await translateFile(
            fileContent,
            index + groupIndex,
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
