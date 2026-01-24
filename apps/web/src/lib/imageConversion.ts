/**
 * Image Conversion Utilities
 *
 * Handles conversion of unsupported image formats (like HEIC from iOS)
 * to web-compatible formats, and resizes images to appropriate dimensions
 * for vision API processing.
 */

import heic2any from 'heic2any';

/**
 * Maximum dimension for images sent to vision APIs.
 * GPT-4o vision works best with images up to 2048px on the longest side.
 */
const MAX_IMAGE_DIMENSION = 2048;

/**
 * Maximum file size in bytes (5MB is safe for most vision APIs)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Check if a file is a HEIC/HEIF image
 */
function isHeicFile(file: File): boolean {
  const mimeType = file.type.toLowerCase();
  const extension = file.name.toLowerCase();

  return (
    mimeType === 'image/heic' ||
    mimeType === 'image/heif' ||
    extension.endsWith('.heic') ||
    extension.endsWith('.heif')
  );
}

/**
 * Load an image file into an HTMLImageElement
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Resize and compress an image using canvas
 *
 * @param img - The loaded image element
 * @param maxDimension - Maximum width or height
 * @param quality - JPEG/WebP quality (0-1)
 * @param format - Output format ('image/webp' or 'image/jpeg')
 * @returns Blob of the resized image
 */
function resizeImage(
  img: HTMLImageElement,
  maxDimension: number,
  quality: number,
  format: 'image/webp' | 'image/jpeg' = 'image/webp'
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    let { width, height } = img;

    // Calculate new dimensions maintaining aspect ratio
    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    // Use high-quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      },
      format,
      quality
    );
  });
}

/**
 * Convert a HEIC/HEIF image to WebP format
 *
 * @param file - The HEIC/HEIF image file
 * @returns WebP blob
 */
async function convertHeicToBlob(file: File): Promise<Blob> {
  const blob = await heic2any({
    blob: file,
    toType: 'image/webp',
    quality: 0.8,
  });

  // heic2any can return an array if multiple is true, but we use single mode
  return Array.isArray(blob) ? blob[0] : blob;
}

/**
 * Process an image file for upload to vision APIs.
 *
 * This function:
 * 1. Converts HEIC/HEIF images to WebP format
 * 2. Resizes large images to max 2048px dimension
 * 3. Compresses to keep file size under 5MB
 *
 * @param file - The image file to process
 * @returns Processed file ready for upload
 */
export async function processImageForUpload(file: File): Promise<File> {
  let processedBlob: Blob;
  let img: HTMLImageElement;

  // Step 1: Handle HEIC conversion first
  if (isHeicFile(file)) {
    const webpBlob = await convertHeicToBlob(file);
    // Create a temporary file to load into image element
    const tempFile = new File([webpBlob], 'temp.webp', { type: 'image/webp' });
    img = await loadImage(tempFile);
    URL.revokeObjectURL(img.src);
  } else {
    img = await loadImage(file);
  }

  // Step 2: Check if resizing is needed
  const needsResize =
    img.width > MAX_IMAGE_DIMENSION ||
    img.height > MAX_IMAGE_DIMENSION ||
    file.size > MAX_FILE_SIZE;

  if (!needsResize && !isHeicFile(file)) {
    // Image is small enough, return original
    URL.revokeObjectURL(img.src);
    return file;
  }

  // Step 3: Resize and compress
  // Start with quality 0.85 and reduce if file is still too large
  let quality = 0.85;
  processedBlob = await resizeImage(img, MAX_IMAGE_DIMENSION, quality);

  // If still too large, progressively reduce quality
  while (processedBlob.size > MAX_FILE_SIZE && quality > 0.5) {
    quality -= 0.1;
    processedBlob = await resizeImage(img, MAX_IMAGE_DIMENSION, quality);
  }

  // If still too large with quality 0.5, try JPEG which often compresses better for photos
  if (processedBlob.size > MAX_FILE_SIZE) {
    processedBlob = await resizeImage(img, MAX_IMAGE_DIMENSION, 0.8, 'image/jpeg');
  }

  URL.revokeObjectURL(img.src);

  // Generate appropriate filename
  const isWebp = processedBlob.type === 'image/webp';
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const newName = `${baseName}.${isWebp ? 'webp' : 'jpg'}`;

  return new File([processedBlob], newName, { type: processedBlob.type });
}

/**
 * @deprecated Use processImageForUpload instead which handles both conversion and resizing
 */
export async function convertHeicToWebp(file: File): Promise<File> {
  return processImageForUpload(file);
}

/**
 * Check if a file needs processing before upload
 * (either HEIC conversion or resizing for large files)
 */
export function needsConversion(file: File): boolean {
  return isHeicFile(file) || file.size > MAX_FILE_SIZE;
}
