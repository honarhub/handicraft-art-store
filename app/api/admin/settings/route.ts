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
      isProfileSmsActive,
      smsProvider,
      smsIsSandbox,
      smsApiKey,
      smsSandboxApiKey,
      smsTemplateId,
      smsOtpParamName,
      smsReferralTemplateId,
      smsReferralParamName,
      smsProfileTemplateId,
      smsProfileParamName,
      smsLineNumber,
      farazSmsApiKey,
      farazSmsLineNumber,
      farazSmsPatternCode,
      farazSmsOtpParamName,
      farazSmsProfilePatternCode,
      farazSmsProfileParamName,
      farazSmsReferralPatternCode,
      farazSmsReferralParamName,
      farazSmsReferralWithNamePatternCode,
      farazSmsReferralNameParamName,
      smsReferralWithNameTemplateId,
      smsReferralNameParamName,
      otpResendIntervalSeconds,
      otpMaxPerHourPerPhone,
      otpMaxPerTenMinPerIp,
      otpLockoutMinutes,
      isEmailServiceActive,
      emailIsSandbox,
      resendApiKey,
      emailFromAddress,
      emailFromName
    } = body;

    const updateData: any = {};
    if (featuredSpecialtyId !== undefined) updateData.featuredSpecialtyId = featuredSpecialtyId || null;
    if (dynamicRows !== undefined) updateData.dynamicRows = dynamicRows;
    if (artistAiEnabled !== undefined) updateData.artistAiEnabled = Boolean(artistAiEnabled);
    if (isMobileOtpActive !== undefined) updateData.isMobileOtpActive = Boolean(isMobileOtpActive);
    if (isProfileSmsActive !== undefined) updateData.isProfileSmsActive = Boolean(isProfileSmsActive);
    if (smsProvider !== undefined) updateData.smsProvider = smsProvider;
    if (smsIsSandbox !== undefined) updateData.smsIsSandbox = Boolean(smsIsSandbox);
    if (smsApiKey !== undefined) updateData.smsApiKey = smsApiKey ? smsApiKey.trim() : null;
    if (smsSandboxApiKey !== undefined) updateData.smsSandboxApiKey = smsSandboxApiKey ? smsSandboxApiKey.trim() : null;
    if (smsTemplateId !== undefined) updateData.smsTemplateId = smsTemplateId ? smsTemplateId.toString().trim() : null;
    if (smsOtpParamName !== undefined) updateData.smsOtpParamName = (smsOtpParamName || 'Code').trim();
    if (smsReferralTemplateId !== undefined) updateData.smsReferralTemplateId = smsReferralTemplateId ? smsReferralTemplateId.toString().trim() : null;
    if (smsReferralParamName !== undefined) updateData.smsReferralParamName = (smsReferralParamName || 'Code').trim();
    if (smsProfileTemplateId !== undefined) updateData.smsProfileTemplateId = smsProfileTemplateId ? smsProfileTemplateId.toString().trim() : null;
    if (smsProfileParamName !== undefined) updateData.smsProfileParamName = (smsProfileParamName || 'Code').trim();
    if (smsLineNumber !== undefined) updateData.smsLineNumber = smsLineNumber ? smsLineNumber.trim() : null;
    if (farazSmsApiKey !== undefined) updateData.farazSmsApiKey = farazSmsApiKey ? farazSmsApiKey.trim() : null;
    if (farazSmsLineNumber !== undefined) updateData.farazSmsLineNumber = farazSmsLineNumber ? farazSmsLineNumber.trim() : null;
    if (farazSmsPatternCode !== undefined) updateData.farazSmsPatternCode = farazSmsPatternCode ? farazSmsPatternCode.trim() : null;
    if (farazSmsOtpParamName !== undefined) updateData.farazSmsOtpParamName = (farazSmsOtpParamName || 'code').trim();
    if (farazSmsProfilePatternCode !== undefined) updateData.farazSmsProfilePatternCode = farazSmsProfilePatternCode ? farazSmsProfilePatternCode.trim() : null;
    if (farazSmsProfileParamName !== undefined) updateData.farazSmsProfileParamName = (farazSmsProfileParamName || 'code').trim();
    if (farazSmsReferralPatternCode !== undefined) updateData.farazSmsReferralPatternCode = farazSmsReferralPatternCode ? farazSmsReferralPatternCode.trim() : null;
    if (farazSmsReferralParamName !== undefined) updateData.farazSmsReferralParamName = (farazSmsReferralParamName || 'code').trim();
    if (farazSmsReferralWithNamePatternCode !== undefined) updateData.farazSmsReferralWithNamePatternCode = farazSmsReferralWithNamePatternCode ? farazSmsReferralWithNamePatternCode.trim() : null;
    if (farazSmsReferralNameParamName !== undefined) updateData.farazSmsReferralNameParamName = (farazSmsReferralNameParamName || 'name').trim();
    if (smsReferralWithNameTemplateId !== undefined) updateData.smsReferralWithNameTemplateId = smsReferralWithNameTemplateId ? smsReferralWithNameTemplateId.toString().trim() : null;
    if (smsReferralNameParamName !== undefined) updateData.smsReferralNameParamName = (smsReferralNameParamName || 'name').trim();
    if (otpResendIntervalSeconds !== undefined) updateData.otpResendIntervalSeconds = Math.max(10, Number(otpResendIntervalSeconds) || 60);
    if (otpMaxPerHourPerPhone !== undefined) updateData.otpMaxPerHourPerPhone = Math.max(1, Number(otpMaxPerHourPerPhone) || 5);
    if (otpMaxPerTenMinPerIp !== undefined) updateData.otpMaxPerTenMinPerIp = Math.max(1, Number(otpMaxPerTenMinPerIp) || 10);
    if (otpLockoutMinutes !== undefined) updateData.otpLockoutMinutes = Math.max(1, Number(otpLockoutMinutes) || 15);
    if (isEmailServiceActive !== undefined) updateData.isEmailServiceActive = Boolean(isEmailServiceActive);
    if (emailIsSandbox !== undefined) updateData.emailIsSandbox = Boolean(emailIsSandbox);
    if (resendApiKey !== undefined) updateData.resendApiKey = resendApiKey ? resendApiKey.trim() : null;
    if (emailFromAddress !== undefined) updateData.emailFromAddress = emailFromAddress ? emailFromAddress.trim() : 'no-reply@honarhub.com';
    if (emailFromName !== undefined) updateData.emailFromName = emailFromName ? emailFromName.trim() : 'هنرهاب';

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
