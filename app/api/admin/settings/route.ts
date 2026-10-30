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

    const recentOtpLogs = await prisma.otpRequestLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({
      ...settings,
      recentOtpLogs
    });
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const {
      featuredSpecialtyId,
      dynamicRows,
      artistAiEnabled,
      isMobileOtpActive,
      smsProvider,
      smsApiKey,
      smsTemplateId,
      smsOtpParamName,
      smsLineNumber,
      otpResendIntervalSeconds,
      otpMaxPerHourPerPhone,
      otpMaxPerTenMinPerIp,
      otpLockoutMinutes
    } = body;

    const updateData: any = {};
    if (featuredSpecialtyId !== undefined) updateData.featuredSpecialtyId = featuredSpecialtyId || null;
    if (dynamicRows !== undefined) updateData.dynamicRows = dynamicRows;
    if (artistAiEnabled !== undefined) updateData.artistAiEnabled = Boolean(artistAiEnabled);
    if (isMobileOtpActive !== undefined) updateData.isMobileOtpActive = Boolean(isMobileOtpActive);
    if (smsProvider !== undefined) updateData.smsProvider = smsProvider;
    if (smsApiKey !== undefined) updateData.smsApiKey = smsApiKey ? smsApiKey.trim() : null;
    if (smsTemplateId !== undefined) updateData.smsTemplateId = smsTemplateId ? smsTemplateId.toString().trim() : null;
    if (smsOtpParamName !== undefined) updateData.smsOtpParamName = (smsOtpParamName || 'Code').trim();
    if (smsLineNumber !== undefined) updateData.smsLineNumber = smsLineNumber ? smsLineNumber.trim() : null;
    if (otpResendIntervalSeconds !== undefined) updateData.otpResendIntervalSeconds = Math.max(10, Number(otpResendIntervalSeconds) || 60);
    if (otpMaxPerHourPerPhone !== undefined) updateData.otpMaxPerHourPerPhone = Math.max(1, Number(otpMaxPerHourPerPhone) || 5);
    if (otpMaxPerTenMinPerIp !== undefined) updateData.otpMaxPerTenMinPerIp = Math.max(1, Number(otpMaxPerTenMinPerIp) || 10);
    if (otpLockoutMinutes !== undefined) updateData.otpLockoutMinutes = Math.max(1, Number(otpLockoutMinutes) || 15);

    const settings = await prisma.siteSettings.upsert({
      where: { id: 'default' },
      update: updateData,
      create: { 
        id: 'default',
        ...(featuredSpecialtyId ? { featuredSpecialtyId } : {}),
        dynamicRows: dynamicRows || [],
        artistAiEnabled: artistAiEnabled !== undefined ? Boolean(artistAiEnabled) : true,
        ...updateData
      }
    });

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Error updating site settings:', error);
    return NextResponse.json({ error: 'Failed to update settings', details: error.message }, { status: 500 });
  }
}
