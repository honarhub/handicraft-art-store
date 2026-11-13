import prisma from '@/lib/prisma';
import { getBankInfoByCardNumber, isValidIranianCardNumber } from '@/lib/sms';

export interface HonarHubPayConfig {
  apiKey: string;
  baseUrl: string;
  adminCardNumber?: string;
  adminCardOwnerName?: string;
  adminHonarhubPayCardId?: string;
}

export async function getHonarHubPayConfig(): Promise<HonarHubPayConfig> {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: 'default' },
  });

  const apiKey = (settings?.honarhubPayApiKey || process.env.HONARHUB_PAY_API_KEY || '').trim();
  const baseUrl = (settings?.honarhubPayBaseUrl || process.env.HONARHUB_PAY_BASE_URL || 'https://pay.honarhub.com').trim().replace(/\/$/, '');

  return {
    apiKey,
    baseUrl,
    adminCardNumber: settings?.adminCardNumber || undefined,
    adminCardOwnerName: settings?.adminCardOwnerName || undefined,
    adminHonarhubPayCardId: settings?.adminHonarhubPayCardId || undefined,
  };
}

export interface UpsertCardParams {
  ownerName: string;
  cardNumber: string;
  iban?: string;
  bankSlug?: string;
  bankTitle?: string;
}

export interface UpsertCardResponse {
  success: boolean;
  status: number;
  message?: string;
  cardId?: string;
  data?: any;
  error?: string;
  requestPayload?: any;
  requestHeaders?: Record<string, string>;
  requestUrl?: string;
  requestMethod?: string;
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
  const apiKey = (overrideApiKey || config.apiKey).trim();

  const cleanCardNumber = params.cardNumber.replace(/\D/g, '');
  if (!isValidIranianCardNumber(cleanCardNumber)) {
    return {
      success: false,
      status: 400,
      error: 'شماره کارت بانکی ۱۶ رقمی نامعتبر است (الگوریتم شتاب تایید نشد).',
    };
  }

  const bankInfo = getBankInfoByCardNumber(cleanCardNumber);

  // Clean IBAN (optional: 24 digits or IR + 24 digits)
  let cleanIban: string | undefined = undefined;
  if (params.iban && params.iban.trim()) {
    const rawIban = params.iban.trim().replace(/\s+/g, '').toUpperCase();
    cleanIban = rawIban.startsWith('IR') ? rawIban : `IR${rawIban}`;
  }

  const payload: any = {
    ownerName: params.ownerName.trim(),
    cardNumber: cleanCardNumber,
  };
  if (cleanIban) payload.iban = cleanIban;
  if (params.bankTitle || bankInfo.title) payload.bankTitle = params.bankTitle || bankInfo.title;
  if (params.bankSlug || bankInfo.slug) payload.bankSlug = params.bankSlug || bankInfo.slug;

  // Exact headers as specified in https://pay.honarhub.com/docs
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'Accept': 'application/json',
  };

  const endpointUrl = `${config.baseUrl}/api/v1/admin/cards`;

  try {
    const res = await fetch(endpointUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const rawText = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { rawText };
    }

    if (!res.ok || !data?.success) {
      let errorMsg = data?.error || data?.message;
      if (res.status === 401) {
        errorMsg = 'عدم احراز هویت درگاه (Unauthorized - 401): کلید وب‌سرویس وارد شده در سرور درگاه معتبر نیست یا مجوز ثبت کارت ندارد.';
      } else if (!errorMsg) {
        errorMsg = `خطای سرور درگاه: کد وضعیت ${res.status}`;
      }
      return {
        success: false,
        status: res.status,
        error: errorMsg,
        data,
        requestPayload: payload,
        requestHeaders: headers,
        requestUrl: endpointUrl,
        requestMethod: 'POST',
      };
    }

    const cardId = data?.data?.id;
    return {
      success: true,
      status: res.status,
      cardId,
      message: data.message || 'کارت با موفقیت در درگاه ثبت گردید.',
      data: data.data,
      requestPayload: payload,
      requestHeaders: headers,
      requestUrl: endpointUrl,
      requestMethod: 'POST',
    };
  } catch (err: any) {
    return {
      success: false,
      status: 0,
      error: `عدم دسترسی به سرور درگاه پرداخت هنرهاب پی: ${err.message}`,
      requestPayload: payload,
      requestHeaders: headers,
      requestUrl: endpointUrl,
      requestMethod: 'POST',
    };
  }
}

export interface DeleteCardParams {
  cardId?: string;
  cardNumber?: string;
}

export interface DeleteCardResponse {
  success: boolean;
  status: number;
  message?: string;
  error?: string;
  data?: any;
}

/**
 * Soft deletes / archives a card on HonarHub Pay
 * Calls DELETE /api/v1/card/delete
 */
export async function deleteCardFromHonarHubPay(
  params: DeleteCardParams,
  overrideApiKey?: string
): Promise<DeleteCardResponse> {
  const config = await getHonarHubPayConfig();
  const apiKey = (overrideApiKey || config.apiKey).trim();

  const payload: any = {};
  if (params.cardId) payload.cardId = params.cardId;
  if (params.cardNumber) payload.cardNumber = params.cardNumber.replace(/\D/g, '');

  if (!payload.cardId && !payload.cardNumber) {
    return {
      success: false,
      status: 400,
      error: 'حداقل یکی از مقادیر شناسه کارت یا شماره کارت الزامی است.',
    };
  }

  const endpointUrl = `${config.baseUrl}/api/v1/card/delete`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'Accept': 'application/json',
  };

  try {
    const res = await fetch(endpointUrl, {
      method: 'DELETE',
      headers,
      body: JSON.stringify(payload),
    });

    const rawText = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { rawText };
    }

    if (!res.ok || !data?.success) {
      let errorMsg = data?.error || data?.message;
      if (res.status === 401) {
        errorMsg = 'عدم احراز هویت درگاه (Unauthorized - 401): کلید وب‌سرویس نامعتبر است.';
      } else if (!errorMsg) {
        errorMsg = `خطای سرور درگاه در حذف کارت: کد وضعیت ${res.status}`;
      }
      return {
        success: false,
        status: res.status,
        error: errorMsg,
        data,
      };
    }

    return {
      success: true,
      status: res.status,
      message: data?.message || 'کارت بانکی با موفقیت از درگاه هنرهاب پی حذف نرم شد.',
      data: data?.data,
    };
  } catch (err: any) {
    return {
      success: false,
      status: 0,
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
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'Authorization': `Bearer ${config.apiKey}`,
      'Accept': 'application/json',
      'User-Agent': 'HonarHub-Platform/2.0',
    };

    const res = await fetch(`${config.baseUrl}/api/v1/payment/request`, {
      method: 'POST',
      headers,
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
          isSandbox: false,
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
        isSandbox: false,
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
        isSandbox: false,
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
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'Authorization': `Bearer ${config.apiKey}`,
      'Accept': 'application/json',
      'User-Agent': 'HonarHub-Platform/2.0',
    };

    const res = await fetch(`${config.baseUrl}/api/v1/payment/verify`, {
      method: 'POST',
      headers,
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

/**
 * Tests connection and authentication with HonarHub Pay without creating any test payment transaction
 */
export async function testHonarHubPayConnection(overrideConfig?: {
  apiKey?: string;
  baseUrl?: string;
}): Promise<{ success: boolean; message: string; raw?: any }> {
  const currentConfig = await getHonarHubPayConfig();
  const apiKey = (overrideConfig?.apiKey || currentConfig.apiKey).trim();
  const baseUrl = (overrideConfig?.baseUrl || currentConfig.baseUrl).trim().replace(/\/$/, '');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'Accept': 'application/json',
  };

  try {
    // Pure auth check via GET /api/v1/admin/cards - Never creates any fake payment request / transaction
    const res = await fetch(`${baseUrl}/api/v1/admin/cards`, {
      method: 'GET',
      headers,
    });

    const data = await res.json().catch(() => null);

    if (res.status === 401 || (!res.ok && data?.error === 'Unauthorized')) {
      return {
        success: false,
        message: 'عدم احراز هویت (401 Unauthorized): کلید وارد شده در سرور درگاه هنرهاب پی معتبر نیست.',
        raw: data,
      };
    }

    if (!res.ok) {
      return {
        success: false,
        message: data?.error || data?.message || `پاسخ ناموفق از درگاه: کد وضعیت ${res.status}`,
        raw: data,
      };
    }

    return {
      success: true,
      message: 'ارتباط با درگاه هنرهاب پی برقرار شد و کلید وب‌سرویس تایید گردید (بدون ایجاد درگاه یا تراکنش تستی).',
      raw: data,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `خطای شبکه در برقراری ارتباط با سرور درگاه: ${err.message}`,
    };
  }
}
