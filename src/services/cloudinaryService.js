// Cloudinary upload service for photo uploads
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const API_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

// Compress an image client-side into a data URL (used when Cloudinary is not
// configured, so photo capture still works offline/local).
function compressToDataUrl(file, maxDim = 1280, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve({ url: canvas.toDataURL('image/jpeg', quality), width: w, height: h });
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Upload an image file to Cloudinary
 * @param {File} file - The image file to upload
 * @param {Function} onProgress - Optional progress callback (0-100)
 * @returns {Promise<{url: string, publicId?: string}>} The uploaded image info
 */
export async function uploadImage(file, onProgress) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    // Fallback: compress locally to a data URL so uploads always work.
    const result = await compressToDataUrl(file);
    if (onProgress) onProgress(100);
    return result;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'careconnect');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        resolve({
          url: data.secure_url,
          publicId: data.public_id,
          width: data.width,
          height: data.height,
        });
      } else {
        const error = JSON.parse(xhr.responseText);
        reject(new Error(error.error?.message || 'Upload failed'));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')));

    xhr.open('POST', API_URL);
    xhr.send(formData);
  });
}

/**
 * Validate an image file before upload
 * @param {File} file
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateImage(file) {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Please use JPEG, PNG, WebP, or HEIC images.' };
  }
  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'Image must be under 5 MB.' };
  }
  return { valid: true };
}
