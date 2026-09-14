import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let settings = await prisma.siteSettings.findUnique({
      where: { id: 'default' }
    });
    
    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: { id: 'default' }
      });
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { featuredSpecialtyId } = await request.json();

    const settings = await prisma.siteSettings.upsert({
      where: { id: 'default' },
      update: { featuredSpecialtyId: featuredSpecialtyId || null },
      create: { id: 'default', featuredSpecialtyId: featuredSpecialtyId || null }
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating site settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
