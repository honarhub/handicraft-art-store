'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SpecialtyTagInput, { Specialty } from '@/app/components/SpecialtyTagInput';
import SocialLinksInput from '@/app/components/SocialLinksInput';
import AvatarCropModal from '@/app/components/AvatarCropModal';
import { normalizePhoneNumber, isValidIranianMobile, hasProfilePendingEdits } from '@/lib/sms';
import { IRAN_PROVINCES } from '@/lib/provinces';

export default function ArtistProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [artist, setArtist] = useState<any>(null);
  const [pendingMode, setPendingMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const errorRef = useRef<HTMLDivElement>(null);
  const validationErrorRef = useRef<HTMLDivElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const isFormDirtyRef = useRef<boolean>(false);
  const lastSentEmailRef = useRef<string>('');
  const lastSentPhoneRef = useRef<string>('');
  const [successMsg, setSuccessMsg] = useState('');
  const [generalAlertDismissed, setGeneralAlertDismissed] = useState(false);

  const scrollToError = (targetElement?: HTMLElement | null) => {
    setTimeout(() => {
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (errorRef.current) {
        errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      // Ensure the scrollable container (<main> or window) smoothly scrolls to top if viewing global alert
      const mainEl = document.querySelector('main');
      if (mainEl && (!targetElement || targetElement === errorRef.current)) {
        mainEl.scrollTo({ top: 0, behavior: 'smooth' });
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 60);
  };

  const extractGeneralMsg = (feedback: any) => {
    if (!feedback) return null;
    try {
      const parsed = typeof feedback === 'string' ? JSON.parse(feedback) : feedback;
      if (parsed?._generalMessage && typeof parsed._generalMessage === 'string' && parsed._generalMessage.trim().length > 0) {
        return parsed._generalMessage.trim();
      }
    } catch {}
    return null;
  };

  const handleDismissGeneralAlert = (msg: string) => {
    setGeneralAlertDismissed(true);
    try {
      localStorage.setItem(`alert_dismissed_${artist?.id || 'default'}_${encodeURIComponent(msg)}`, 'true');
    } catch {}
  };

  // AI Resume Auto-Complete states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCountdown, setAiCountdown] = useState(90);
  const [aiError, setAiError] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const isCancelledRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Avatar crop modal states
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImageForCrop, setRawImageForCrop] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [province, setProvince] = useState('تهران');
  const [city, setCity] = useState('تهران');
  const [bio, setBio] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [socialLinks, setSocialLinks] = useState<any>({});
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  // Auth/Verification statuses from backend
  const [isSsoUser, setIsSsoUser] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  // Phone OTP Modal States (Required for every profile submission)
  const [showPhoneOtpModal, setShowPhoneOtpModal] = useState(false);
  const [phoneOtpCode, setPhoneOtpCode] = useState('');
  const [phoneOtpLoading, setPhoneOtpLoading] = useState(false);
  const [phoneOtpTimer, setPhoneOtpTimer] = useState(0);
  const [phoneOtpError, setPhoneOtpError] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [devMode, setDevMode] = useState<'MOCK' | 'SANDBOX' | null>(null);

  // Email OTP Modal States (Optional for email verification)
  const [showEmailOtpModal, setShowEmailOtpModal] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [emailOtpLoading, setEmailOtpLoading] = useState(false);
  const [emailOtpTimer, setEmailOtpTimer] = useState(0);
  const [emailOtpError, setEmailOtpError] = useState('');

  // Global site setting for artist AI
  const [artistAiEnabled, setArtistAiEnabled] = useState(true);

  const fetchProfile = async (silent = false, preserveFormData = false) => {
    try {
      if (!silent) setLoading(true);
      const [res, settingsRes] = await Promise.all([
        fetch('/api/artist/profile', { cache: 'no-store' }),
        fetch('/api/site-settings', { cache: 'no-store' }).catch(() => null)
      ]);
      const data = await res.json();

      if (settingsRes && settingsRes.ok) {
        const settingsData = await settingsRes.json();
        if (settingsData && typeof settingsData.artistAiEnabled === 'boolean') {
          setArtistAiEnabled(settingsData.artistAiEnabled);
        }
      }
      
      if (!res.ok) throw new Error(data.error || 'خطا در دریافت اطلاعات');

      setArtist(data);
      setIsSsoUser(Boolean(data.isSsoUser));
      setIsPhoneVerified(Boolean(data.isPhoneVerified));
      setIsEmailVerified(Boolean(data.isEmailVerified));

      if (hasProfilePendingEdits(data.pendingEdits)) {
        let edits = data.pendingEdits;
        if (typeof edits === 'string') {
          try { edits = JSON.parse(edits); } catch { edits = {}; }
        }
        setPendingMode(true);
        if (!preserveFormData && !isFormDirtyRef.current) {
          setName(edits.name || data.user?.name || '');
          setBrandName(edits.brandName || data.brandName || '');
          setProvince(edits.province || data.province || 'تهران');
          setCity(edits.city || data.city || 'تهران');
          setBio(edits.bio || data.bio || '');
          setPortfolioUrl(edits.portfolioUrl || data.portfolioUrl || '');
          setImagePreview(edits.image || data.user?.image || null);
          setSpecialties(edits.specialties || data.specialties || []);
          setSocialLinks(edits.socialLinks || data.socialLinks || {});
          setPhoneNumber(edits.phoneNumber || data.user?.phoneNumber || '');
          setEmail(edits.email || data.user?.email || '');
        }
      } else {
        setPendingMode(false);
        setSuccessMsg('');
        if (!preserveFormData && !isFormDirtyRef.current) {
          setName(data.user?.name || '');
          setBrandName(data.brandName || '');
          setProvince(data.province || 'تهران');
          setCity(data.city || 'تهران');
          setBio(data.bio || '');
          setPortfolioUrl(data.portfolioUrl || '');
          setImagePreview(data.user?.image || null);
          setSpecialties(data.specialties || []);
          setSocialLinks(data.socialLinks || {});
          setPhoneNumber(data.user?.phoneNumber || '');
          setEmail(data.user?.email || '');
        }

        if (data.adminFeedback) {
          try {
            const parsed = typeof data.adminFeedback === 'string' ? JSON.parse(data.adminFeedback) : data.adminFeedback;
            if (typeof parsed === 'object' && parsed !== null) {
              const errs: Record<string, string> = {};
              Object.entries(parsed).forEach(([k, v]) => {
                if (k !== '_generalMessage' && typeof v === 'string') {
                  errs[k] = v;
                }
              });
              setFieldErrors(errs);
            }
          } catch {}
        } else {
          setFieldErrors({});
        }
      }
    } catch (err: any) {
      if (!silent) {
        setErrorMsg(err.message || 'خطا در بارگذاری اطلاعات');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const pendingModeRef = useRef(pendingMode);
  useEffect(() => {
    pendingModeRef.current = pendingMode;
  }, [pendingMode]);

  useEffect(() => {
    const msg = extractGeneralMsg(artist?.adminFeedback);
    if (msg) {
      try {
        const isDismissed = localStorage.getItem(`alert_dismissed_${artist?.id || 'default'}_${encodeURIComponent(msg)}`);
        setGeneralAlertDismissed(isDismissed === 'true');
      } catch {
        setGeneralAlertDismissed(false);
      }
    } else {
      setGeneralAlertDismissed(false);
    }
  }, [artist?.id, artist?.adminFeedback]);

  useEffect(() => {
    // Initial fetch once on page mount
    fetchProfile(false);

    // Auto-update admin feedback & locked state seamlessly without needing tab switching
    const handleStatusUpdate = (e: any) => {
      if (!e?.detail) return;
      const detail = e.detail;

      // Sync admin feedback & field errors immediately from event payload
      if (detail.adminFeedback !== undefined) {
        setSuccessMsg('');
        setArtist((prev: any) => ({
          ...(prev || {}),
          adminFeedback: detail.adminFeedback,
          pendingEdits: detail.hasPendingEdits ? prev?.pendingEdits : null
        }));

        if (detail.adminFeedback) {
          try {
            const parsed = typeof detail.adminFeedback === 'string' ? JSON.parse(detail.adminFeedback) : detail.adminFeedback;
            if (typeof parsed === 'object' && parsed !== null) {
              const errs: Record<string, string> = {};
              Object.entries(parsed).forEach(([k, v]) => {
                if (k !== '_generalMessage' && typeof v === 'string') {
                  errs[k] = v;
                }
              });
              setFieldErrors(errs);
            }
          } catch {}
        } else {
          setFieldErrors({});
        }
      }

      // If review completed (hasPendingEdits is false) and we were in pendingMode, exit pendingMode and refresh profile data
      if (pendingModeRef.current && detail.hasPendingEdits === false) {
        setPendingMode(false);
        setSuccessMsg('');
        isFormDirtyRef.current = false;
        fetchProfile(true);
      }
    };

    const handleFocus = () => {
      // ONLY check/refresh live profile metadata if currently in pendingMode (waiting for admin review)
      // Never refresh or wipe while the artist is actively editing the form
      if (pendingModeRef.current && !isFormDirtyRef.current) {
        fetchProfile(true, true);
      }
    };

    window.addEventListener('artist-status-updated', handleStatusUpdate);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('artist-status-updated', handleStatusUpdate);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // OTP Countdown Timers
  useEffect(() => {
    let intv: any = null;
    if (phoneOtpTimer > 0) {
      intv = setInterval(() => setPhoneOtpTimer(t => t - 1), 1000);
    }
    return () => clearInterval(intv);
  }, [phoneOtpTimer]);

  useEffect(() => {
    let intv: any = null;
    if (emailOtpTimer > 0) {
      intv = setInterval(() => setEmailOtpTimer(t => t - 1), 1000);
    }
    return () => clearInterval(intv);
  }, [emailOtpTimer]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      setRawImageForCrop(base64);
      setCropModalOpen(true);
      setErrorMsg('');
      setFieldErrors(prev => ({ ...prev, image: '' }));
      setValidationErrors([]);
    } catch {
      setErrorMsg('خطا در بارگذاری تصویر');
    } finally {
      e.target.value = '';
    }
  };

  const handleCropComplete = (croppedBase64: string) => {
    isFormDirtyRef.current = true;
    setImagePreview(croppedBase64);
    setCropModalOpen(false);
    setRawImageForCrop(null);
    setFieldErrors(prev => ({ ...prev, image: '' }));
  };

  // --- AI Auto Complete Handlers ---
  const handleCancelAi = () => {
    isCancelledRef.current = true;
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setAiLoading(false);
    setAiError('فرآیند هوش مصنوعی لغو شد.');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAiUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAiError('');
    setAiLoading(true);
    setAiCountdown(90);
    isCancelledRef.current = false;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timeoutId = setTimeout(() => controller.abort(), 90000);
    const timerInterval = setInterval(() => {
      setAiCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    try {
      const base64Str = await fileToBase64(file);
      const mimeType = file.type || 'text/plain';
      const base64Data = base64Str.split(',')[1];

      const res = await fetch('/api/ai/extract-artist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Data, mimeType }),
        signal: controller.signal,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطای پردازش هوش مصنوعی');

      if (data.name) {
        setName(data.name);
        isFormDirtyRef.current = true;
      }
      if (data.bio) {
        setBio(data.bio);
        isFormDirtyRef.current = true;
      }
      if (data.specialties) {
        setBio(prev => prev + '\n\nتخصص‌های پیشنهادی هوش مصنوعی: ' + data.specialties);
        isFormDirtyRef.current = true;
      }
      setSuccessMsg('اطلاعات با موفقیت از فایل استخراج شد.');
    } catch (err: any) {
      if (isCancelledRef.current) {
        setAiError('فرآیند لغو شد.');
      } else if (err.name === 'AbortError' || controller.signal.aborted) {
        setAiError('زمان پردازش به پایان رسید (بیش از ۹۰ ثانیه). لطفاً دستی وارد نمایید.');
      } else {
        setAiError(err.message || 'خطا در پردازش فایل');
      }
    } finally {
      clearTimeout(timeoutId);
      clearInterval(timerInterval);
      setAiLoading(false);
      abortControllerRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatUrl = (url: string) => {
    if (!url.trim()) return '';
    if (!/^https?:\/\//i.test(url)) return `https://${url}`;
    return url;
  };

  // --- Send Phone OTP (For verifying edits) ---
  const handleSendPhoneOtp = async () => {
    if (!phoneNumber || !phoneNumber.trim()) {
      const msg = 'لطفاً ابتدا شماره موبایل را وارد کنید.';
      setErrorMsg(msg);
      setFieldErrors(prev => ({ ...prev, phoneNumber: msg }));
      scrollToError(phoneInputRef.current || errorRef.current);
      return;
    }

    const normPhone = normalizePhoneNumber(phoneNumber);
    if (!isValidIranianMobile(normPhone)) {
      const msg = 'شماره موبایل اشتباه است (مثال: ۰۹۱۲۳۴۵۶۷۸۹).';
      setErrorMsg(msg);
      setFieldErrors(prev => ({ ...prev, phoneNumber: msg }));
      scrollToError(phoneInputRef.current || errorRef.current);
      return;
    }

    // If modal was closed but timer is still ticking for this exact phone number, reopen modal
    if (phoneOtpTimer > 0 && lastSentPhoneRef.current === normPhone) {
      setShowPhoneOtpModal(true);
      return;
    }

    setPhoneOtpLoading(true);
    setPhoneOtpError('');
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normPhone, type: 'PHONE_OTP' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در ارسال پیامک');
      
      lastSentPhoneRef.current = normPhone;
      setPhoneOtpTimer(data.expiresIn || 120);
      if (data.devCode) {
        setDevCode(data.devCode);
        setDevMode(data.mode || 'MOCK');
      } else {
        setDevCode(null);
        setDevMode(null);
      }
      setShowPhoneOtpModal(true);
    } catch (err: any) {
      const msg = err.message || 'خطا در ارسال پیامک کد تایید';
      setErrorMsg(msg);
      setFieldErrors(prev => ({ ...prev, phoneNumber: msg }));
      scrollToError(phoneInputRef.current || errorRef.current);
    } finally {
      setPhoneOtpLoading(false);
    }
  };

  // --- Verify Phone OTP & Save ---
  const handleVerifyPhoneOtp = async (codeToVerify: string) => {
    if (!codeToVerify || codeToVerify.length !== 5) {
      setPhoneOtpError('لطفاً کد تایید ۵ رقمی را به طور کامل وارد کنید.');
      return;
    }
    setPhoneOtpLoading(true);
    setPhoneOtpError('');
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, code: codeToVerify, type: 'PHONE_OTP' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'کد تایید اشتباه است یا منقضی شده است.');

      setIsPhoneVerified(true);
      setShowPhoneOtpModal(false);
      // Immediately submit the profile with verified phone
      await executeSaveProfile(true);
    } catch (err: any) {
      setPhoneOtpError(err.message || 'خطا در اعتبارسنجی کد');
    } finally {
      setPhoneOtpLoading(false);
    }
  };

  // --- Send Email OTP (Optional for email verification) ---
  const handleSendEmailOtp = async () => {
    const emailTrimmed = email ? email.trim().toLowerCase() : '';

    // If modal was closed but timer is still ticking for this exact email, reopen modal
    if (emailOtpTimer > 0 && lastSentEmailRef.current && lastSentEmailRef.current === emailTrimmed) {
      setShowEmailOtpModal(true);
      return;
    }

    if (!emailTrimmed) {
      const msg = 'لطفاً آدرس ایمیل خود را وارد کنید.';
      setErrorMsg(msg);
      setFieldErrors(prev => ({ ...prev, email: msg }));
      scrollToError(emailInputRef.current || errorRef.current);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      const msg = 'فرمت ایمیل نامعتبر است. لطفاً یک آدرس ایمیل معتبر (مانند you@example.com) وارد نمایید.';
      setErrorMsg(msg);
      setFieldErrors(prev => ({ ...prev, email: msg }));
      scrollToError(emailInputRef.current || errorRef.current);
      return;
    }

    setEmailOtpLoading(true);
    setEmailOtpError('');
    setErrorMsg('');
    setFieldErrors(prev => ({ ...prev, email: '' }));
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailTrimmed, type: 'EMAIL_OTP' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در ارسال ایمیل تایید');

      lastSentEmailRef.current = emailTrimmed;
      setEmailOtpTimer(data.expiresIn || 120);
      if (data.devCode) setDevCode(data.devCode);
      setShowEmailOtpModal(true);
    } catch (err: any) {
      const msg = err.message || 'خطا در ارسال کد تایید به ایمیل';
      setErrorMsg(msg);
      setFieldErrors(prev => ({ ...prev, email: msg }));
      scrollToError(emailInputRef.current || errorRef.current);
    } finally {
      setEmailOtpLoading(false);
    }
  };

  // --- Verify Email OTP ---
  const handleVerifyEmailOtp = async () => {
    if (!emailOtpCode || emailOtpCode.trim().length !== 5) {
      setEmailOtpError('لطفاً کد تایید ۵ رقمی دریافتی را وارد کنید.');
      return;
    }
    setEmailOtpLoading(true);
    setEmailOtpError('');
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: emailOtpCode.trim(), type: 'EMAIL_OTP' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'کد تایید ایمیل اشتباه است یا منقضی شده است.');

      setIsEmailVerified(true);
      setShowEmailOtpModal(false);
      setSuccessMsg('ایمیل شما با موفقیت تایید شد.');
    } catch (err: any) {
      setEmailOtpError(err.message || 'خطا در اعتبارسنجی ایمیل');
    } finally {
      setEmailOtpLoading(false);
    }
  };

  // --- Primary Form Submission with Comprehensive Custom Validation (No HTML5) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setPhoneOtpError('');

    const errors: string[] = [];
    const fErrors: Record<string, string> = {};

    // 1. Avatar check
    if (!imagePreview && !artist?.user?.image) {
      const msg = 'بارگذاری تصویر پروفایل الزامی است.';
      errors.push(msg);
      fErrors.image = msg;
    }

    // 2. Name check
    if (!name.trim()) {
      const msg = 'نام و نام خانوادگی الزامی است.';
      errors.push(msg);
      fErrors.name = msg;
    }

    // 3. Phone check
    if (!phoneNumber || !phoneNumber.trim()) {
      const msg = 'شماره موبایل الزامی است.';
      errors.push(msg);
      fErrors.phoneNumber = msg;
    } else {
      const norm = normalizePhoneNumber(phoneNumber);
      if (!isValidIranianMobile(norm)) {
        const msg = 'شماره موبایل اشتباه است (مثال: ۰۹۱۲۳۴۵۶۷۸۹).';
        errors.push(msg);
        fErrors.phoneNumber = msg;
      }
    }

    // 4. Province & City check
    if (!province || !province.trim()) {
      const msg = 'انتخاب استان محل فعالیت الزامی است.';
      errors.push(msg);
      fErrors.province = msg;
    }
    if (!city || !city.trim()) {
      const msg = 'انتخاب شهرستان محل فعالیت الزامی است.';
      errors.push(msg);
      fErrors.city = msg;
    }

    // 5. Bio check
    if (!bio.trim()) {
      const msg = 'درباره شما (بیوگرافی و معرفی هنرمند) الزامی است.';
      errors.push(msg);
      fErrors.bio = msg;
    }

    // If there are validation errors, display all in red list and scroll smoothly
    if (errors.length > 0) {
      setFieldErrors(fErrors);
      setValidationErrors(errors);
      scrollToError(validationErrorRef.current || errorRef.current);
      return;
    }

    setFieldErrors({});
    setValidationErrors([]);

    // For every profile submission, trigger phone OTP verification
    await handleSendPhoneOtp();
  };

  const executeSaveProfile = async (phoneVerifiedStatus: boolean) => {
    setSubmitLoading(true);
    setErrorMsg('');
    setValidationErrors([]);
    setFieldErrors({});
    setSuccessMsg('');

    const formattedUrl = formatUrl(portfolioUrl);

    try {
      const res = await fetch('/api/artist/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          brandName: brandName.trim() || undefined,
          province: province.trim() || undefined,
          city: city.trim() || undefined,
          bio: bio.trim(),
          portfolioUrl: formattedUrl,
          socialLinks,
          image: imagePreview,
          specialties,
          phoneNumber: phoneNumber.trim(),
          email: email.trim() || undefined,
          phoneOtpVerified: phoneVerifiedStatus,
          emailOtpVerified: isEmailVerified
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در ثبت پروفایل');

      setPendingMode(true);
      isFormDirtyRef.current = false;
      setPortfolioUrl(formattedUrl);
      setSuccessMsg('اطلاعات پروفایل شما با موفقیت ارسال شد و در انتظار تایید ادمین قرار گرفت.');
      setArtist({ 
        ...artist, 
        pendingEdits: data.artist?.pendingEdits || true,
        province,
        city,
        adminFeedback: null 
      });
      setFieldErrors({});

      // Notify banner & layout immediately without needing full page refresh
      window.dispatchEvent(new CustomEvent('artist-status-updated', {
        detail: { hasPendingEdits: true, verificationLevel: 1, adminFeedback: null }
      }));

      router.refresh();
      const mainContainer = document.querySelector('main');
      if (mainContainer) mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMsg(err.message || 'مشکلی در ثبت اطلاعات پیش آمد.');
      scrollToError(errorRef.current);
    } finally {
      setSubmitLoading(false);
    }
  };

  const renderAdminFeedback = () => {
    if (!artist?.adminFeedback || pendingMode) return null;
    
    try {
      const parsed = typeof artist.adminFeedback === 'string' ? JSON.parse(artist.adminFeedback) : artist.adminFeedback;
      if (typeof parsed === 'object' && parsed !== null) {
        const labels: Record<string, string> = {
          name: 'نام و نام خانوادگی',
          brandName: 'نام برند هنری یا استودیو',
          province: 'استان کارگاه',
          city: 'شهرستان کارگاه',
          image: 'تصویر پروفایل',
          bio: 'درباره شما (بیوگرافی)',
          specialties: 'تخصص‌ها',
          portfolioUrl: 'لینک وب‌سایت شخصی',
          socialLinks: 'شبکه‌های اجتماعی'
        };

        const profileEntries = Object.entries(parsed).filter(([k]) => labels[k]);
        const generalMsg = parsed._generalMessage;

        if (profileEntries.length === 0 && (!generalMsg || generalAlertDismissed)) return null;

        return (
          <div className="space-y-4 mb-8">
            {/* General Alert / Message from Admin */}
            {generalMsg && !generalAlertDismissed && (
              <div className="p-5 bg-amber-50 border-2 border-amber-300 rounded-3xl animate-in fade-in shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-amber-950 font-black text-sm mb-1.5">
                    <span className="text-xl">⚠️</span>
                    <span>پیام و هشدار ناظر پلتفرم:</span>
                  </div>
                  <p className="text-xs sm:text-sm text-amber-950 font-bold leading-relaxed whitespace-pre-wrap">
                    {generalMsg}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDismissGeneralAlert(generalMsg)}
                  className="self-end sm:self-center px-3.5 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-950 border border-amber-400 rounded-xl text-xs font-black transition-colors whitespace-nowrap shadow-xs cursor-pointer"
                >
                  متوجه شدم ✕
                </button>
              </div>
            )}

            {/* Field Rejections List */}
            {profileEntries.length > 0 && (
              <div className="p-5 bg-red-50 border-2 border-red-300 rounded-3xl animate-in fade-in shadow-xs">
                <div className="flex items-center gap-2 text-red-900 font-black text-sm mb-2.5">
                  <span className="text-lg">⚠️</span>
                  <span>پیام ناظر پلتفرم جهت اصلاح موارد زیر:</span>
                </div>
                <ul className="space-y-2 text-xs sm:text-sm text-red-800 list-disc list-inside">
                  {profileEntries.map(([k, reason]: [string, any]) => (
                    <li key={k} className="leading-relaxed">
                      <span className="font-bold text-red-950">{labels[k] || k}: </span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      }
    } catch {
      // Plain text fallback
    }

    if (generalAlertDismissed) return null;

    return (
      <div className="mb-8 p-5 bg-amber-50 border-2 border-amber-300 rounded-3xl text-xs sm:text-sm text-amber-950 leading-relaxed shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h4 className="font-black text-amber-900 mb-1 flex items-center gap-2">
            <span>⚠️</span>
            <span>پیام و هشدار ناظر پلتفرم:</span>
          </h4>
          <p className="font-bold whitespace-pre-wrap">{artist.adminFeedback}</p>
        </div>
        <button
          type="button"
          onClick={() => handleDismissGeneralAlert(artist.adminFeedback)}
          className="self-end sm:self-center px-3.5 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-950 border border-amber-400 rounded-xl text-xs font-black transition-colors whitespace-nowrap shadow-xs cursor-pointer"
        >
          متوجه شدم ✕
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-bold">
        در حال بارگذاری اطلاعات پروفایل...
      </div>
    );
  }

  const artistName = artist?.user?.name || '';
  const supportHref = '/support?message=' + encodeURIComponent('درخواست پیگیری وضعیت اکانت غیرفعال هنرمند\nنام هنرمند: ' + artistName) + '&name=' + encodeURIComponent(artistName);

  const citiesForSelectedProvince = IRAN_PROVINCES.find(p => p.name === province)?.cities || [];

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto font-sans" dir="rtl">
      
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
          پروفایل هنرمند
        </h2>
        <p className="text-slate-500 mt-1.5 text-xs sm:text-sm leading-relaxed">
          اطلاعات شناسنامه هنری شما جهت تایید اصالت و نمایش به خریداران در ویترین هنرهاب.
        </p>
      </div>

      {/* Admin Itemized Feedback */}
      {renderAdminFeedback()}

      {/* General Alert */}
      {errorMsg && (
        <div ref={errorRef} className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-bold rounded-2xl flex items-center gap-2">
          <span>⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold rounded-2xl flex items-center gap-2">
          <span>✓</span>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Deactivated Notice */}
      {!artist?.isActive && artist?.isApproved && (
        <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex gap-4 items-start">
            <span className="text-3xl mt-1">🛑</span>
            <div>
              <h4 className="font-bold text-red-900 text-lg">حساب کاربری شما موقتاً غیرفعال شده است.</h4>
              {artist?.adminFeedback && <p className="text-red-700 font-medium mt-2">دلیل: <span className="font-bold">{artist.adminFeedback}</span></p>}
              <p className="text-red-700 text-sm mt-1">برای پیگیری بیشتر لطفاً با پشتیبانی در ارتباط باشید.</p>
            </div>
          </div>
          <a href={supportHref} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-red-200 transition-colors whitespace-nowrap">
            ارتباط با پشتیبانی
          </a>
        </div>
      )}

      {/* Pending Mode Frozen Banner */}
      {pendingMode && (
        <div className="mb-8 p-5 bg-amber-50 border-2 border-amber-300 text-amber-900 rounded-3xl flex gap-3.5 items-center">
          <span className="text-3xl">⏳</span>
          <div className="text-xs sm:text-sm leading-relaxed">
            <h4 className="font-black text-amber-900 text-sm sm:text-base">اطلاعات پروفایل در انتظار بررسی و تایید ادمین است</h4>
            <p className="text-amber-800 mt-1">
              اطلاعات ارسالی شما ثبت شده و در صف بررسی ناظر قرار دارد. تا زمان تعیین تکلیف ادمین، فرم به صورت موقت قفل (فریز) می‌باشد.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-10 relative">
        
        {/* AI Auto-Complete Section */}
        {!pendingMode && (
          <div className={`mb-8 p-6 border-2 border-dashed rounded-2xl transition-all ${
            artistAiEnabled 
              ? 'border-teal-200 bg-teal-50/50' 
              : 'border-slate-300 bg-slate-50/80 opacity-75'
          }`}>
            <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
              <div>
                <h3 className={`font-bold text-base sm:text-lg flex flex-wrap items-center gap-2 ${
                  artistAiEnabled ? 'text-teal-900' : 'text-slate-700'
                }`}>
                  <span className="text-2xl">✨</span>
                  <span>تکمیل خودکار رزومه با هوش مصنوعی (اختیاری)</span>
                  {!artistAiEnabled && (
                    <span className="text-xs bg-amber-100 text-amber-900 border border-amber-300 font-black px-2.5 py-0.5 rounded-full shadow-2xs">
                      سرویس هوش مصنوعی موقتاً قطع می‌باشد
                    </span>
                  )}
                </h3>
                <p className={`text-xs sm:text-sm mt-1.5 leading-relaxed ${
                  artistAiEnabled ? 'text-teal-700' : 'text-slate-500'
                }`}>
                  می‌توانید رزومه یا معرفی‌نامه خود را (PDF، تصویر یا متن) آپلود کنید تا هوش مصنوعی فیلدهای پروفایل شما را خودکار پر کند.
                </p>
                {!artistAiEnabled && (
                  <p className="text-amber-800 text-xs font-bold mt-2 flex items-center gap-1.5">
                    <span>⚠️</span>
                    <span>سرویس هوش مصنوعی موقتاً قطع می‌باشد. لطفاً اطلاعات پروفایل را در فرم زیر به صورت دستی تکمیل نمایید.</span>
                  </p>
                )}
                {aiError && artistAiEnabled && <p className="text-red-500 text-xs sm:text-sm mt-2 font-bold">{aiError}</p>}
              </div>
              <div className="relative shrink-0">
                {aiLoading ? (
                  <div className="bg-teal-100/90 border border-teal-300 rounded-2xl p-4 flex flex-col items-center gap-2.5 min-w-[220px]">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2 text-teal-900 font-bold text-xs">
                        <span className="w-3.5 h-3.5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></span>
                        <span>در حال پردازش هوش مصنوعی...</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCancelAi}
                        className="p-1 hover:bg-teal-200/80 rounded-lg text-teal-800 transition-colors flex items-center gap-1 text-[11px] font-bold"
                        title="انصراف و لغو"
                      >
                        <span>✕</span>
                        <span>لغو</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2 w-full">
                      <div className="flex-1 bg-teal-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-teal-600 h-2 rounded-full transition-all duration-1000 ease-linear"
                          style={{ width: `${Math.min(100, Math.max(0, ((90 - aiCountdown) / 90) * 100))}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-teal-900 bg-white/80 px-2 py-0.5 rounded-md shadow-xs">
                        {aiCountdown.toLocaleString('fa-IR')} ثانیه
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept=".txt, .pdf, image/jpeg, image/png, image/webp" 
                      onChange={handleAiUpload}
                      disabled={!artist?.isActive || !artistAiEnabled}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <button 
                      type="button"
                      disabled={!artist?.isActive || !artistAiEnabled} 
                      className={`px-5 py-3 rounded-xl font-bold transition-colors whitespace-nowrap shadow-sm flex items-center gap-2 text-xs sm:text-sm ${
                        artistAiEnabled && artist?.isActive
                          ? 'bg-teal-600 hover:bg-teal-700 text-white'
                          : 'bg-slate-300 text-slate-500 cursor-not-allowed border border-slate-300'
                      }`}
                      title={!artistAiEnabled ? 'سرویس هوش مصنوعی موقتاً قطع می‌باشد' : undefined}
                    >
                      <span>📄</span> انتخاب فایل رزومه
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Validation Errors Box (Shown prominently above form with smooth scroll) */}
        {validationErrors.length > 0 && (
          <div ref={validationErrorRef} className="mb-8 p-5 bg-red-50 border-2 border-red-300 rounded-3xl animate-in fade-in">
            <div className="flex items-center gap-2 text-red-900 font-black text-sm mb-2.5">
              <span className="text-lg">⚠️</span>
              <span>لطفاً موارد الزامی زیر را بررسی و تکمیل نمایید:</span>
            </div>
            <ul className="space-y-1.5 text-xs sm:text-sm font-bold text-red-600 list-disc list-inside">
              {validationErrors.map((err, idx) => (
                <li key={idx} className="leading-relaxed">{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Profile Form (noValidate disables native HTML5 popups, custom validation handles errors) */}
        <form noValidate onSubmit={handleSubmit} className="space-y-6">
          <fieldset disabled={pendingMode || !artist?.isActive} className="space-y-6">
            
            {/* 1. Avatar (Required *) */}
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 border-b border-slate-100 pb-8">
              <div className="relative group">
                <div className={`w-24 h-24 rounded-full border-2 overflow-hidden bg-slate-100 flex items-center justify-center shadow-xs ${
                  fieldErrors.image ? 'border-red-400 ring-2 ring-red-200' : 'border-slate-200'
                }`}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="Profile Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                      <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z" />
                      </svg>
                    </div>
                  )}
                </div>
                {!pendingMode && (
                  <label className="absolute bottom-0 right-0 bg-white border border-slate-200 shadow-md p-2 rounded-full cursor-pointer hover:bg-slate-50 transition-colors" title="انتخاب تصویر جدید">
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                  </label>
                )}
              </div>

              <div className="space-y-1.5 text-center sm:text-right">
                <h3 className="font-bold text-slate-800 text-sm">
                  تصویر پروفایل <span className="text-red-500">*</span>
                </h3>
                <p className="text-xs text-slate-500">حجم کمتر از ۵ مگابایت (JPG, PNG, WEBP) - کادربندی دایره‌ای</p>
                {fieldErrors.image && (
                  <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1 justify-center sm:justify-start">
                    <span>⚠️</span>
                    <span>{fieldErrors.image}</span>
                  </p>
                )}
                {imagePreview && !pendingMode && (
                  <button
                    type="button"
                    onClick={() => {
                      setRawImageForCrop(imagePreview);
                      setCropModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg border border-teal-200 transition-colors cursor-pointer"
                  >
                    <span>تنظیم کادربندی دایره</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* 2. Full Name (Required *) */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">
                  نام و نام خانوادگی <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => {
                    isFormDirtyRef.current = true;
                    setName(e.target.value);
                    if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }));
                  }} 
                  className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-900 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-600 ${
                    fieldErrors.name ? 'border-red-400 bg-red-50/30 ring-2 ring-red-100' : 'border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100'
                  }`} 
                  placeholder="مثال: مریم کریمی" 
                />
                {fieldErrors.name && (
                  <p className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
                    <span>⚠️</span>
                    <span>{fieldErrors.name}</span>
                  </p>
                )}
              </div>

              {/* 3. Brand or Studio Name (Optional) */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">
                  نام برند هنری یا استودیو <span className="text-slate-400 font-normal text-xs">(اختیاری)</span>
                </label>
                <input 
                  type="text" 
                  value={brandName} 
                  onChange={e => {
                    isFormDirtyRef.current = true;
                    setBrandName(e.target.value);
                  }} 
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-600" 
                  placeholder="مثال: گالری سفال مینا" 
                />
              </div>

              {/* 4. Phone Number (Required *) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs sm:text-sm font-bold text-slate-700">
                    شماره موبایل <span className="text-red-500">*</span>
                  </label>
                  {isPhoneVerified && (
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <span>✓</span> تایید شده
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input 
                    ref={phoneInputRef}
                    type="tel" 
                    dir="ltr"
                    value={phoneNumber} 
                    onChange={e => {
                      isFormDirtyRef.current = true;
                      setPhoneNumber(e.target.value);
                      if (fieldErrors.phoneNumber) setFieldErrors(prev => ({ ...prev, phoneNumber: '' }));
                    }} 
                    disabled={pendingMode} 
                    maxLength={11}
                    className={`w-full px-4 py-3 rounded-xl border text-sm font-mono text-left outline-none transition-all ${
                      fieldErrors.phoneNumber
                        ? 'border-red-400 bg-red-50/30 ring-2 ring-red-100'
                        : pendingMode
                        ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                        : 'border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-slate-900'
                    }`} 
                    placeholder="09123456789" 
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  تمام اطلاع رسانی ها به این شماره انجام می شود.
                </p>
                {fieldErrors.phoneNumber && (
                  <p className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
                    <span>⚠️</span>
                    <span>{fieldErrors.phoneNumber}</span>
                  </p>
                )}
              </div>

              {/* 5. Email (Optional, or fixed with green check if SSO) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs sm:text-sm font-bold text-slate-700">
                    ایمیل <span className="text-slate-400 font-normal text-xs">(اختیاری)</span>
                  </label>
                  {isEmailVerified && (
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <span>✓</span> {isSsoUser ? 'تایید شده (گوگل)' : 'تایید شده'}
                    </span>
                  )}
                </div>

                <div className="relative flex items-center gap-2">
                  <input 
                    ref={emailInputRef}
                    type="email" 
                    dir="ltr"
                    value={email} 
                    onChange={e => {
                      isFormDirtyRef.current = true;
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
                    }} 
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (!isEmailVerified && !pendingMode && email && email.includes('@')) {
                          handleSendEmailOtp();
                        }
                      }
                    }}
                    readOnly={isSsoUser || pendingMode} 
                    disabled={isSsoUser || pendingMode} 
                    className={`flex-1 px-4 py-3 rounded-xl border text-sm text-left outline-none transition-all ${
                      fieldErrors.email
                        ? 'border-red-400 bg-red-50/30 ring-2 ring-red-100'
                        : isSsoUser || pendingMode
                        ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                        : 'border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-slate-900'
                    }`} 
                    placeholder="you@example.com" 
                  />

                  {!isSsoUser && !isEmailVerified && !pendingMode && email && email.includes('@') && (
                    <button
                      type="button"
                      onClick={handleSendEmailOtp}
                      disabled={emailOtpLoading}
                      className="px-3 py-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold whitespace-nowrap transition-colors"
                    >
                      {emailOtpLoading ? 'ارسال...' : emailOtpTimer > 0 && lastSentEmailRef.current === email.trim().toLowerCase() ? `ورود کد (${emailOtpTimer}s)` : 'تایید ایمیل'}
                    </button>
                  )}
                </div>
                {fieldErrors.email && (
                  <p className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
                    <span>⚠️</span>
                    <span>{fieldErrors.email}</span>
                  </p>
                )}
              </div>

              {/* 6. Workshop Location: Province & City */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">
                  استان محل فعالیت / کارگاه <span className="text-red-500">*</span>
                </label>
                <select
                  value={province}
                  onChange={(e) => {
                    isFormDirtyRef.current = true;
                    const sel = e.target.value;
                    setProvince(sel);
                    const pData = IRAN_PROVINCES.find(p => p.name === sel);
                    setCity(pData && pData.cities.length > 0 ? pData.cities[0] : '');
                    if (fieldErrors.province) setFieldErrors(prev => ({ ...prev, province: '' }));
                  }}
                  disabled={pendingMode || !artist?.isActive}
                  className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all bg-white disabled:bg-slate-100 disabled:text-slate-600 ${
                    fieldErrors.province
                      ? 'border-red-400 bg-red-50/30 ring-2 ring-red-100'
                      : 'border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-slate-900'
                  }`}
                >
                  <option value="">انتخاب استان...</option>
                  {IRAN_PROVINCES.map(p => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
                {fieldErrors.province && (
                  <p className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
                    <span>⚠️</span>
                    <span>{fieldErrors.province}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">
                  شهرستان محل فعالیت / کارگاه <span className="text-red-500">*</span>
                </label>
                <select
                  value={city}
                  onChange={(e) => {
                    isFormDirtyRef.current = true;
                    setCity(e.target.value);
                    if (fieldErrors.city) setFieldErrors(prev => ({ ...prev, city: '' }));
                  }}
                  disabled={pendingMode || !artist?.isActive || !province}
                  className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all bg-white disabled:bg-slate-100 disabled:text-slate-600 ${
                    fieldErrors.city
                      ? 'border-red-400 bg-red-50/30 ring-2 ring-red-100'
                      : 'border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-slate-900'
                  }`}
                >
                  <option value="">انتخاب شهرستان...</option>
                  {citiesForSelectedProvince.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {fieldErrors.city && (
                  <p className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
                    <span>⚠️</span>
                    <span>{fieldErrors.city}</span>
                  </p>
                )}
              </div>

              {/* 7. Portfolio / Personal Website (Optional) */}
              <div className="md:col-span-2">
                <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">
                  لینک سایت شخصی یا نمونه کار <span className="text-slate-400 font-normal text-xs">(اختیاری)</span>
                </label>
                <input 
                  type="text" 
                  value={portfolioUrl} 
                  onChange={e => {
                    isFormDirtyRef.current = true;
                    setPortfolioUrl(e.target.value);
                  }} 
                  onBlur={() => setPortfolioUrl(formatUrl(portfolioUrl))} 
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none text-left text-sm text-slate-900 font-mono disabled:bg-slate-100 disabled:text-slate-600" 
                  dir="ltr" 
                  placeholder="https://myartgallery.ir" 
                />
              </div>

              {/* 8. Social Links (Optional) */}
              <div className="md:col-span-2">
                <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">
                  شبکه‌های اجتماعی <span className="text-slate-400 font-normal text-xs">(اختیاری)</span>
                </label>
                <SocialLinksInput 
                  socialLinks={socialLinks} 
                  onChange={links => {
                    isFormDirtyRef.current = true;
                    setSocialLinks(links);
                  }} 
                />
              </div>
              
              {/* 9. Specialties (Optional) */}
              <div className="md:col-span-2">
                <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">
                  تخصص‌ها و رشته‌های هنری <span className="text-slate-400 font-normal text-xs">(اختیاری)</span>
                </label>
                <SpecialtyTagInput 
                  selectedSpecialties={specialties} 
                  onChange={specs => {
                    isFormDirtyRef.current = true;
                    setSpecialties(specs);
                  }} 
                />
              </div>

              {/* 10. Bio / About you (Required *) */}
              <div className="md:col-span-2">
                <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">
                  درباره شما (بیوگرافی و معرفی هنرمند) <span className="text-red-500">*</span>
                </label>
                <textarea 
                  value={bio} 
                  onChange={e => {
                    isFormDirtyRef.current = true;
                    setBio(e.target.value);
                    if (fieldErrors.bio) setFieldErrors(prev => ({ ...prev, bio: '' }));
                  }} 
                  rows={4} 
                  className={`w-full px-4 py-3 rounded-xl border leading-relaxed text-sm text-slate-900 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-600 ${
                    fieldErrors.bio
                      ? 'border-red-400 bg-red-50/30 ring-2 ring-red-100'
                      : 'border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100'
                  }`} 
                  placeholder="داستان هنر، انگیزه و پیشینه کارگاه هنری خود را شرح دهید..."
                />
                {fieldErrors.bio && (
                  <p className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
                    <span>⚠️</span>
                    <span>{fieldErrors.bio}</span>
                  </p>
                )}
              </div>

            </div>

            {/* Submit Button or Frozen Indicator */}
            {pendingMode ? (
              <div className="w-full mt-6 py-4 px-6 bg-amber-500/10 border-2 border-amber-400/40 text-amber-800 font-black rounded-2xl text-center text-sm flex items-center justify-center gap-2 shadow-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span>در انتظار بررسی و تایید ادمین</span>
              </div>
            ) : (
              <button 
                type="submit" 
                disabled={submitLoading || !artist?.isActive} 
                className="w-full mt-6 bg-teal-600 hover:bg-teal-700 text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-teal-500/20 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {submitLoading ? 'در حال ثبت و ارسال...' : 'ثبت و ارسال برای تایید'}
              </button>
            )}

          </fieldset>
        </form>

      </div>

      {/* Phone OTP Modal (Sent for verifying each profile edit) */}
      {showPhoneOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl border border-slate-100 text-center relative animate-in zoom-in-95">
            <button
              type="button"
              onClick={() => setShowPhoneOtpModal(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 p-1"
            >
              ✕
            </button>

            <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 border border-teal-100">
              📱
            </div>

            <h3 className="text-lg font-black text-slate-800 mb-2">تایید پیامکی ویرایش پروفایل</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              کد تایید ۵ رقمی ارسال‌شده به شماره <span className="font-mono font-bold text-slate-800 dir-ltr inline-block">{phoneNumber}</span> را وارد کنید:
            </p>

            {devCode && (
              <div className={`mb-4 p-2.5 text-xs font-mono font-bold rounded-xl border ${
                devMode === 'SANDBOX'
                  ? 'bg-sky-50 text-sky-900 border-sky-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {devMode === 'SANDBOX' ? `تایید سندباکس sms.ir: ${devCode}` : `کد آزمایشی سرور (Mock): ${devCode}`}
              </div>
            )}

            {phoneOtpError && (
              <div className="mb-4 p-2.5 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-200">
                {phoneOtpError}
              </div>
            )}

            <div className="mb-6">
              <input
                type="text"
                dir="ltr"
                maxLength={5}
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="[0-9]*"
                autoFocus
                placeholder="• • • • •"
                value={phoneOtpCode}
                onChange={e => {
                  const cleaned = e.target.value.replace(/\D/g, '');
                  setPhoneOtpCode(cleaned);
                  if (cleaned.length === 5) {
                    handleVerifyPhoneOtp(cleaned);
                  }
                }}
                className="w-full text-center tracking-[0.5em] font-mono text-2xl py-3 border-2 border-slate-300 focus:border-teal-500 rounded-2xl outline-none"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 mb-6">
              {phoneOtpTimer > 0 ? (
                <span>ارسال مجدد تا {phoneOtpTimer} ثانیه</span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendPhoneOtp}
                  className="text-teal-600 font-bold hover:underline"
                >
                  ارسال مجدد کد پیامکی
                </button>
              )}
            </div>

            <button
              type="button"
              disabled={phoneOtpLoading || phoneOtpCode.length !== 5}
              onClick={() => handleVerifyPhoneOtp(phoneOtpCode)}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl transition-all text-xs disabled:opacity-50"
            >
              {phoneOtpLoading ? 'در حال بررسی...' : 'تایید کد و ثبت نهایی پروفایل'}
            </button>
          </div>
        </div>
      )}

      {/* Email OTP Modal (For verifying email) */}
      {showEmailOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl border border-slate-100 text-center relative animate-in zoom-in-95">
            <button
              type="button"
              onClick={() => setShowEmailOtpModal(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 p-1"
            >
              ✕
            </button>

            <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 border border-teal-100">
              ✉️
            </div>

            <h3 className="text-lg font-black text-slate-800 mb-2">تایید آدرس ایمیل</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              کد تایید ۵ رقمی ارسال‌شده به <span className="font-mono font-bold text-slate-800 dir-ltr inline-block">{email}</span> را وارد کنید:
            </p>

            {devCode && (
              <div className="mb-4 p-2.5 bg-amber-50 text-amber-800 text-xs font-mono font-bold rounded-xl border border-amber-200">
                کد آزمایشی: {devCode}
              </div>
            )}

            {emailOtpError && (
              <div className="mb-4 p-2.5 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-200">
                {emailOtpError}
              </div>
            )}

            <div className="mb-6">
              <input
                type="text"
                dir="ltr"
                maxLength={5}
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="[0-9]*"
                autoFocus
                placeholder="• • • • •"
                value={emailOtpCode}
                onChange={e => {
                  const cleaned = e.target.value.replace(/\D/g, '');
                  setEmailOtpCode(cleaned);
                  if (cleaned.length === 5) {
                    setEmailOtpLoading(true);
                    fetch('/api/auth/otp/verify', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: email.trim(), code: cleaned, type: 'EMAIL_OTP' })
                    })
                      .then(r => r.json())
                      .then(d => {
                        if (d.success) {
                          setIsEmailVerified(true);
                          setShowEmailOtpModal(false);
                          setSuccessMsg('ایمیل شما با موفقیت تایید شد.');
                        } else {
                          setEmailOtpError(d.error || 'کد تایید نامعتبر است.');
                        }
                      })
                      .catch(() => setEmailOtpError('خطا در اعتبارسنجی'))
                      .finally(() => setEmailOtpLoading(false));
                  }
                }}
                className="w-full text-center tracking-[0.5em] font-mono text-2xl py-3 border-2 border-slate-300 focus:border-teal-500 rounded-2xl outline-none"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 mb-6">
              {emailOtpTimer > 0 ? (
                <span>ارسال مجدد تا {emailOtpTimer} ثانیه</span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendEmailOtp}
                  className="text-teal-600 font-bold hover:underline"
                >
                  ارسال مجدد کد ایمیلی
                </button>
              )}
            </div>

            <button
              type="button"
              disabled={emailOtpLoading || emailOtpCode.length !== 5}
              onClick={handleVerifyEmailOtp}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl transition-all text-xs disabled:opacity-50"
            >
              {emailOtpLoading ? 'در حال بررسی...' : 'تایید ایمیل'}
            </button>
          </div>
        </div>
      )}

      {/* Avatar Circular Crop Modal */}
      <AvatarCropModal
        isOpen={cropModalOpen}
        imageSrc={rawImageForCrop}
        onClose={() => {
          setCropModalOpen(false);
          setRawImageForCrop(null);
        }}
        onCropComplete={handleCropComplete}
      />

    </div>
  );
}
