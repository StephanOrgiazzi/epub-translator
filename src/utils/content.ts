/**
 * Splits HTML content into chunks while preserving HTML structure.
 * Each chunk will be approximately MAX_CHUNK_SIZE characters or less.
 * 
 * @param content - The HTML content to split
 * @returns An array of content chunks
 */
// Helper function to split content into chunks while preserving HTML structure
export const splitContent = (content: string): string[] => {
  interface HTMLElement {
    openTag: string;
    closeTag: string;
    content: string;
  }

  const BLOCK_ELEMENTS = ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'section'];
  const MAX_CHUNK_SIZE = 8000;

  /**
   * Extracts HTML tags and content from an element string
   */
  const parseHTMLElement = (element: string): HTMLElement | null => {
    const openTagMatch = element.match(/<([a-zA-Z0-9]+)[^>]*>/);
    const closeTagMatch = element.match(/<\/([a-zA-Z0-9]+)>/);
    
    if (!openTagMatch || !closeTagMatch) return null;
    
    const [openTag] = openTagMatch;
    const [closeTag] = closeTagMatch;
    const content = element.slice(openTag.length, -closeTag.length);
    
    return { openTag, closeTag, content };
  };

  /**
   * Splits text into chunks of specified size
   */
  const splitTextIntoChunks = (text: string, maxSize: number): string[] => {
    return text.match(new RegExp(`.{1,${maxSize}}`, 'g')) || [];
  };

  /**
   * Splits HTML element content while preserving tags
   */
  const splitHTMLElement = (element: HTMLElement, maxSize: number): string[] => {
    const { openTag, closeTag, content } = element;
    const availableSize = maxSize - (openTag.length + closeTag.length);
    const contentChunks = splitTextIntoChunks(content, availableSize);
    
    return contentChunks.map(chunk => `${openTag}${chunk}${closeTag}`);
  };

  /**
   * Processes a single element and returns chunks
   */
  const processElement = (element: string, currentChunk: string): {
    chunks: string[];
    newCurrentChunk: string;
  } => {
    const chunks: string[] = [];

    // Handle HTML elements
    if (element.startsWith('<') && element.endsWith('>')) {
      if (currentChunk.length + element.length > MAX_CHUNK_SIZE) {
        if (currentChunk) chunks.push(currentChunk);
        
        const htmlElement = parseHTMLElement(element);
        if (htmlElement) {
          if (element.length > MAX_CHUNK_SIZE) {
            chunks.push(...splitHTMLElement(htmlElement, MAX_CHUNK_SIZE));
            return { chunks, newCurrentChunk: '' };
          }
          return { chunks, newCurrentChunk: element };
        }
        
        // Fallback for invalid HTML
        const subChunks = splitTextIntoChunks(element, MAX_CHUNK_SIZE);
        chunks.push(...subChunks);
        return { chunks, newCurrentChunk: '' };
      }
      return { chunks, newCurrentChunk: currentChunk + element };
    }

    // Handle text nodes
    if (currentChunk.length + element.length > MAX_CHUNK_SIZE) {
      if (currentChunk) chunks.push(currentChunk);
      const subChunks = splitTextIntoChunks(element, MAX_CHUNK_SIZE);
      chunks.push(...subChunks.slice(0, -1));
      return { chunks, newCurrentChunk: subChunks[subChunks.length - 1] || '' };
    }
    
    return { chunks, newCurrentChunk: currentChunk + element };
  };

  const blockElementsPattern = `(<(?:${BLOCK_ELEMENTS.join('|')})[^>]*>.*?<\/(?:${BLOCK_ELEMENTS.join('|')})>)`;
  const elements = content.split(new RegExp(blockElementsPattern, 'gs'));
  
  const chunks: string[] = [];
  let currentChunk = '';

  for (const element of elements) {
    const { chunks: newChunks, newCurrentChunk } = processElement(element, currentChunk);
    chunks.push(...newChunks);
    currentChunk = newCurrentChunk;
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  // Log chunk information
  console.log(`Split content into ${chunks.length} chunks`);
  chunks.forEach((chunk, i) => {
    console.log(`Chunk ${i + 1} size: ${chunk.length} characters`);
  });

  return chunks;
};