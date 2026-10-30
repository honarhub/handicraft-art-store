'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface AvatarCropModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onCropComplete: (croppedBase64: string) => void;
  shape?: 'circle' | 'rect';
  aspectRatio?: number; // e.g. 1.58 for National ID card
  title?: string;
  description?: string;
}

export default function AvatarCropModal({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  shape = 'circle',
  aspectRatio = 1.58,
  title,
  description
}: AvatarCropModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);

  // Transform states
  const [zoom, setZoom] = useState<number>(1);
  const [minZoom, setMinZoom] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0); // In degrees: 0, 90, 180, 270

  // Pointer dragging states
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const offsetStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Preview canvas ref for live mini-preview
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Viewport dimensions in pixels
  const CROP_WIDTH = shape === 'circle' ? 260 : 330;
  const CROP_HEIGHT = shape === 'circle' ? 260 : Math.round(330 / aspectRatio);

  // Load image whenever imageSrc changes
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

      // Calculate initial minimum zoom so the image covers the entire crop box
      const scaleX = CROP_WIDTH / img.width;
      const scaleY = CROP_HEIGHT / img.height;
      const initialCoverScale = Math.max(scaleX, scaleY);

      setMinZoom(initialCoverScale);
      setZoom(initialCoverScale);
      setOffset({ x: 0, y: 0 });
      setRotation(0);
    };
  }, [imageSrc, CROP_WIDTH, CROP_HEIGHT]);

  // Handle pointer down (mouse or touch)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    offsetStartRef.current = { ...offset };
    if (containerRef.current) {
      containerRef.current.setPointerCapture(e.pointerId);
    }
  };

  // Handle pointer move
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    setOffset({
      x: offsetStartRef.current.x + deltaX,
      y: offsetStartRef.current.y + deltaY
    });
  };

  // Handle pointer up
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

  // Handle mouse wheel zoom
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

    const previewWidth = shape === 'circle' ? 80 : 100;
    const previewHeight = shape === 'circle' ? 80 : Math.round(100 / (aspectRatio || 1.58));

    canvas.width = previewWidth;
    canvas.height = previewHeight;
    ctx.clearRect(0, 0, previewWidth, previewHeight);

    // Clip path for mini preview (circle or rounded rect)
    ctx.save();
    ctx.beginPath();
    if (shape === 'circle') {
      ctx.arc(previewWidth / 2, previewHeight / 2, previewWidth / 2, 0, Math.PI * 2);
    } else {
      ctx.rect(0, 0, previewWidth, previewHeight);
    }
    ctx.closePath();
    ctx.clip();

    // Scale ratio between live preview canvas and crop viewport
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
  }, [imageObj, offset, zoom, rotation, CROP_WIDTH, shape, aspectRatio]);

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

  // Generate crisp cropped base64 output
  const handleConfirmCrop = () => {
    if (!imageObj) return;

    const outputWidth = shape === 'circle' ? 512 : 800;
    const outputHeight = shape === 'circle' ? 512 : Math.round(800 / (aspectRatio || 1.58));

    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Scale factors relative to modal crop viewport
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
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center text-xl shrink-0">
              {shape === 'rect' ? '🪪' : '🖼️'}
            </span>
            <div>
              <h3 className="font-black text-slate-800 text-base">
                {title || (shape === 'circle' ? 'تنظیم کادربندی عکس پروفایل' : 'تنظیم کادربندی تصویر')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {description || (shape === 'circle' 
                  ? 'عکس را جابجا کنید تا به بهترین شکل در دایره پروفایل قرار گیرد'
                  : 'عکس را جابجا کنید تا به بهترین شکل در کادر مستطیل قرار گیرد')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Viewport Area */}
        <div className="p-6 flex flex-col items-center bg-slate-900 select-none relative">
          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
            style={{ width: CROP_WIDTH, height: CROP_HEIGHT }}
            className={`relative cursor-grab active:cursor-grabbing overflow-hidden ${
              shape === 'circle' ? 'rounded-full' : 'rounded-2xl'
            } ring-4 ring-teal-500/80 shadow-[0_0_50px_rgba(0,0,0,0.8)] touch-none flex items-center justify-center bg-slate-950`}
          >
            {/* Image being dragged/zoomed/rotated */}
            {imageObj && (
              <img
                src={imageSrc}
                alt="Crop target"
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

            {/* Subtle Rule-of-Thirds Grid Overlay */}
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
            💡 با کشیدن ماوس تصویر را جابجا کنید یا اسکرول کنید
          </p>
        </div>

        {/* Controls Section */}
        <div className="p-6 bg-white space-y-5">
          {/* Zoom Slider and Buttons */}
          <div className="space-y-2">
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
                title="بازنشانی موقعیت به حالت اولیه"
              >
                <span>⚡</span>
                <span>تنظیم مجدد</span>
              </button>
            </div>

            {/* Live Miniature Preview */}
            <div className="flex items-center gap-2.5">
              <div className="text-left">
                <span className="block text-[11px] font-bold text-slate-600">
                  پیش‌نمایش نهایی
                </span>
                <span className="block text-[10px] text-slate-400">
                  {shape === 'circle' ? 'نمایش در پروفایل' : 'کیفیت نهایی'}
                </span>
              </div>
              <div className={`${
                shape === 'circle' ? 'w-11 h-11 rounded-full' : 'w-16 h-10 rounded-lg'
              } border-2 border-teal-500 p-0.5 bg-white shadow-sm overflow-hidden shrink-0 flex items-center justify-center`}>
                <canvas
                  ref={previewCanvasRef}
                  className={`w-full h-full ${shape === 'circle' ? 'rounded-full' : 'rounded-md'} object-cover`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
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
            <span>تایید و اعمال تغییرات</span>
          </button>
        </div>
      </div>
    </div>
  );
}
