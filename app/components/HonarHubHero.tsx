'use client';

/**
 * HonarHubHero
 * Loop animation for the landing page hero, on a plain white background:
 *
 *  1) The real photo of the ~5200-year-old Shahr-e Sukhteh goblet (its
 *     background removed) appears center-stage with a gentle turning-in-
 *     the-hand tilt.
 *  2) A quick radial transition burst marks the jump in time, "اما امروز"
 *     ("But today") fades in, and the goblet is replaced by a two-ring
 *     "solar system" of real HonarHub craft photos continuously orbiting
 *     the wordmark. The goblet itself is intentionally NOT one of the
 *     orbiting pieces, per your note.
 *
 * IMAGE ASSETS: put all PNGs from hero-assets/ into public/hero/ (or
 * adjust the src props / swap in next/image). Every photo has already
 * been background-removed and resized onto matching 640x640 canvases so
 * they read consistently at any orbit position.
 *
 * Usage:
 *   import HonarHubHero from '@/components/HonarHubHero';
 *   <HonarHubHero />
 */

type Relic = { src: string; alt: string };

// inner ring: 2 pieces
const innerRelics: Relic[] = [
  { src: '/hero/mina-plate-blue.png', alt: 'بشقاب میناکاری آبی' },
  { src: '/hero/ceramic-vase-green.png', alt: 'گلدان سرامیکی سبز' },
];

// middle ring: 3 pieces
const middleRelics: Relic[] = [
  { src: '/hero/copper-ewer.png', alt: 'آفتابه مسی دست‌ساز' },
  { src: '/hero/bracelet.png', alt: 'دستبند گره‌چینی گل بنفش' },
  { src: '/hero/crochet-flower.png', alt: 'گل قلاب‌بافی قرمز' },
];

// outer ring: 2 pieces
const outerRelics: Relic[] = [
  { src: '/hero/wood-carving-panel.png', alt: 'تابلوی منبت‌کاری چوب' },
  { src: '/hero/ceramic-jug-green.png', alt: 'کوزه سرامیکی سبز' },
];

function ringPosition(index: number, count: number, radiusPct: number) {
  const angle = (360 / count) * index - 90; // start from the top
  const rad = (angle * Math.PI) / 180;
  return {
    left: `${50 + radiusPct * Math.cos(rad)}%`,
    top: `${50 + radiusPct * Math.sin(rad)}%`,
  };
}

export default function HonarHubHero() {
  return (
    <div className="stage" dir="rtl">
      {/* ---------- Act 1: the real goblet, 5200 years ago ---------- */}
      <div className="relic-hero">
        <img src="/hero/pottery-vessel.png" alt="جام سفالین ۵۲۰۰ ساله" className="goblet-photo" />
      </div>
      <div className="era-label era-old">۵۲۰۰ سال پیش</div>

      {/* ---------- transition burst ---------- */}
      <div className="burst" />

      {/* ---------- Act 2: the cosmos of relics around HonarHub, today ---------- */}
      <div className="act-two">
        <div className="era-label era-new">اما امروز</div>

        <div className="cosmos">
          <div className="glow" />
          <div className="track track-inner" />
          <div className="track track-middle" />
          <div className="track track-outer" />

          <div className="ring ring-inner">
            {innerRelics.map((relic, i) => {
              const pos = ringPosition(i, innerRelics.length, 25);
              return (
                <div className="relic-item relic-item--inner" style={pos} key={relic.src}>
                  <div className="relic-item-inner relic-item-inner--inner">
                    <img src={relic.src} alt={relic.alt} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="ring ring-middle">
            {middleRelics.map((relic, i) => {
              const pos = ringPosition(i, middleRelics.length, 38);
              return (
                <div className="relic-item relic-item--middle" style={pos} key={relic.src}>
                  <div className="relic-item-inner relic-item-inner--middle">
                    <img src={relic.src} alt={relic.alt} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="ring ring-outer">
            {outerRelics.map((relic, i) => {
              const pos = ringPosition(i, outerRelics.length, 50);
              return (
                <div className="relic-item relic-item--outer" style={pos} key={relic.src}>
                  <div className="relic-item-inner relic-item-inner--outer">
                    <img src={relic.src} alt={relic.alt} />
                  </div>
                </div>
              );
            })}
          </div>

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

        /* ---------- Act 1 ---------- */
        .relic-hero {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 22%;
          perspective: 600px;
          animation: relicJourney 20s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }
        @keyframes relicJourney {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          8% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          40% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          46% { opacity: 0; transform: translate(-50%, -50%) scale(1.08); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.08); }
        }
        .goblet-photo {
          width: 100%;
          height: auto;
          display: block;
          filter: drop-shadow(0 14px 20px rgba(0, 0, 0, 0.22));
          animation: turnHint 20s ease-in-out infinite;
          transform-origin: center center;
        }
        @keyframes turnHint {
          0%, 9% { transform: rotateY(0deg); }
          18% { transform: rotateY(18deg); }
          30% { transform: rotateY(-18deg); }
          40%, 100% { transform: rotateY(0deg); }
        }

        .era-label {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          font-size: clamp(12px, 1.3vw, 15px);
          color: #7a3a1c;
          letter-spacing: .3px;
        }
        .era-old {
          top: 76%;
          animation: eraOld 20s linear infinite;
        }
        @keyframes eraOld {
          0%, 5% { opacity: 0; }
          9%, 38% { opacity: 1; }
          44%, 100% { opacity: 0; }
        }
        .era-new {
          position: static;
          margin-bottom: .5em;
          color: #c9932f;
          font-weight: 600;
        }

        /* ---------- transition burst ---------- */
        .burst {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: radial-gradient(circle, #fff 55%, rgba(255,255,255,0) 75%);
          transform: translate(-50%, -50%) scale(0);
          animation: burstPulse 20s linear infinite;
          pointer-events: none;
        }
        @keyframes burstPulse {
          0%, 43% { opacity: 0; transform: translate(-50%, -50%) scale(0); }
          47% { opacity: 1; transform: translate(-50%, -50%) scale(30); }
          54%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(30); }
        }

        /* ---------- Act 2 ---------- */
        .act-two {
          position: absolute;
          inset: 0;
          opacity: 0;
          animation: actTwo 20s linear infinite;
        }
        @keyframes actTwo {
          0%, 45% { opacity: 0; }
          52%, 92% { opacity: 1; }
          97%, 100% { opacity: 0; }
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
        }
        .glow {
          position: absolute;
          inset: 20%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 175, 50, 0.4), rgba(255, 175, 50, 0) 60%);
          animation: pulseGlow 4s ease-in-out infinite alternate;
        }
        @keyframes pulseGlow {
          from { transform: scale(1); opacity: 0.8; }
          to { transform: scale(1.2); opacity: 1; }
        }
        .track {
          position: absolute;
          border-radius: 50%;
          border: 1.5px dashed rgba(201, 147, 47, 0.4);
          transform: rotateX(65deg);
        }
        .track-inner { inset: 25%; }
        .track-middle { inset: 12%; }
        .track-outer { inset: 0%; }

        .ring { 
          position: absolute; 
          inset: 0; 
          transform-style: preserve-3d;
        }
        .ring-inner { animation: spin-inner 24s linear infinite; }
        .ring-middle { animation: spin-middle 32s linear infinite reverse; }
        .ring-outer { animation: spin-outer 40s linear infinite; }
        
        @keyframes spin-inner {
          from { transform: rotateX(65deg) rotateZ(0deg); }
          to { transform: rotateX(65deg) rotateZ(360deg); }
        }
        @keyframes spin-middle {
          from { transform: rotateX(65deg) rotateZ(0deg); }
          to { transform: rotateX(65deg) rotateZ(-360deg); }
        }
        @keyframes spin-outer {
          from { transform: rotateX(65deg) rotateZ(360deg); }
          to { transform: rotateX(65deg) rotateZ(0deg); }
        }

        .relic-item {
          position: absolute;
          transform: translate(-50%, -50%);
          transform-style: preserve-3d;
        }
        .relic-item--inner { width: 18%; aspect-ratio: 1; }
        .relic-item--middle { width: 15%; aspect-ratio: 1; }
        .relic-item--outer { width: 12%; aspect-ratio: 1; }

        .relic-item-inner {
          width: 100%;
          height: 100%;
          filter: drop-shadow(0 10px 15px rgba(0, 0, 0, 0.3));
        }
        .relic-item-inner--inner { animation: counter-spin-inner 24s linear infinite; }
        .relic-item-inner--middle { animation: counter-spin-middle 32s linear infinite reverse; }
        .relic-item-inner--outer { animation: counter-spin-outer 40s linear infinite; }
        
        @keyframes counter-spin-inner {
          from { transform: rotateZ(0deg) rotateX(-65deg); }
          to { transform: rotateZ(-360deg) rotateX(-65deg); }
        }
        @keyframes counter-spin-middle {
          from { transform: rotateZ(0deg) rotateX(-65deg); }
          to { transform: rotateZ(360deg) rotateX(-65deg); }
        }
        @keyframes counter-spin-outer {
          from { transform: rotateZ(-360deg) rotateX(-65deg); }
          to { transform: rotateZ(0deg) rotateX(-65deg); }
        }
        .relic-item-inner :global(img) {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }

        .center-brand {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          z-index: 2;
        }
        .center-brand h1 {
          margin: 0;
          font-size: clamp(24px, 3vw, 40px);
          font-weight: 800;
          color: #2a1c10;
        }
        .center-brand p {
          margin: .35em 0 0;
          font-size: clamp(10px, 1vw, 13px);
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
