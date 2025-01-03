import JSZip from "jszip";

export const truncateFilename = (filename: string, maxLength: number = 30) => {
  if (filename.length <= maxLength) return filename;
  const extension = filename.split('.').pop();
  const nameWithoutExt = filename.slice(0, filename.lastIndexOf('.'));
  const truncatedName = nameWithoutExt.slice(0, maxLength - 3 - (extension?.length || 0));
  return `${truncatedName}...${extension}`;
};

export const findHtmlFiles = (epubZip: JSZip) => 
  Object.keys(epubZip.files).filter(filename => 
    filename.endsWith('.html') || filename.endsWith('.xhtml')
  );

export const downloadTranslatedEpub = (blob: Blob, originalName: string, targetLanguage: string) => {
  const downloadUrl = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  downloadLink.href = downloadUrl;
  downloadLink.download = originalName.replace('.epub', `_${targetLanguage}.epub`);
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(downloadUrl);
};
