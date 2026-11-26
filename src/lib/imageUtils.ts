/**
 * Compresses an image file in the browser using HTML Canvas and createObjectURL for peak performance.
 * Scales down to maxDimension (default: 500px) and converts to JPEG at quality 0.70.
 * Returns a lightweight base64 data URL (~25-35KB) ideal for cloud DB persistence and offline storage.
 */
export async function compressImageFile(file: File, maxDimension = 500, quality = 0.70): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Please select a valid image file'));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for processing'));
    };

    img.onload = () => {
      try {
        URL.revokeObjectURL(objectUrl);

        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Calculate aspect-ratio preserved dimensions
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
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to initialize 2D canvas context'));
          return;
        }

        // Fill background white for transparent images converted to JPEG
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      } catch (err: any) {
        reject(new Error(err.message || 'Image compression failed'));
      }
    };

    img.src = objectUrl;
  });
}
