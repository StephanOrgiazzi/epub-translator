import { TargetLanguage } from '../types/languages';
import { RefObject } from 'react';

export interface StreamResponse {
  choices?: [{
    delta?: {
      content?: string;
    };
  }];
}

export interface TranslationProgress {
  baseProgress: number;
  nextChunkProgress: number;
  chunkProgressRange: number;
}

export interface TranslationContext {
  content: string;
  totalChars: number;
  currentFileIndex: number;
  totalFiles: number;
  currentChunkIndex: number;
  totalChunks: number;
  targetLanguage: TargetLanguage;
  updateProgress: (progress: number) => void;
  isCancelled: RefObject<boolean>;
}

export interface StreamProcessingState {
  translatedText: string;
  processedChars: number;
  streamBuffer: string;
}

export const PROGRESS_THRESHOLD = 0.95;

export const calculateProgress = (
  baseProgress: number,
  chunkProgressRange: number,
  processedChars: number,
  totalChars: number
): number => {
  const progressInChunk = Math.min(PROGRESS_THRESHOLD, processedChars / totalChars);
  return baseProgress + (progressInChunk * chunkProgressRange);
};

export const calculateTranslationProgress = (
  currentFileIndex: number,
  totalFiles: number,
  currentChunkIndex: number,
  totalChunks: number
): TranslationProgress => {
  const baseProgress = ((currentFileIndex * totalChunks + currentChunkIndex) / (totalFiles * totalChunks)) * 100;
  const nextChunkProgress = ((currentFileIndex * totalChunks + currentChunkIndex + 1) / (totalFiles * totalChunks)) * 100;
  const chunkProgressRange = nextChunkProgress - baseProgress;
  return { baseProgress, nextChunkProgress, chunkProgressRange };
};

export const logTranslationStart = (context: TranslationContext): void => {
  console.log(
    `Translating chunk ${context.currentChunkIndex + 1}/${context.totalChunks} ` +
    `of file ${context.currentFileIndex + 1}/${context.totalFiles}`
  );
  console.log(`Chunk size: ${context.content.length} characters`);
};

export const processStreamLine = (
  line: string,
  updateProgress: (progress: number) => void,
  baseProgress: number,
  chunkProgressRange: number,
  processedChars: number,
  totalChars: number
): { content: string; newProcessedChars: number } => {
  const trimmedLine = line.trim();
  if (!trimmedLine || trimmedLine === 'data: [DONE]') {
    return { content: '', newProcessedChars: processedChars };
  }

  if (!trimmedLine.startsWith('data: ')) {
    return { content: '', newProcessedChars: processedChars };
  }

  try {
    const data = trimmedLine.slice(5).trim();
    const parsed = JSON.parse(data) as StreamResponse;
    const content = parsed.choices?.[0]?.delta?.content || '';
    
    if (content) {
      const newProcessedChars = processedChars + content.length;
      const currentProgress = calculateProgress(
        baseProgress,
        chunkProgressRange,
        newProcessedChars,
        totalChars
      );
      updateProgress(currentProgress);
      return { content, newProcessedChars };
    }
  } catch (e) {
    if (trimmedLine !== 'data: ') {
      console.error('Error parsing chunk:', e);
      console.debug('Problematic chunk:', trimmedLine);
    }
  }

  return { content: '', newProcessedChars: processedChars };
};

export const processStreamChunk = (
  chunk: Uint8Array,
  decoder: TextDecoder,
  state: StreamProcessingState,
  context: TranslationContext,
  progress: TranslationProgress
): StreamProcessingState => {
  const decodedText = decoder.decode(chunk, { stream: true });
  const lines = (state.streamBuffer + decodedText).split('\n');
  const newBuffer = lines.pop() || '';
  
  let newTranslatedText = state.translatedText;
  let newProcessedChars = state.processedChars;

  for (const line of lines) {
    const { content, newProcessedChars: updatedChars } = processStreamLine(
      line,
      context.updateProgress,
      progress.baseProgress,
      progress.chunkProgressRange,
      newProcessedChars,
      context.totalChars
    );
    newTranslatedText += content;
    newProcessedChars = updatedChars;
  }

  return {
    translatedText: newTranslatedText,
    processedChars: newProcessedChars,
    streamBuffer: newBuffer
  };
};

export const processRemainingBuffer = (
  state: StreamProcessingState,
  context: TranslationContext,
  progress: TranslationProgress
): string => {
  if (!state.streamBuffer.trim()) return state.translatedText;

  const { content } = processStreamLine(
    state.streamBuffer,
    context.updateProgress,
    progress.baseProgress,
    progress.chunkProgressRange,
    state.processedChars,
    context.totalChars
  );
  
  return state.translatedText + content;
};

export const initializeStreamState = (): StreamProcessingState => ({
  translatedText: '',
  processedChars: 0,
  streamBuffer: ''
});

export const initializeStreamReader = async (
  response: Response
): Promise<ReadableStreamDefaultReader<Uint8Array>> => {
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No reader available');
  return reader;
};

export const processStreamBuffer = async (
  reader: ReadableStreamDefaultReader<Uint8Array>,
  context: TranslationContext,
  progress: TranslationProgress
): Promise<string> => {
  const decoder = new TextDecoder('utf-8');
  let state = initializeStreamState();
  
  context.updateProgress(progress.baseProgress);

  try {
    while (!context.isCancelled.current) {
      const { done, value } = await reader.read();
      if (done) break;

      state = processStreamChunk(value, decoder, state, context, progress);
    }

    if (context.isCancelled.current) {
      reader.cancel();
      return '';
    }

    return processRemainingBuffer(state, context, progress);
  } finally {
    reader.releaseLock();
  }
};

export const validateTranslation = (translatedText: string): void => {
  if (!translatedText.trim()) {
    throw new Error('Empty translation received');
  }
};
