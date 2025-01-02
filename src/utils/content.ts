const MAX_CHUNK_SIZE = 4000;

/**
 * Splits HTML content into chunks while preserving HTML structure.
 * Each chunk will be approximately MAX_CHUNK_SIZE characters or less.
 * 
 * @param content - The HTML content to split
 * @returns An array of content chunks
 */
export const splitContent = (content: string): string[] => {
  const chunks: string[] = [];
  let currentChunk = '';

  // Find all HTML tags that we want to keep together
  const elements = content.split(/(<(?:p|div|h[1-6]|section)[^>]*>.*?<\/(?:p|div|h[1-6]|section)>)/gs);

  for (const element of elements) {
    if (shouldSplitElement(element, currentChunk)) {
      chunks.push(...splitElement(element, currentChunk));
      currentChunk = '';
    } else {
      currentChunk += element;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  logChunkInfo(chunks);
  return chunks;
};

/**
 * Determines if an element needs to be split based on size constraints
 */
const shouldSplitElement = (element: string, currentChunk: string): boolean => {
  return currentChunk.length + element.length > MAX_CHUNK_SIZE;
};

/**
 * Splits a single HTML element into smaller chunks while preserving structure
 */
const splitElement = (element: string, currentChunk: string): string[] => {
  const chunks: string[] = [];
  
  // If there's a current chunk, add it first
  if (currentChunk) {
    chunks.push(currentChunk);
  }

  // Handle HTML elements
  if (element.startsWith('<') && element.endsWith('>')) {
    return splitHtmlElement(element);
  }
  
  // Handle text nodes
  return splitTextNode(element);
};

/**
 * Splits an HTML element while preserving its structure
 */
const splitHtmlElement = (element: string): string[] => {
  const chunks: string[] = [];
  
  // If the element itself is larger than maxChunkSize
  if (element.length > MAX_CHUNK_SIZE) {
    const openTagMatch = element.match(/<([a-zA-Z0-9]+)[^>]*>/);
    const closeTagMatch = element.match(/<\/([a-zA-Z0-9]+)>/);
    
    if (openTagMatch && closeTagMatch) {
      const [openTag] = openTagMatch;
      const [closeTag] = closeTagMatch;
      const content = element.slice(openTag.length, -closeTag.length);
      
      // Split content into smaller pieces
      const contentChunks = content.match(
        new RegExp(`.{1,${MAX_CHUNK_SIZE - openTag.length - closeTag.length}}`, 'g')
      ) || [];
      
      // Add tags back to each chunk
      contentChunks.forEach(chunk => {
        chunks.push(openTag + chunk + closeTag);
      });
    } else {
      // Fallback: split without preserving structure
      const subChunks = element.match(new RegExp(`.{1,${MAX_CHUNK_SIZE}}`, 'g')) || [];
      chunks.push(...subChunks);
    }
  } else {
    chunks.push(element);
  }
  
  return chunks;
};

/**
 * Splits a text node into smaller chunks
 */
const splitTextNode = (text: string): string[] => {
  const chunks: string[] = [];
  const subChunks = text.match(new RegExp(`.{1,${MAX_CHUNK_SIZE}}`, 'g')) || [];
  chunks.push(...subChunks);
  return chunks;
};

/**
 * Logs information about the generated chunks for debugging
 */
const logChunkInfo = (chunks: string[]): void => {
  console.log(`Split content into ${chunks.length} chunks`);
  chunks.forEach((chunk, i) => {
    console.log(`Chunk ${i + 1} size: ${chunk.length} characters`);
  });
};
