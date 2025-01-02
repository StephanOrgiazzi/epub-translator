export const sanitizeFilename = (filename: string): string => {
  // Remove problematic characters and replace spaces with underscores
  const sanitized = filename
    // Remove any characters that aren't alphanumeric, dots, dashes, or underscores
    .replace(/[^a-zA-Z0-9.-_]/g, '_')
    // Replace multiple consecutive underscores with a single one
    .replace(/_+/g, '_')
    // Remove underscores from the start and end
    .replace(/^_+|_+$/g, '')
    // Ensure the extension is preserved
    .replace(/\.epub$/i, '.epub');

  // If filename becomes empty after sanitization, provide a default
  return sanitized || 'book.epub';
};

export const truncateFilename = (filename: string, maxLength: number = 50): string => {
  if (filename.length <= maxLength) return filename;
  
  const extension = filename.slice(filename.lastIndexOf('.'));
  const nameWithoutExt = filename.slice(0, filename.lastIndexOf('.'));
  
  // Reserve space for the extension and ellipsis
  const truncatedLength = maxLength - extension.length - 3;
  return `${nameWithoutExt.slice(0, truncatedLength)}...${extension}`;
};
