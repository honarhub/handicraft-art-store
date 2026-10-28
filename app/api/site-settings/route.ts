import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'default' },
      select: {
        artistAiEnabled: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      artistAiEnabled: settings?.artistAiEnabled ?? true
    });
  } catch (error) {
    console.error('Error fetching site settings for client:', error);
    return NextResponse.json({ artistAiEnabled: true });
  }
}
