'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Camera,
  RotateCcw,
  Download,
  Share2,
  Check,
  Sliders,
  RefreshCw,
  ArrowLeft,
  X,
  Sparkles,
} from 'lucide-react';
import { generateStampSvg } from '../../lib/svg-generator';

const INK_COLORS = [
  { id: 'blue', name: 'Stamp Blue', hex: '#1e3a8a' },
  { id: 'black', name: 'Carbon Black', hex: '#111827' },
  { id: 'red', name: 'Official Red', hex: '#dc2626' },
  { id: 'green', name: 'Desk Green', hex: '#15803d' },
  { id: 'violet', name: 'Violet', hex: '#6b21a8' },
];

export default function MobileARPreviewPage() {
  const [stampData, setStampData] = useState<{
    title: string;
    widthMm: number;
    heightMm: number;
    inkColor: string;
    elements: any[];
    shape: any;
  } | null>(null);

  const [hasCamera, setHasCamera] = useState<boolean>(false);
  const [cameraLoading, setCameraLoading] = useState<boolean>(true);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Transform
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(-2);
  const [opacity, setOpacity] = useState<number>(0.88);
  const [activeInk, setActiveInk] = useState<string>('#1e3a8a');
  const [showControls, setShowControls] = useState<boolean>(false);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; posX: number; posY: number }>({
    clientX: 0,
    clientY: 0,
    posX: 50,
    posY: 50,
  });

  // Load stamp data from URL Hash or localStorage on mount
  useEffect(() => {
    try {
      // 1. Check if passed via URL Hash (#stamp=...)
      if (typeof window !== 'undefined' && window.location.hash.includes('stamp=')) {
        const hashMatch = window.location.hash.match(/stamp=([^&]+)/);
        if (hashMatch && hashMatch[1]) {
          const jsonStr = decodeURIComponent(escape(atob(hashMatch[1])));
          const parsed = JSON.parse(jsonStr);
          if (parsed && parsed.elements) {
            setStampData(parsed);
            if (parsed.inkColor) setActiveInk(parsed.inkColor);
            return;
          }
        }
      }

      // 2. Fallback to localStorage if accessed from the same browser
      const cached = localStorage.getItem('stamiox_ar_stamp_data');
      if (cached) {
        const parsed = JSON.parse(cached);
        setStampData(parsed);
        if (parsed.inkColor) setActiveInk(parsed.inkColor);
      } else {
        // Fallback default stamp if opened directly
        setStampData({
          title: 'Official Notary Seal',
          widthMm: 45,
          heightMm: 45,
          inkColor: '#1e3a8a',
          shape: 'ROUND',
          elements: [
            {
              id: 'r1',
              type: 'ring',
              name: 'Outer Border',
              cx: 22.5,
              cy: 22.5,
              radius: 21,
              strokeWidth: 0.8,
              strokeType: 'solid',
              visible: true,
            },
            {
              id: 'r2',
              type: 'ring',
              name: 'Inner Ring',
              cx: 22.5,
              cy: 22.5,
              radius: 19.5,
              strokeWidth: 0.35,
              strokeType: 'solid',
              visible: true,
            },
            {
              id: 'arc1',
              type: 'arc-text',
              name: 'Header Arc',
              text: 'APEX INFOTECH SOLUTIONS',
              cx: 22.5,
              cy: 22.5,
              radius: 15.5,
              startAngle: -140,
              sweepAngle: 100,
              fontSize: 2.8,
              fontFamily: 'Inter',
              fontWeight: 'bold',
              visible: true,
            },
            {
              id: 'arc2',
              type: 'arc-text',
              name: 'Footer Arc',
              text: 'KOCHI · KERALA',
              cx: 22.5,
              cy: 22.5,
              radius: 15.5,
              startAngle: 40,
              sweepAngle: 100,
              fontSize: 2.4,
              fontFamily: 'Inter',
              fontWeight: 'bold',
              isReversed: true,
              visible: true,
            },
            {
              id: 't1',
              type: 'text',
              name: 'Center Star',
              text: '★ ★ ★',
              x: 22.5,
              y: 20,
              fontSize: 2.4,
              align: 'center',
              visible: true,
            },
            {
              id: 't2',
              type: 'text',
              name: 'Official Tag',
              text: 'OFFICIAL SEAL',
              x: 22.5,
              y: 24.5,
              fontSize: 2.0,
              fontWeight: 'bold',
              align: 'center',
              visible: true,
            },
          ],
        });
      }
    } catch (e) {
      console.warn('Error reading stamp data', e);
    }
  }, []);

  // Camera initializer
  const startCamera = async (facing: 'environment' | 'user') => {
    setCameraLoading(true);
    setCameraError(null);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera is not supported on this browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      setHasCamera(true);
      setCameraLoading(false);
    } catch (err: any) {
      console.warn('Camera error', err);
      setHasCamera(false);
      setCameraLoading(false);
      setCameraError(err.message || 'Camera permission denied');
    }
  };

  useEffect(() => {
    startCamera(cameraFacing);
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [cameraFacing]);

  // Stamp SVG
  const stampSvgString = useMemo(() => {
    if (!stampData) return '';
    return generateStampSvg({
      widthMm: stampData.widthMm || 45,
      heightMm: stampData.heightMm || 45,
      inkColor: activeInk,
      elements: stampData.elements || [],
      shape: stampData.shape || 'ROUND',
      distressEffect: true,
    });
  }, [stampData, activeInk]);

  // Dragging
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    isDraggingRef.current = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStartRef.current = {
      clientX,
      clientY,
      posX: pos.x,
      posY: pos.y,
    };
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current || !stageRef.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const rect = stageRef.current.getBoundingClientRect();
      const deltaX = ((clientX - dragStartRef.current.clientX) / rect.width) * 100;
      const deltaY = ((clientY - dragStartRef.current.clientY) / rect.height) * 100;

      setPos({
        x: Math.max(10, Math.min(90, dragStartRef.current.posX + deltaX)),
        y: Math.max(10, Math.min(90, dragStartRef.current.posY + deltaY)),
      });
    };

    const handleEnd = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, []);

  // Snapshot
  const handleSnapshot = async () => {
    setIsCapturing(true);
    try {
      const stage = stageRef.current;
      if (!stage) return;

      const canvas = document.createElement('canvas');
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      canvas.width = w * 2;
      canvas.height = h * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.scale(2, 2);

      // Draw camera video
      if (videoRef.current && hasCamera) {
        ctx.drawImage(videoRef.current, 0, 0, w, h);
      } else {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, w, h);
      }

      // Draw Stamp with Multiply
      const img = new Image();
      const svgBlob = new Blob([stampSvgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      await new Promise<void>((resolve) => {
        img.onload = () => {
          const wMm = stampData?.widthMm || 45;
          const hMm = stampData?.heightMm || 45;
          const baseW = (wMm / 50) * (w * 0.42) * scale;
          const baseH = (hMm / 50) * (w * 0.42) * scale;

          const stampPxX = (pos.x / 100) * w;
          const stampPxY = (pos.y / 100) * h;

          ctx.save();
          ctx.translate(stampPxX, stampPxY);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.globalAlpha = opacity;
          ctx.globalCompositeOperation = 'multiply';
          ctx.drawImage(img, -baseW / 2, -baseH / 2, baseW, baseH);
          ctx.restore();

          URL.revokeObjectURL(url);
          resolve();
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        img.src = url;
      });

      setSnapshotUrl(canvas.toDataURL('image/png', 0.95));
    } catch (e) {
      console.error(e);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Real-World Stamp Proof: *${stampData?.title || 'Stamp'}*\n` +
      `Tested live on paper using Stamiox Mobile AR Camera.`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-black text-white flex flex-col overflow-hidden select-none">
      {/* Top Mobile Bar */}
      <div className="px-4 py-3 bg-black/70 backdrop-blur-md z-20 flex items-center justify-between border-b border-white/10">
        <Link
          href="/editor"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Studio</span>
        </Link>

        <div className="text-center">
          <div className="text-xs font-bold flex items-center justify-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Mobile AR Camera</span>
          </div>
          <div className="text-[10px] text-white/60 truncate max-w-[180px]">
            {stampData?.title || 'Stamp Design'}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
            setCameraFacing(nextFacing);
          }}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
          title="Flip Camera"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* AR Viewport Stage */}
      <div
        ref={stageRef}
        className="flex-1 relative overflow-hidden bg-black flex items-center justify-center touch-none"
      >
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="w-full h-full object-cover pointer-events-none"
        />

        {cameraLoading && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full border-3 border-white/20 border-t-[#0d99ff] animate-spin" />
            <p className="text-xs text-white/80">Opening camera...</p>
          </div>
        )}

        {!cameraLoading && !hasCamera && (
          <div className="absolute inset-0 bg-black/90 p-6 flex flex-col items-center justify-center text-center gap-3">
            <Camera className="w-12 h-12 text-amber-400" />
            <h4 className="text-sm font-bold">Camera Permission Required</h4>
            <p className="text-xs text-white/60 max-w-xs">{cameraError}</p>
            <button
              onClick={() => startCamera(cameraFacing)}
              className="mt-2 px-4 py-2 rounded-xl bg-[#0d99ff] font-bold text-xs"
            >
              Retry Camera
            </button>
          </div>
        )}

        {/* The Stamp Overlay (Draggable & Realistic Multiply Blend) */}
        {stampData && (
          <div
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            style={{
              position: 'absolute',
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
              mixBlendMode: 'multiply',
              opacity,
              touchAction: 'none',
              filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.2))',
            }}
            className="cursor-grab active:cursor-grabbing active:scale-95 transition-transform duration-75"
          >
            <div
              style={{
                width: `${(stampData.widthMm || 45) * 2.8}px`,
                height: `${(stampData.heightMm || 45) * 2.8}px`,
              }}
              dangerouslySetInnerHTML={{ __html: stampSvgString }}
            />
          </div>
        )}

        {/* Center Target Box */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-48 h-48 border border-white/20 rounded-2xl relative">
            <span className="absolute top-2 left-2 text-[9px] font-mono text-white/40">
              STAMP ON PAPER
            </span>
          </div>
        </div>

        {/* Floating Shutter Dock */}
        <div className="absolute bottom-6 inset-x-0 flex items-center justify-center gap-4 z-10">
          <button
            type="button"
            onClick={() => setShowControls(!showControls)}
            className={`p-3 rounded-full backdrop-blur-md border ${
              showControls ? 'bg-[#0d99ff] border-[#0d99ff]' : 'bg-black/60 border-white/20'
            }`}
          >
            <Sliders className="w-5 h-5 text-white" />
          </button>

          {/* Shutter */}
          <button
            type="button"
            onClick={handleSnapshot}
            disabled={isCapturing}
            className="w-18 h-18 rounded-full bg-white active:scale-90 flex items-center justify-center shadow-2xl ring-4 ring-white/30"
          >
            {isCapturing ? (
              <span className="w-6 h-6 rounded-full border-3 border-slate-300 border-t-[#0d99ff] animate-spin" />
            ) : (
              <div className="w-15 h-15 rounded-full border-2 border-black/20 flex items-center justify-center">
                <Camera className="w-7 h-7 text-black" />
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setPos({ x: 50, y: 50 });
              setRotation(-2);
              setScale(1.0);
            }}
            className="p-3 rounded-full bg-black/60 backdrop-blur-md border border-white/20"
          >
            <RotateCcw className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Adjustments Drawer */}
      {showControls && (
        <div className="p-4 bg-black/90 backdrop-blur-md border-t border-white/10 z-20 space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-white/80">
              <span>Natural Tilt:</span>
              <span className="font-mono text-[#0d99ff]">{rotation}°</span>
            </div>
            <input
              type="range"
              min="-40"
              max="40"
              step="1"
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="w-full accent-[#0d99ff]"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-white/80">
              <span>Scale:</span>
              <span className="font-mono text-[#0d99ff]">{(scale * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.6"
              max="1.6"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="w-full accent-[#0d99ff]"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <span className="text-xs text-white/80">Ink Color:</span>
            <div className="flex items-center gap-2">
              {INK_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveInk(c.hex)}
                  className={`w-6 h-6 rounded-full relative ${
                    activeInk === c.hex ? 'ring-2 ring-[#0d99ff] ring-offset-2 ring-offset-black' : ''
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  {activeInk === c.hex && (
                    <Check className="w-3.5 h-3.5 text-white absolute inset-0 m-auto stroke-[3]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Snapshot Preview Modal */}
      {snapshotUrl && (
        <div className="fixed inset-0 z-30 bg-black/95 flex flex-col p-4 animate-in zoom-in-95">
          <div className="flex justify-between items-center pb-3 border-b border-white/10">
            <span className="text-xs font-bold text-emerald-400">Photo Proof Captured!</span>
            <button onClick={() => setSnapshotUrl(null)} className="p-1 text-white/60">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 my-3 flex items-center justify-center overflow-hidden">
            <img src={snapshotUrl} alt="Captured" className="max-h-full max-w-full object-contain rounded-xl" />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
            <button
              onClick={handleShareWhatsApp}
              className="py-2.5 rounded-xl bg-emerald-600 font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <Share2 className="w-4 h-4" />
              <span>Share WhatsApp</span>
            </button>
            <a
              href={snapshotUrl}
              download="stamp_real_proof.png"
              className="py-2.5 rounded-xl bg-[#0d99ff] font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Save Photo</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
