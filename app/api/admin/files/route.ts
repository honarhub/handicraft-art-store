import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-for-development');

export async function GET(request: Request) {
  try {
    // 1. Verify Admin Role (Disabled temporarily until Admin Auth is implemented)
    // In a real production app, you would check for an admin session cookie here.

    // 2. Read File
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('path');
    
    if (!fileName || fileName.includes('..') || fileName.includes('/')) {
      return new NextResponse('Invalid file path', { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'private', 'uploads', 'support', fileName);
    
    if (!fs.existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    
    // Determine content type
    let contentType = 'application/octet-stream';
    if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) contentType = 'image/jpeg';
    else if (fileName.endsWith('.png')) contentType = 'image/png';
    else if (fileName.endsWith('.pdf')) contentType = 'application/pdf';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=86400'
      }
    });
  } catch (error) {
    console.error('File Server Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
