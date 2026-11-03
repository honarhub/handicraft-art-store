'use client';

import React, { useState } from 'react';

export default function ArtistDashboardCopyId({ displayId }: { displayId: number | string }) {
  const [copied, setCopied] = useState(false);
  const code = `HH-${displayId}`;

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-mono transition-all cursor-pointer shadow-2xs"
      title="کپی شناسه هنرمند"
    >
      <span>#{code}</span>
      <span className="text-[11px] text-teal-200 font-sans">
        {copied ? '✓ کپی شد' : '📋 کپی'}
      </span>
    </button>
  );
}
