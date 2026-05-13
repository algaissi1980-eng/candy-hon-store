import imageCompression from 'browser-image-compression';

/**
 * ضغط الصورة قبل الرفع — يُقلل الحجم بنسبة 70-90%
 */
export async function compressImage(
  file: File,
  options?: {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
  }
): Promise<File> {
  const defaults = {
    maxSizeMB: 0.4,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: 'image/webp' as const,
    initialQuality: 0.82,
  };

  try {
    const compressed = await imageCompression(file, { ...defaults, ...options });
    const webpName = file.name.replace(/\.[^.]+$/, '.webp');
    return new File([compressed], webpName, { type: 'image/webp' });
  } catch (error) {
    console.warn('Image compression failed, using original:', error);
    return file;
  }
}
