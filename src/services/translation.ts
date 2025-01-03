import { languagePrompts, TargetLanguage } from '../types/languages';
import { RefObject } from 'react';
import {
  TranslationContext,
  calculateTranslationProgress,
  initializeStreamReader,
  logTranslationStart,
  processStreamBuffer,
  validateTranslation
} from '../utils/translationStreamUtils';

const API_ENDPOINT = 'https://api.deepseek.com/beta/chat/completions';
const MODEL_NAME = 'deepseek-chat';
const TEMPERATURE = 1.1;
const MAX_TOKENS = 8192;

const createTranslationRequest = (content: string, targetLanguage: TargetLanguage): RequestInit => ({
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY}`,
  },
  body: JSON.stringify({
    model: MODEL_NAME,
    messages: [
      {
        role: 'system',
        content: languagePrompts[targetLanguage]
      },
      {
        role: 'user',
        content: content
      },
      {
        role: 'assistant',
        content: '',
        prefix: true
      }
    ],
    stream: true,
    temperature: TEMPERATURE,
    max_tokens: MAX_TOKENS,
    stop: null
  })
});

export const translateText = async (
  content: string,
  currentFileIndex: number,
  totalFiles: number,
  currentChunkIndex: number,
  totalChunks: number,
  targetLanguage: TargetLanguage,
  updateProgress: (progress: number) => void,
  isCancelled: RefObject<boolean>
): Promise<string> => {
  if (isCancelled.current) return '';

  const context: TranslationContext = {
    content,
    totalChars: content.length,
    currentFileIndex,
    totalFiles,
    currentChunkIndex,
    totalChunks,
    targetLanguage,
    updateProgress,
    isCancelled
  };

  logTranslationStart(context);
  const progress = calculateTranslationProgress(currentFileIndex, totalFiles, currentChunkIndex, totalChunks);

  try {
    const response = await fetch(API_ENDPOINT, createTranslationRequest(content, targetLanguage));
    const reader = await initializeStreamReader(response);
    const translatedText = await processStreamBuffer(reader, context, progress);
    
    updateProgress(progress.nextChunkProgress);
    // Only validate if not cancelled
    if (!isCancelled.current) {
      validateTranslation(translatedText, isCancelled);
    }
    
    return translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
};