'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

export type ProductAspectRatio = '4/3' | '1/1' | '3/4' | '16/9';

interface ProductImageCropModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onCropComplete: (croppedBase64: string) => void;
  title?: string;
  initialAspectRatio?: ProductAspectRatio;
}

const RATIO_VALUES: Record<ProductAspectRatio, { label: string; ratio: number; icon: string }> = {
  '4/3': { label: '۴:۳ (استاندارد گالری)', ratio: 4 / 3, icon: '🖼️' },
  '1/1': { label: '۱:۱ (مربع)', ratio: 1, icon: '⬛' },
  '3/4': { label: '۳:۴ (عمودی)', ratio: 3 / 4, icon: '📱' },
  '16/9': { label: '۱۶:۹ (سینمایی)', ratio: 16 / 9, icon: '🖥️' },
};

export default function ProductImageCropModal({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  title = 'کادربندی و تنظیم تصویر محصول',
  initialAspectRatio = '4/3'
}: ProductImageCropModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);

  // Aspect ratio state (default 4:3 rectangular)
  const [selectedRatio, setSelectedRatio] = useState<ProductAspectRatio>(initialAspectRatio);
  const activeRatioNum = RATIO_VALUES[selectedRatio].ratio;

  // Transform states
  const [zoom, setZoom] = useState<number>(1);
  const [minZoom, setMinZoom] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0);

  // Pointer dragging states
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const offsetStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Preview canvas ref for live mini-preview
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Viewport dimensions in pixels (capped to fit nicely inside mobile modal)
  const maxViewportWidth = 320;
  const maxViewportHeight = 260;

  let CROP_WIDTH = maxViewportWidth;
  let CROP_HEIGHT = Math.round(maxViewportWidth / activeRatioNum);

  if (CROP_HEIGHT > maxViewportHeight) {
    CROP_HEIGHT = maxViewportHeight;
    CROP_WIDTH = Math.round(maxViewportHeight * activeRatioNum);
  }

  // Load image whenever imageSrc or aspect ratio changes
  useEffect(() => {
    if (!imageSrc) {
      setImageObj(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      setImageObj(img);

      // Minimum zoom so image covers the entire crop box
      const scaleX = CROP_WIDTH / img.width;
      const scaleY = CROP_HEIGHT / img.height;
      const initialCoverScale = Math.max(scaleX, scaleY);

      setMinZoom(initialCoverScale);
      setZoom(initialCoverScale);
      setOffset({ x: 0, y: 0 });
      setRotation(0);
    };
  }, [imageSrc, CROP_WIDTH, CROP_HEIGHT]);

  // Pointer Down (Mouse or Touch)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    offsetStartRef.current = { ...offset };
    if (containerRef.current) {
      containerRef.current.setPointerCapture(e.pointerId);
    }
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    setOffset({
      x: offsetStartRef.current.x + deltaX,
      y: offsetStartRef.current.y + deltaY
    });
  };

  // Pointer Up
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    try {
      if (containerRef.current && containerRef.current.hasPointerCapture(e.pointerId)) {
        containerRef.current.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore capture release error
    }
  };

  // Wheel Zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomStep = 0.05 * zoom;
    if (e.deltaY < 0) {
      setZoom((prev) => Math.min(prev + zoomStep, minZoom * 4));
    } else {
      setZoom((prev) => Math.max(prev - zoomStep, minZoom * 0.8));
    }
  };

  // Render live preview on canvas
  const renderPreview = useCallback(() => {
    if (!imageObj || !previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const previewWidth = 90;
    const previewHeight = Math.round(90 / activeRatioNum);

    canvas.width = previewWidth;
    canvas.height = previewHeight;
    ctx.clearRect(0, 0, previewWidth, previewHeight);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, previewWidth, previewHeight);
    ctx.closePath();
    ctx.clip();

    const scaleRatio = previewWidth / CROP_WIDTH;

    ctx.translate(previewWidth / 2, previewHeight / 2);
    ctx.translate(offset.x * scaleRatio, offset.y * scaleRatio);
    ctx.rotate((rotation * Math.PI) / 180);

    const drawWidth = imageObj.width * zoom * scaleRatio;
    const drawHeight = imageObj.height * zoom * scaleRatio;

    ctx.drawImage(
      imageObj,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight
    );

    ctx.restore();
  }, [imageObj, offset, zoom, rotation, CROP_WIDTH, activeRatioNum]);

  useEffect(() => {
    renderPreview();
  }, [renderPreview]);

  // Rotate 90 degrees clockwise
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Reset to initial centered position
  const handleReset = () => {
    setZoom(minZoom);
    setOffset({ x: 0, y: 0 });
    setRotation(0);
  };

  // Confirm and generate crisp cropped base64 output
  const handleConfirmCrop = () => {
    if (!imageObj) return;

    // High resolution output for Retina/4K displays (1000px width)
    const outputWidth = 1000;
    const outputHeight = Math.round(1000 / activeRatioNum);

    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const scaleRatio = outputWidth / CROP_WIDTH;

    ctx.translate(outputWidth / 2, outputHeight / 2);
    ctx.translate(offset.x * scaleRatio, offset.y * scaleRatio);
    ctx.rotate((rotation * Math.PI) / 180);

    const drawWidth = imageObj.width * zoom * scaleRatio;
    const drawHeight = imageObj.height * zoom * scaleRatio;

    ctx.drawImage(
      imageObj,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight
    );

    // Export as high-quality JPEG
    const croppedBase64 = canvas.toDataURL('image/jpeg', 0.92);
    onCropComplete(croppedBase64);
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      dir="rtl"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col my-auto">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center text-xl shrink-0 shadow-2xs">
              🖼️
            </span>
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base">
                {title}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                تصویر را جابجا کنید تا به بهترین شکل در کادر مستطیل قرار گیرد
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Aspect Ratio Selector Pills */}
        <div className="px-5 py-2.5 bg-slate-100/70 border-b border-slate-200/80 flex items-center justify-between gap-2 overflow-x-auto">
          <span className="text-[11px] font-bold text-slate-600 shrink-0">نسبت کادر:</span>
          <div className="flex items-center gap-1.5 shrink-0">
            {(Object.keys(RATIO_VALUES) as ProductAspectRatio[]).map((r) => {
              const meta = RATIO_VALUES[r];
              const isSelected = selectedRatio === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRatio(r)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-teal-600 text-white shadow-sm ring-2 ring-teal-500/20'
                      : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  <span className="text-xs">{meta.icon}</span>
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Viewport Area */}
        <div className="p-4 sm:p-6 flex flex-col items-center bg-slate-950 select-none relative">
          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
            style={{ width: CROP_WIDTH, height: CROP_HEIGHT }}
            className="relative cursor-grab active:cursor-grabbing overflow-hidden rounded-2xl ring-4 ring-teal-500/80 shadow-[0_0_50px_rgba(0,0,0,0.8)] touch-none flex items-center justify-center bg-black"
          >
            {/* Image being dragged/zoomed/rotated */}
            {imageObj && (
              <img
                src={imageSrc}
                alt="Product Crop Target"
                draggable={false}
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${zoom})`,
                  transformOrigin: 'center center',
                  maxWidth: 'none',
                  maxHeight: 'none',
                }}
                className="pointer-events-none transition-transform duration-75 ease-out select-none"
              />
            )}

            {/* Rule-of-Thirds Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-25">
              <div className="border-r border-b border-white"></div>
              <div className="border-r border-b border-white"></div>
              <div className="border-b border-white"></div>
              <div className="border-r border-b border-white"></div>
              <div className="border-r border-b border-white"></div>
              <div className="border-b border-white"></div>
              <div className="border-r border-white"></div>
              <div className="border-r border-white"></div>
              <div></div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-3 font-medium">
            💡 با کشیدن ماوس یا لمس انگشت تصویر را جابجا کنید
          </p>
        </div>

        {/* Controls Section */}
        <div className="p-5 bg-white space-y-4">
          {/* Zoom Slider and Buttons */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <span>🔍</span>
                <span>بزرگ‌نمایی (Zoom)</span>
              </span>
              <span className="text-slate-400 font-mono" dir="ltr">
                {Math.round((zoom / minZoom) * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(z - minZoom * 0.2, minZoom * 0.8))}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-sm flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="کوچک‌نمایی"
              >
                −
              </button>
              <input
                type="range"
                min={minZoom * 0.8}
                max={minZoom * 3.5}
                step={minZoom * 0.05}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-teal-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(z + minZoom * 0.2, minZoom * 3.5))}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-sm flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="بزرگ‌نمایی"
              >
                +
              </button>
            </div>
          </div>

          {/* Action Row: Rotate, Reset, and Live Miniature Preview */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRotate}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                title="چرخش ۹۰ درجه تصویر"
              >
                <span>🔄</span>
                <span>چرخش</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                title="بازنشانی به حالت اولیه"
              >
                <span>⚡</span>
                <span>تنظیم مجدد</span>
              </button>
            </div>

            {/* Live Miniature Preview */}
            <div className="flex items-center gap-2.5">
              <div className="text-left">
                <span className="block text-[11px] font-bold text-slate-600">
                  پیش‌نمایش
                </span>
                <span className="block text-[10px] text-slate-400">
                  نمایش نهایی
                </span>
              </div>
              <div className="w-16 h-12 border-2 border-teal-500 p-0.5 bg-white shadow-xs rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                <canvas
                  ref={previewCanvasRef}
                  className="w-full h-full rounded object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-4 px-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={handleConfirmCrop}
            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>✓</span>
            <span>تایید و ذخیره کادر</span>
          </button>
        </div>
      </div>
    </div>
  );
}
