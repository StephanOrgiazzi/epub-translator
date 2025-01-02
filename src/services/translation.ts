import { DEEPSEEK_API_KEY } from '../config';
import { TranslationProgress, TranslationResponse, TranslationError } from '../types/epub';
import { TargetLanguage, languagePrompts } from '../types/languages';

const API_URL = 'https://api.deepseek.com/v1/chat/completions';
const MODEL = 'deepseek-chat';

/**
 * Translates a chunk of text using the Deepseek API
 */
export const translateText = async (
  content: string,
  progress: TranslationProgress,
  targetLanguage: TargetLanguage,
  updateProgress: (progress: number) => void
): Promise<string> => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: languagePrompts[targetLanguage]
          },
          {
            role: 'user',
            content
          }
        ],
        stream: true
      })
    });

    if (!response.ok) {
      const error = new Error(`Translation failed: ${response.statusText}`) as TranslationError;
      error.statusCode = response.status;
      error.statusText = response.statusText;
      throw error;
    }

    return await processStreamResponse(response, content, progress, updateProgress);
  } catch (error: any) {
    console.error('Translation error:', error);
    throw new Error(`Translation failed: ${error.message}`);
  }
};

/**
 * Processes the streaming response from the translation API
 */
const processStreamResponse = async (
  response: Response,
  content: string,
  progress: TranslationProgress,
  updateProgress: (progress: number) => void
): Promise<string> => {
  if (!response.body) {
    throw new Error('Response body is null');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let finalTranslation = '';
  let processedChars = 0;
  let buffer = '';

  const { baseProgress, nextChunkProgress } = calculateProgressBoundaries(progress);
  const chunkProgressRange = nextChunkProgress - baseProgress;
  updateProgress(baseProgress);

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const result = processChunk(
        decoder.decode(value, { stream: true }),
        buffer,
        content.length,
        processedChars,
        baseProgress,
        chunkProgressRange,
        updateProgress
      );

      buffer = result.buffer;
      finalTranslation += result.translation;
      processedChars += result.processedChars;
    }

    // Process any remaining data in the buffer
    if (buffer.trim()) {
      const content = processRemainingBuffer(buffer);
      if (content) finalTranslation += content;
    }

    updateProgress(nextChunkProgress);
    return finalTranslation;
  } finally {
    reader.releaseLock();
  }
};

/**
 * Calculates progress boundaries for the current chunk
 */
const calculateProgressBoundaries = (progress: TranslationProgress) => {
  const { currentFileIndex, totalFiles, currentChunkIndex, totalChunks } = progress;
  const baseProgress = ((currentFileIndex * totalChunks + currentChunkIndex) / (totalFiles * totalChunks)) * 100;
  const nextChunkProgress = ((currentFileIndex * totalChunks + currentChunkIndex + 1) / (totalFiles * totalChunks)) * 100;
  return { baseProgress, nextChunkProgress };
};

/**
 * Processes a single chunk of the streaming response
 */
const processChunk = (
  newData: string,
  buffer: string,
  totalChars: number,
  processedChars: number,
  baseProgress: number,
  chunkProgressRange: number,
  updateProgress: (progress: number) => void
) => {
  buffer += newData;
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';
  let additionalTranslation = '';
  let additionalChars = 0;

  for (const line of lines) {
    const content = extractContentFromLine(line);
    if (content) {
      additionalTranslation += content;
      additionalChars += content.length;
    }
  }

  if (additionalChars > 0) {
    const progressInChunk = Math.min(0.95, (processedChars + additionalChars) / totalChars);
    const currentProgress = baseProgress + (progressInChunk * chunkProgressRange);
    updateProgress(currentProgress);
  }

  return {
    buffer,
    translation: additionalTranslation,
    processedChars: additionalChars
  };
};

/**
 * Extracts content from a response line
 */
const extractContentFromLine = (line: string): string | null => {
  const trimmedLine = line.trim();
  if (!trimmedLine || trimmedLine === 'data: [DONE]') return null;

  if (trimmedLine.startsWith('data: ')) {
    try {
      const data = trimmedLine.slice(5).trim();
      const parsed = JSON.parse(data) as TranslationResponse;
      return parsed.choices?.[0]?.delta?.content || null;
    } catch (e) {
      if (trimmedLine !== 'data: ') {
        console.debug('Skipping malformed chunk:', trimmedLine);
      }
      return null;
    }
  }
  return null;
};

/**
 * Processes any remaining data in the buffer
 */
const processRemainingBuffer = (buffer: string): string | null => {
  const trimmedLine = buffer.trim();
  if (trimmedLine.startsWith('data: ') && trimmedLine !== 'data: [DONE]') {
    try {
      const data = trimmedLine.slice(5).trim();
      const parsed = JSON.parse(data) as TranslationResponse;
      return parsed.choices?.[0]?.delta?.content || null;
    } catch (e) {
      console.debug('Skipping malformed final chunk:', trimmedLine);
      return null;
    }
  }
  return null;
};
