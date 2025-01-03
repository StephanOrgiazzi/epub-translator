export interface TranslationProgress {
  currentFileIndex: number;
  totalFiles: number;
  currentChunkIndex: number;
  totalChunks: number;
}

export interface TranslationResponse {
  choices?: Array<{
    delta?: {
      content?: string;
    };
  }>;
}

export interface TranslationError extends Error {
  statusCode?: number;
  statusText?: string;
}

export interface HTMLElement {
  openTag: string;
  closeTag: string;
  content: string;
}