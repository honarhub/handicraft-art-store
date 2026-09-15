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
    const { featuredSpecialtyId, dynamicRows } = await request.json();

    const updateData: any = {};
    if (featuredSpecialtyId !== undefined) updateData.featuredSpecialtyId = featuredSpecialtyId || null;
    if (dynamicRows !== undefined) updateData.dynamicRows = dynamicRows;

    const settings = await prisma.siteSettings.upsert({
      where: { id: 'default' },
      update: updateData,
      create: { 
        id: 'default', 
        featuredSpecialtyId: featuredSpecialtyId || null,
        dynamicRows: dynamicRows || []
      }
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating site settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
