import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';

/**
 * Saves a base64 or data URL to the public uploads folder on local/VPS environments,
 * or gracefully returns the original data URL if running in a read-only serverless environment (like Vercel).
 */
export async function saveUploadImage(
  dataUrlOrPath: string,
  subfolder: 'artists' | 'products' | 'support' | 'blog',
  prefix: string,
  index = 0
): Promise<string> {
  if (!dataUrlOrPath || typeof dataUrlOrPath !== 'string') return dataUrlOrPath;

  // If it's already an existing URL or path, keep it
  if (!dataUrlOrPath.startsWith('data:')) {
    return dataUrlOrPath;
  }

  // If running in Vercel or read-only environment, keep the data URL directly so nothing breaks
  if (process.env.VERCEL) {
    return dataUrlOrPath;
  }

  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', subfolder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const commaIndex = dataUrlOrPath.indexOf(',');
    const header = commaIndex !== -1 ? dataUrlOrPath.substring(0, commaIndex) : '';
    let ext = 'png';
    if (header.includes('video/')) ext = 'mp4';
    else if (header.includes('image/jpeg')) ext = 'jpg';
    else if (header.includes('image/webp')) ext = 'webp';

    const base64Data = commaIndex !== -1 ? dataUrlOrPath.substring(commaIndex + 1) : dataUrlOrPath;
    const fileName = `${prefix}_${Date.now()}_${index}.${ext}`;
    const filePath = path.join(uploadDir, fileName);

    await fsPromises.writeFile(filePath, Buffer.from(base64Data, 'base64'));
    return `/uploads/${subfolder}/${fileName}`;
  } catch (err: any) {
    console.warn(`Filesystem write failed (${err.message}). Falling back to storing data URL in database.`);
    return dataUrlOrPath;
  }
}

/**
 * Synchronous version for endpoints using synchronous operations.
 */
export function saveUploadImageSync(
  dataUrlOrPath: string,
  subfolder: 'artists' | 'products' | 'support' | 'blog',
  prefix: string
): string {
  if (!dataUrlOrPath || typeof dataUrlOrPath !== 'string') return dataUrlOrPath;

  if (!dataUrlOrPath.startsWith('data:')) {
    return dataUrlOrPath;
  }

  if (process.env.VERCEL) {
    return dataUrlOrPath;
  }

  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', subfolder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const commaIndex = dataUrlOrPath.indexOf(',');
    const header = commaIndex !== -1 ? dataUrlOrPath.substring(0, commaIndex) : '';
    let ext = 'png';
    if (header.includes('image/jpeg')) ext = 'jpg';
    else if (header.includes('image/webp')) ext = 'webp';

    const base64Data = commaIndex !== -1 ? dataUrlOrPath.substring(commaIndex + 1) : dataUrlOrPath;
    const fileName = `${prefix}_${Date.now()}.${ext}`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, base64Data, 'base64');
    return `/uploads/${subfolder}/${fileName}`;
  } catch (err: any) {
    console.warn(`Filesystem write failed (${err.message}). Falling back to storing data URL in database.`);
    return dataUrlOrPath;
  }
}
