'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function RegisterRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let windowParams: URLSearchParams | null = null;
    if (typeof window !== 'undefined') {
      windowParams = new URLSearchParams(window.location.search);
    }

    const ref = searchParams.get('invite') || searchParams.get('ref') || searchParams.get('code') || searchParams.get('referral') || searchParams.get('referralCode')
      || windowParams?.get('invite') || windowParams?.get('ref') || windowParams?.get('code') || windowParams?.get('referral') || windowParams?.get('referralCode');

    const target = ref 
      ? `/artist-panel/login?invite=${encodeURIComponent(ref.trim().toUpperCase())}&ref=${encodeURIComponent(ref.trim().toUpperCase())}&tab=register`
      : '/artist-panel/login?tab=register';
    router.replace(target);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function ArtistRegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <RegisterRedirectContent />
    </Suspense>
  );
}
