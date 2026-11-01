import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.pdf': 'application/pdf',
};

/**
 * Universal Route Handler to reliably serve user/artist uploaded files in production.
 * Solves Next.js standalone container file-serving limitations where runtime uploads
 * to public/uploads/ are not pre-indexed by Next.js static asset server.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: segments } = await context.params;
    if (!segments || segments.length === 0) {
      return new NextResponse('File not found', { status: 404 });
    }

    // Sanitize path segments to prevent directory traversal
    const safeSegments = segments.map((s) => s.replace(/(\.\.[\/\\])+/g, '').replace(/[^\w\.\-\_]/g, ''));
    const relativePath = safeSegments.join('/');

    // Check possible filesystem locations in standalone Docker container & local dev
    const candidates = [
      path.join(process.cwd(), 'public', 'uploads', relativePath),
      path.join(process.cwd(), 'uploads', relativePath),
      path.join('/app', 'public', 'uploads', relativePath),
    ];

    let foundPath: string | null = null;
    for (const candidate of candidates) {
      try {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          foundPath = candidate;
          break;
        }
      } catch {
        // Continue checking next candidate
      }
    }

    if (foundPath) {
      const fileBuffer = fs.readFileSync(foundPath);
      const ext = path.extname(foundPath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Length': fileBuffer.length.toString(),
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // Graceful fallback for artist avatar images if file was missing on disk
    if (segments[0] === 'artists') {
      const fallbackSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#064e3b"/>
  <circle cx="100" cy="75" r="40" fill="#10b981"/>
  <path d="M30 180 C30 130, 170 130, 170 180" fill="#10b981"/>
</svg>`.trim();

      return new NextResponse(fallbackSvg, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=60',
        },
      });
    }

    return new NextResponse('File not found', { status: 404 });
  } catch (err: any) {
    console.error('[Upload Serve Error]', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
