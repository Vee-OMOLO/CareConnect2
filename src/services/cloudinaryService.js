// Cloudinary upload service for photo uploads
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const API_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

/**
 * Upload an image file to Cloudinary
 * @param {File} file - The image file to upload
 * @param {Function} onProgress - Optional progress callback (0-100)
 * @returns {Promise<{url: string, publicId: string}>} The uploaded image info
 */
export async function uploadImage(file, onProgress) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary not configured. Check your .env.local file.');
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
