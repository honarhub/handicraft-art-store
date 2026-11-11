import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { testHonarHubPayConnection } from '@/lib/honarhubPay';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'دسترسی غیرمجاز.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { apiKey, baseUrl, isSandbox } = body;

    const result = await testHonarHubPayConnection({
      apiKey,
      baseUrl,
      isSandbox,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'خطای سرور: ' + error.message },
      { status: 500 }
    );
  }
}
