import { languagePrompts, TargetLanguage } from '../types/languages';
import { RefObject } from 'react';

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
        'Authorization': `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`,
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
            content
          }
        ],
        stream: true,
        temperature: 1.3,
        max_tokens: 8192
      })
    });

    if (!response.ok) {
      throw new Error(`Translation failed: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let finalTranslation = '';
    let processedChars = 0;
    let totalChars = content.length;
    let buffer = '';

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
                console.error('Error parsing chunk:', e);
                console.debug('Problematic chunk:', trimmedLine);
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
            console.error('Error parsing final chunk:', e);
            console.debug('Problematic final chunk:', trimmedLine);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // When chunk is complete, set to exact next chunk progress
    updateProgress(nextChunkProgress);

    // Ensure we have a complete translation
    if (!finalTranslation.trim()) {
      throw new Error('Empty translation received');
    }

    return finalTranslation;
  } catch (error: any) {
    console.error('Translation error:', error);
    throw new Error(`Translation failed: ${error.message}`);
  }
};