'use client';

import React from 'react';

/**
 * HonarHubHero
 * Intro animation for the landing page hero:
 *
 *  1) The ~5200-year-old Shahr-e Sukhteh pottery goblet appears with
 *     gentle 3D tilt as a one-time historical intro.
 *  2) A radial burst marks the jump in time, "اما امروز" ("But today") appears,
 *     and a continuous celestial constellation of the last 10 approved products
 *     orbits the HonarHub brand mark.
 *  3) The pottery vessel NEVER repeats. The constellation orbits continuously.
 *  4) Hovering over the constellation pauses the rotation so the user can inspect items.
 *  5) Clicking any item (front or back) opens the product page in a new tab (target="_blank").
 */

export type HeroProduct = {
  id: string;
  title: string;
  imageUrl: string;
};

// نمونه‌های پیش‌فرض در صورت خالی بودن دیتابیس
const fallbackRelics: HeroProduct[] = [
  { id: '1', title: 'بشقاب میناکاری آبی لاجورد', imageUrl: '/hero/mina-plate-blue.png' },
  { id: '2', title: 'گلدان سرامیکی فیروزه‌ای دست‌ساز', imageUrl: '/hero/ceramic-vase-green.png' },
  { id: '3', title: 'آفتابه و لگن مسی قلم‌زنی', imageUrl: '/hero/copper-ewer.png' },
  { id: '4', title: 'دستبند نقره و گره‌چینی دست‌ساز', imageUrl: '/hero/bracelet.png' },
  { id: '5', title: 'گل دست‌بافت ابریشمی', imageUrl: '/hero/crochet-flower.png' },
  { id: '6', title: 'تابلوی منبت‌کاری برجسته گردو', imageUrl: '/hero/wood-carving-panel.png' },
  { id: '7', title: 'کوزه سفالی دست‌ساز لعاب‌دار', imageUrl: '/hero/ceramic-jug-green.png' },
  { id: '8', title: 'نقاشی آبرنگ اصیل ایرانی', imageUrl: '/hero/watercolor-painting.png' },
  { id: '9', title: 'صندوقچه چوبی خاتم و منبت', imageUrl: '/hero/antique-chest.png' },
  { id: '10', title: 'قالیچه دستبافت نقشه کرمان', imageUrl: '/hero/rug-red-square.png' },
];

function ringPosition(index: number, count: number, radiusPct: number) {
  const angle = (360 / count) * index - 90; // شروع از بالای مدار
  const rad = (angle * Math.PI) / 180;
  return {
    left: `${50 + radiusPct * Math.cos(rad)}%`,
    top: `${50 + radiusPct * Math.sin(rad)}%`,
  };
}

interface HonarHubHeroProps {
  products?: HeroProduct[];
}

export default function HonarHubHero({ products = [] }: HonarHubHeroProps) {
  // تکمیل دقیق ۱۰ محصول (در صورت کمتر بودن محصولات تایید شده، چرخشی پر می‌شوند)
  const targetCount = 10;
  const items: HeroProduct[] = [];

  const sourceList = products.length > 0 ? products : fallbackRelics;
  for (let i = 0; i < targetCount; i++) {
    items.push(sourceList[i % sourceList.length]);
  }

  // تفکیک ۱۰ محصول در ۳ حلقه منظومه (حلقه داخلی ۳، حلقه میانی ۴، حلقه بیرونی ۳)
  const innerRelics = items.slice(0, 3);
  const middleRelics = items.slice(3, 7);
  const outerRelics = items.slice(7, 10);

  return (
    <div className="stage" dir="rtl">
      {/* ---------- پرده ۱: جام سفالین ۵۲۰۰ ساله شهر سوخته (اجرای یکباره) ---------- */}
      <div className="relic-hero">
        <img
          src="/hero/pottery-vessel.png"
          alt="جام سفالین ۵۲۰۰ ساله شهر سوخته"
          className="goblet-photo"
        />
      </div>
      <div className="era-label era-old">ایران زمین، ۵۲۰۰ سال پیش</div>

      {/* ---------- جرقه گذر زمان ---------- */}
      <div className="burst" />

      {/* ---------- پرده ۲: منظومه همیشگی و در حال گردش آثار برگزیده هنرهاب ---------- */}
      <div className="act-two">
        <div className="era-label era-new">اما امروز</div>

        <div className="cosmos" title="برای توقف چرخش، ماوس را روی منظومه نگه دارید">
          <div className="glow" />

          {/* مدارهای هندسی */}
          <div className="track track-inner" />
          <div className="track track-middle" />
          <div className="track track-outer" />

          {/* مدار داخلی: ۳ محصول */}
          <div className="ring ring-inner">
            {innerRelics.map((relic, i) => {
              const pos = ringPosition(i, innerRelics.length, 21);
              return (
                <div className="relic-item relic-item--inner" style={pos} key={`inner-${relic.id}-${i}`}>
                  <a
                    href={`/product/${relic.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relic-item-inner relic-item-inner--inner"
                    title={relic.title}
                  >
                    <img src={relic.imageUrl} alt={relic.title} />
                    <span className="relic-tooltip">{relic.title}</span>
                  </a>
                </div>
              );
            })}
          </div>

          {/* مدار میانی: ۴ محصول */}
          <div className="ring ring-middle">
            {middleRelics.map((relic, i) => {
              const pos = ringPosition(i, middleRelics.length, 36);
              return (
                <div className="relic-item relic-item--middle" style={pos} key={`middle-${relic.id}-${i}`}>
                  <a
                    href={`/product/${relic.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relic-item-inner relic-item-inner--middle"
                    title={relic.title}
                  >
                    <img src={relic.imageUrl} alt={relic.title} />
                    <span className="relic-tooltip">{relic.title}</span>
                  </a>
                </div>
              );
            })}
          </div>

          {/* مدار بیرونی: ۳ محصول */}
          <div className="ring ring-outer">
            {outerRelics.map((relic, i) => {
              const pos = ringPosition(i, outerRelics.length, 50);
              return (
                <div className="relic-item relic-item--outer" style={pos} key={`outer-${relic.id}-${i}`}>
                  <a
                    href={`/product/${relic.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relic-item-inner relic-item-inner--outer"
                    title={relic.title}
                  >
                    <img src={relic.imageUrl} alt={relic.title} />
                    <span className="relic-tooltip">{relic.title}</span>
                  </a>
                </div>
              );
            })}
          </div>

          {/* نشان مرکز منظومه هنرهاب */}
          <div className="center-brand">
            <h1>هنرهاب</h1>
            <p>بازار آثار هنرمندان ایران‌زمین</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .stage {
          width: 100%;
          aspect-ratio: 16 / 9;
          max-width: 1400px;
          margin: 0 auto;
          position: relative;
          overflow: hidden;
          background: transparent;
        }

        /* ---------- پرده ۱: اجرای یکباره بدون تکرار مجدد ---------- */
        .relic-hero {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 22%;
          perspective: 600px;
          animation: relicJourney 4.5s cubic-bezier(0.65, 0, 0.35, 1) forwards;
          pointer-events: none !important;
          z-index: 20;
        }
        @keyframes relicJourney {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          15% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          70% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          85% { opacity: 0; transform: translate(-50%, -50%) scale(1.1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.1); visibility: hidden; }
        }

        .goblet-photo {
          width: 100%;
          height: auto;
          display: block;
          filter: drop-shadow(0 14px 20px rgba(0, 0, 0, 0.22));
          animation: turnHint 4.5s ease-in-out forwards;
          transform-origin: center center;
        }
        @keyframes turnHint {
          0%, 15% { transform: rotateY(0deg); }
          35% { transform: rotateY(18deg); }
          55% { transform: rotateY(-18deg); }
          70%, 100% { transform: rotateY(0deg); }
        }

        .era-label {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
          width: 100%;
          pointer-events: none !important;
        }
        .era-old {
          top: 76%;
          font-size: clamp(16px, 2vw, 22px);
          font-weight: 700;
          color: #7a3a1c;
          letter-spacing: 0.3px;
          animation: eraOld 4.5s linear forwards;
          z-index: 20;
        }
        @keyframes eraOld {
          0%, 10% { opacity: 0; }
          20%, 70% { opacity: 1; }
          85%, 100% { opacity: 0; visibility: hidden; }
        }

        .era-new {
          top: 8%;
          color: #c9932f;
          font-weight: 700;
          font-size: clamp(13px, 1.4vw, 16px);
          z-index: 30;
        }

        /* ---------- جرقه گذر زمان ---------- */
        .burst {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: radial-gradient(circle, #fff 55%, rgba(255, 255, 255, 0) 75%);
          transform: translate(-50%, -50%) scale(0);
          animation: burstPulse 4.8s linear forwards;
          pointer-events: none !important;
          z-index: 25;
        }
        @keyframes burstPulse {
          0%, 72% { opacity: 0; transform: translate(-50%, -50%) scale(0); }
          82% { opacity: 1; transform: translate(-50%, -50%) scale(35); }
          94%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(35); visibility: hidden; }
        }

        /* ---------- پرده ۲: نمایش پایدار و گردش مداوم منظومه ---------- */
        .act-two {
          position: absolute;
          inset: 0;
          opacity: 0;
          animation: actTwoFadeIn 5s ease-out forwards;
          pointer-events: none;
        }
        @keyframes actTwoFadeIn {
          0%, 78% { opacity: 0; }
          92%, 100% { opacity: 1; }
        }

        .cosmos {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 82%;
          aspect-ratio: 1;
          transform: translate(-50%, -50%);
          perspective: 1200px;
          transform-style: preserve-3d;
          cursor: default;
          pointer-events: auto;
        }

        /* توقف چرخش منظومه با رفتن ماوس روی آن */
        .cosmos:hover .ring,
        .cosmos:hover .relic-item-inner {
          animation-play-state: paused !important;
        }

        .glow {
          position: absolute;
          inset: 20%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 175, 50, 0.4), rgba(255, 175, 50, 0) 60%);
          animation: pulseGlow 4s ease-in-out infinite alternate;
          pointer-events: none !important;
        }
        @keyframes pulseGlow {
          from { transform: scale(1); opacity: 0.8; }
          to { transform: scale(1.2); opacity: 1; }
        }

        .track {
          position: absolute;
          border-radius: 50%;
          border: 1.5px dashed rgba(201, 147, 47, 0.35);
          transform: rotateX(55deg);
          pointer-events: none !important;
        }
        .track-inner { inset: 29%; }
        .track-middle { inset: 14%; }
        .track-outer { inset: 0%; }

        .ring {
          position: absolute;
          inset: 0;
          transform-style: preserve-3d;
          pointer-events: none !important;
        }
        .ring-inner { animation: spin-inner 28s linear infinite; }
        .ring-middle { animation: spin-middle 36s linear infinite reverse; }
        .ring-outer { animation: spin-outer 44s linear infinite; }

        @keyframes spin-inner {
          from { transform: rotateX(55deg) rotateZ(0deg); }
          to { transform: rotateX(55deg) rotateZ(360deg); }
        }
        @keyframes spin-middle {
          from { transform: rotateX(55deg) rotateZ(0deg); }
          to { transform: rotateX(55deg) rotateZ(-360deg); }
        }
        @keyframes spin-outer {
          from { transform: rotateX(55deg) rotateZ(0deg); }
          to { transform: rotateX(55deg) rotateZ(360deg); }
        }

        .relic-item {
          position: absolute;
          transform: translate(-50%, -50%);
          transform-style: preserve-3d;
          pointer-events: none !important;
          transition: transform 0.25s ease;
        }
        .relic-item--inner { width: 14%; aspect-ratio: 1; }
        .relic-item--middle { width: 13%; aspect-ratio: 1; }
        .relic-item--outer { width: 11%; aspect-ratio: 1; }

        /* تگ لینک قابل کلیک (چه در بخش جلو و چه در بخش عقب مدار) */
        .relic-item-inner {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          border-radius: 9999px;
          background: #ffffff;
          box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.22), 0 0 0 2px rgba(255, 255, 255, 0.95);
          overflow: visible;
          position: relative;
          cursor: pointer !important;
          pointer-events: auto !important;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
        }

        .relic-item:hover {
          z-index: 200 !important;
        }
        .relic-item:hover .relic-item-inner {
          transform: scale(1.22) translateZ(40px) !important;
          box-shadow: 0 20px 35px -5px rgba(0, 0, 0, 0.38), 0 0 0 3px #f59e0b;
        }

        .relic-item-inner--inner { animation: counter-spin-inner 28s linear infinite; }
        .relic-item-inner--middle { animation: counter-spin-middle 36s linear infinite reverse; }
        .relic-item-inner--outer { animation: counter-spin-outer 44s linear infinite; }

        @keyframes counter-spin-inner {
          from { transform: rotateZ(0deg) rotateX(-55deg); }
          to { transform: rotateZ(-360deg) rotateX(-55deg); }
        }
        @keyframes counter-spin-middle {
          from { transform: rotateZ(0deg) rotateX(-55deg); }
          to { transform: rotateZ(360deg) rotateX(-55deg); }
        }
        @keyframes counter-spin-outer {
          from { transform: rotateZ(0deg) rotateX(-55deg); }
          to { transform: rotateZ(-360deg) rotateX(-55deg); }
        }

        .relic-item-inner :global(img) {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 9999px;
          display: block;
          pointer-events: none;
        }

        .relic-tooltip {
          position: absolute;
          bottom: -32px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(15, 23, 42, 0.94);
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 8px;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.2s ease, transform 0.2s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
          z-index: 300;
        }
        .relic-item:hover .relic-tooltip {
          opacity: 1;
          transform: translateX(-50%) translateY(2px);
        }

        .center-brand {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%) translateZ(100px);
          text-align: center;
          z-index: 40;
          pointer-events: none !important;
        }
        .center-brand h1 {
          margin: 0;
          font-size: clamp(24px, 3.2vw, 42px);
          font-weight: 900;
          color: #2a1c10;
        }
        .center-brand p {
          margin: 0.35em 0 0;
          font-size: clamp(10px, 1.1vw, 14px);
          font-weight: 600;
          color: #8a5230;
        }

        @media (prefers-reduced-motion: reduce) {
          .stage * {
            animation-play-state: paused !important;
          }
        }
      `}</style>
    </div>
  );
}
