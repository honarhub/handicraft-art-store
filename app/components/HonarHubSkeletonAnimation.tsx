'use client';

import React from 'react';

export default function HonarHubSkeletonAnimation() {
  return (
    <div className="honar-skeleton-wrapper select-none">
      {/* Moving Shimmer Ray */}
      <div className="honar-skeleton-shimmer" />

      {/* Stage 1: کلمه «هنر» + دایره چشمک‌زن */}
      <div className="honar-stage-rec">
        <span>هنر</span>
        <div className="honar-rec-dot" />
      </div>

      {/* Stage 2: لپ‌تاپ شبیه‌سازی‌شده */}
      <div className="honar-stage-laptop">
        <div className="honar-laptop-screen">
          <div className="honar-laptop-camera" />
          <div className="honar-laptop-display-content">
            <div className="honar-laptop-wire-row" />
            <div className="honar-laptop-wire-row short" />
          </div>
        </div>
        <div className="honar-laptop-base">
          <div className="honar-laptop-notch" />
        </div>
      </div>

      {/* Stage 3: ماوس و کلیک ریپل */}
      <div className="honar-stage-mouse">
        <div className="honar-mouse-click-ripple" />
        <div className="honar-mouse-body">
          <div className="honar-mouse-line" />
          <div className="honar-mouse-wheel" />
        </div>
      </div>

      {/* Stage 4: لوگوی هنرهاب + شعار انتخابی */}
      <div className="honar-stage-logo">
        <div className="honar-brand-wrap">
          <span className="honar-brand-honar">هنر</span>
          <span className="honar-brand-hub">هاب</span>
        </div>
        <span className="honar-brand-tagline">
          انتخاب اول هنرمندان ایران زمین <span className="honar-brand-heart">❤️</span>
        </span>
      </div>
    </div>
  );
}
