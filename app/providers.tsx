'use client';

import { SessionProvider } from 'next-auth/react';
import React, { useEffect } from 'react';

function FormValidationHandler() {
  useEffect(() => {
    const handleInvalid = (e: Event) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      if (!target || !target.validity) return;

      const rlm = '\u200F';
      if (target.validity.valueMissing) {
        target.setCustomValidity(rlm + 'لطفاً این فیلد را پر کنید.');
      } else if (target.validity.typeMismatch) {
        if (target.type === 'email') {
          target.setCustomValidity(rlm + 'لطفاً یک آدرس ایمیل معتبر وارد کنید.');
        } else if (target.type === 'url') {
          target.setCustomValidity(rlm + 'لطفاً یک نشانی اینترنتی معتبر وارد کنید.');
        } else {
          target.setCustomValidity(rlm + 'لطفاً مقدار معتبری وارد نمایید.');
        }
      } else if (target.validity.patternMismatch) {
        target.setCustomValidity(rlm + 'لطفاً فرمت درخواستی را رعایت فرمایید.');
      } else if (target.validity.tooShort) {
        const minLen = 'minLength' in target ? (target as HTMLInputElement).minLength : '';
        target.setCustomValidity(rlm + (minLen ? `لطفاً حداقل ${minLen} کاراکتر وارد کنید.` : 'تعداد کاراکتر وارد شده کمتر از حد مجاز است.'));
      } else if (target.validity.tooLong) {
        const maxLen = 'maxLength' in target ? (target as HTMLInputElement).maxLength : '';
        target.setCustomValidity(rlm + (maxLen ? `حداکثر ${maxLen} کاراکتر مجاز است.` : 'تعداد کاراکتر بیشتر از حد مجاز است.'));
      } else if (target.validity.rangeUnderflow) {
        const minVal = 'min' in target ? (target as HTMLInputElement).min : '';
        target.setCustomValidity(rlm + (minVal ? `مقدار باید بزرگتر یا مساوی ${minVal} باشد.` : 'مقدار کمتر از حداقل مجاز است.'));
      } else if (target.validity.rangeOverflow) {
        const maxVal = 'max' in target ? (target as HTMLInputElement).max : '';
        target.setCustomValidity(rlm + (maxVal ? `مقدار باید کوچکتر یا مساوی ${maxVal} باشد.` : 'مقدار بیشتر از حداکثر مجاز است.'));
      } else {
        target.setCustomValidity(rlm + 'لطفاً این قسمت را به درستی تکمیل نمایید.');
      }
    };

    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      if (target && typeof target.setCustomValidity === 'function') {
        target.setCustomValidity('');
      }
    };

    document.addEventListener('invalid', handleInvalid, true);
    document.addEventListener('input', handleInput, true);
    document.addEventListener('change', handleInput, true);

    return () => {
      document.removeEventListener('invalid', handleInvalid, true);
      document.removeEventListener('input', handleInput, true);
      document.removeEventListener('change', handleInput, true);
    };
  }, []);

  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <FormValidationHandler />
      {children}
    </SessionProvider>
  );
}
