import prisma from '@/lib/prisma';
import { getBankInfoByCardNumber, isValidIranianCardNumber } from '@/lib/sms';

export interface HonarHubPayConfig {
  apiKey: string;
  baseUrl: string;
  isSandbox: boolean;
  adminCardNumber?: string;
  adminCardOwnerName?: string;
  adminHonarhubPayCardId?: string;
}

export async function getHonarHubPayConfig(): Promise<HonarHubPayConfig> {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: 'default' },
  });

  const apiKey = (settings?.honarhubPayApiKey || process.env.HONARHUB_PAY_API_KEY || 'hp_sandbox_test_key_2026').trim();
  const baseUrl = (settings?.honarhubPayBaseUrl || process.env.HONARHUB_PAY_BASE_URL || 'https://pay.honarhub.com').trim().replace(/\/$/, '');
  const isSandbox = settings?.honarhubPayIsSandbox ?? true;

  return {
    apiKey,
    baseUrl,
    isSandbox,
    adminCardNumber: settings?.adminCardNumber || undefined,
    adminCardOwnerName: settings?.adminCardOwnerName || undefined,
    adminHonarhubPayCardId: settings?.adminHonarhubPayCardId || undefined,
  };
}

export interface UpsertCardParams {
  ownerName: string;
  cardNumber: string;
  accountNumber?: string;
  bankSlug?: string;
  bankTitle?: string;
}

export interface UpsertCardResponse {
  success: boolean;
  isSandbox?: boolean;
  message?: string;
  cardId?: string;
  data?: any;
  error?: string;
}

/**
 * Registers or updates a debit card in HonarHub Pay
 * Calls POST /api/v1/admin/cards
 */
export async function upsertCardToHonarHubPay(
  params: UpsertCardParams,
  overrideApiKey?: string
): Promise<UpsertCardResponse> {
  const config = await getHonarHubPayConfig();
  const apiKey = overrideApiKey || config.apiKey;

  const cleanCardNumber = params.cardNumber.replace(/\D/g, '');
  if (!isValidIranianCardNumber(cleanCardNumber)) {
    return {
      success: false,
      error: 'شماره کارت بانکی ۱۶ رقمی نامعتبر است (الگوریتم شتاب تایید نشد).',
    };
  }

  const bankInfo = getBankInfoByCardNumber(cleanCardNumber);
  const payload = {
    ownerName: params.ownerName.trim(),
    cardNumber: cleanCardNumber,
    accountNumber: params.accountNumber?.trim() || undefined,
    bankSlug: params.bankSlug || bankInfo.slug,
    bankTitle: params.bankTitle || bankInfo.title,
  };

  try {
    const res = await fetch(`${config.baseUrl}/api/v1/admin/cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'User-Agent': 'HonarHub-Platform/2.0',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.success) {
      return {
        success: false,
        error: data?.error || data?.message || `خطای درگاه: کد وضعیت ${res.status}`,
        data,
      };
    }

    const cardId = data?.data?.id;
    return {
      success: true,
      isSandbox: data.isSandbox ?? config.isSandbox,
      cardId,
      message: data.message,
      data: data.data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `عدم دسترسی به سرور درگاه پرداخت هنرهاب پی: ${err.message}`,
    };
  }
}

export interface PaymentRequestParams {
  amount: number; // in Tomans
  callbackUrl: string;
  cartId?: string; // cardId registered on HonarHub Pay
  cardNumber?: string; // or directly send card number
  description?: string;
  orderId?: string;
  invoiceNumber?: string;
  artistId?: string;
  isDirectArtist?: boolean;
}

export interface PaymentRequestResult {
  success: boolean;
  authority?: string;
  trackingCode?: string;
  paymentUrl?: string;
  payableAmountToman?: number;
  offsetToman?: number;
  expiresAt?: string;
  card?: {
    ownerName: string;
    cardNumber: string;
    bankTitle?: string;
  };
  error?: string;
  raw?: any;
}

/**
 * Initiates payment on HonarHub Pay
 * Calls POST /api/v1/payment/request
 */
export async function createHonarHubPaymentRequest(
  params: PaymentRequestParams
): Promise<PaymentRequestResult> {
  const config = await getHonarHubPayConfig();

  const payload: any = {
    amount: Math.round(params.amount),
    callbackUrl: params.callbackUrl,
    description: params.description || `پرداخت سفارش هنرهاب ${params.orderId ? `(${params.orderId})` : ''}`,
  };

  if (params.cartId) {
    payload.cartId = params.cartId;
  }
  if (params.cardNumber) {
    payload.cardNumber = params.cardNumber.replace(/\D/g, '');
  }

  try {
    const res = await fetch(`${config.baseUrl}/api/v1/payment/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'Accept': 'application/json',
        'User-Agent': 'HonarHub-Platform/2.0',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.success) {
      const errorMsg = data?.error || data?.message || `خطای درگاه: وضعیت ${res.status}`;
      // Log failed payment attempt
      await prisma.paymentLog.create({
        data: {
          orderId: params.orderId || null,
          invoiceNumber: params.invoiceNumber || null,
          amount: params.amount,
          status: 'FAILED',
          gateway: 'HONARHUB_PAY',
          isSandbox: config.isSandbox,
          cardId: params.cartId || null,
          cardNumber: params.cardNumber || null,
          artistId: params.artistId || null,
          isDirectArtist: params.isDirectArtist || false,
          errorMessage: errorMsg,
          requestPayload: payload,
        },
      }).catch((e) => console.error('Failed to log payment failure:', e));

      return {
        success: false,
        error: errorMsg,
        raw: data,
      };
    }

    const resData = data.data || {};
    const authority = resData.authority;
    const trackingCode = resData.trackingCode;
    const paymentUrl = resData.paymentUrl;
    const payableAmountToman = resData.payableAmountToman || params.amount;
    const offsetToman = resData.offsetToman || 0;

    // Log pending payment attempt
    await prisma.paymentLog.create({
      data: {
        orderId: params.orderId || null,
        invoiceNumber: params.invoiceNumber || null,
        authority,
        trackingCode,
        amount: params.amount,
        payableAmount: payableAmountToman,
        offsetAmount: offsetToman,
        status: 'PENDING',
        gateway: 'HONARHUB_PAY',
        isSandbox: data.isSandbox ?? config.isSandbox,
        cardId: params.cartId || null,
        cardNumber: resData.card?.cardNumber || params.cardNumber || null,
        cardOwnerName: resData.card?.ownerName || null,
        bankTitle: resData.card?.bankTitle || null,
        artistId: params.artistId || null,
        isDirectArtist: params.isDirectArtist || false,
        requestPayload: payload,
      },
    }).catch((e) => console.error('Failed to log pending payment:', e));

    return {
      success: true,
      authority,
      trackingCode,
      paymentUrl,
      payableAmountToman,
      offsetToman,
      expiresAt: resData.expiresAt,
      card: resData.card,
      raw: data,
    };
  } catch (err: any) {
    const errorMsg = `عدم امکان ارتباط با درگاه پرداخت هنرهاب پی: ${err.message}`;
    await prisma.paymentLog.create({
      data: {
        orderId: params.orderId || null,
        invoiceNumber: params.invoiceNumber || null,
        amount: params.amount,
        status: 'FAILED',
        gateway: 'HONARHUB_PAY',
        isSandbox: config.isSandbox,
        errorMessage: errorMsg,
        requestPayload: payload,
      },
    }).catch((e) => console.error('Failed to log payment network error:', e));

    return {
      success: false,
      error: errorMsg,
    };
  }
}

export interface VerifyPaymentResult {
  success: boolean;
  status: string; // "PAID", "FAILED", etc.
  message?: string;
  data?: {
    authority?: string;
    trackingCode?: string;
    amountToman?: number;
    paidAt?: string;
    cardLast4?: string;
    bankTitle?: string;
  };
  error?: string;
}

/**
 * Verifies payment on HonarHub Pay
 * Calls POST /api/v1/payment/verify
 */
export async function verifyHonarHubPayment(params: {
  authority?: string;
  trackingCode?: string;
  amount?: number;
}): Promise<VerifyPaymentResult> {
  const config = await getHonarHubPayConfig();

  try {
    const res = await fetch(`${config.baseUrl}/api/v1/payment/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'Accept': 'application/json',
        'User-Agent': 'HonarHub-Platform/2.0',
      },
      body: JSON.stringify(params),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.success) {
      const errorMsg = data?.error || data?.message || 'تایید تراکنش در درگاه ناموفق بود.';
      return {
        success: false,
        status: data?.status || 'FAILED',
        error: errorMsg,
      };
    }

    return {
      success: true,
      status: data.status || 'PAID',
      message: data.message,
      data: data.data,
    };
  } catch (err: any) {
    return {
      success: false,
      status: 'FAILED',
      error: `عدم امکان برقراری ارتباط جهت تایید پرداخت: ${err.message}`,
    };
  }
}

/**
 * Inquires real-time status of payment from HonarHub Pay
 * Calls GET /api/v1/payment/status/{identifier}
 */
export async function checkHonarHubPaymentStatus(identifier: string) {
  const config = await getHonarHubPayConfig();

  try {
    const res = await fetch(`${config.baseUrl}/api/v1/payment/status/${encodeURIComponent(identifier)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'HonarHub-Platform/2.0',
      },
    });

    const data = await res.json().catch(() => null);
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
    };
  }
}
