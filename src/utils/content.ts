/**
 * Splits HTML content into chunks while preserving HTML structure.
 * Each chunk will be approximately MAX_CHUNK_SIZE characters or less.
 * 
 * @param content - The HTML content to split
 * @returns An array of content chunks
 */
// Helper function to split content into chunks while preserving HTML structure
export const splitContent = (content: string): string[] => {
  const maxChunkSize = 4000;
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
            const innerContent = element.slice(openTag.length, -closeTag.length);
            
            // Split content into smaller pieces
            const contentChunks = innerContent.match(new RegExp(`.{1,${maxChunkSize - openTag.length - closeTag.length}}`, 'g')) || [];
            
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