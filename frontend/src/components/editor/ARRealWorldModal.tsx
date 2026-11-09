'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  Camera,
  RotateCcw,
  Sparkles,
  Download,
  Share2,
  Check,
  Maximize2,
  Minimize2,
  Sliders,
  QrCode,
  FileText,
  Layers,
  Printer,
  ChevronRight,
  Eye,
  RefreshCw,
  Info,
} from 'lucide-react';
import QRCode from 'qrcode';
import { useEditor } from '../../context/EditorContext';
import { generateStampSvg } from '../../lib/svg-generator';

interface ARRealWorldModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 6 Realistic Real-World Paper & Surface Presets for Desktop / Camera fallback
const DOCUMENT_PRESETS = [
  {
    id: 'invoice',
    name: 'Tax Invoice',
    desc: 'Lined business bill & receipt',
    accent: '#2563eb',
    type: 'invoice',
  },
  {
    id: 'legal',
    name: 'Legal Bond Paper',
    desc: 'Notary & judicial certificate',
    accent: '#059669',
    type: 'legal',
  },
  {
    id: 'cheque',
    name: 'Bank Cheque Leaf',
    desc: 'Official payment voucher',
    accent: '#7c3aed',
    type: 'cheque',
  },
  {
    id: 'parcel',
    name: 'Kraft Box / Parcel',
    desc: 'Cardboard shipping package',
    accent: '#d97706',
    type: 'parcel',
  },
  {
    id: 'wood_desk',
    name: 'Wooden Office Desk',
    desc: 'Natural oak desk surface',
    accent: '#78350f',
    type: 'wood_desk',
  },
  {
    id: 'plain_a4',
    name: 'Crisp White A4',
    desc: 'Plain clean 80gsm paper',
    accent: '#64748b',
    type: 'plain_a4',
  },
];

const INK_COLORS = [
  { id: 'original', name: 'Design Ink', hex: '' },
  { id: 'blue', name: 'Stamp Blue', hex: '#1e3a8a' },
  { id: 'black', name: 'Carbon Black', hex: '#111827' },
  { id: 'red', name: 'Official Red', hex: '#dc2626' },
  { id: 'green', name: 'Desk Green', hex: '#15803d' },
  { id: 'violet', name: 'Violet', hex: '#6b21a8' },
];

export const ARRealWorldModal: React.FC<ARRealWorldModalProps> = ({ isOpen, onClose }) => {
  const {
    widthMm,
    heightMm,
    inkColor,
    elements,
    projectTitle,
    shape,
  } = useEditor();

  // Mode: 'camera' (AR live video) | 'preset' (simulated real-world paper)
  const [viewMode, setViewMode] = useState<'camera' | 'preset'>('camera');
  const [activePreset, setActivePreset] = useState<string>('invoice');

  // Camera State
  const [hasCamera, setHasCamera] = useState<boolean>(false);
  const [cameraLoading, setCameraLoading] = useState<boolean>(true);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // AR Stamp Transform State
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 }); // in percentages
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(-2); // slight natural tilt
  const [opacity, setOpacity] = useState<number>(0.88); // realistic ink absorption
  const [distress, setDistress] = useState<boolean>(true); // realistic porous rubber texture
  const [activeInk, setActiveInk] = useState<string>(inkColor);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // UI Panels
  const [showControls, setShowControls] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  // Dragging state
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; posX: number; posY: number }>({
    clientX: 0,
    clientY: 0,
    posX: 50,
    posY: 50,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  // Sync active ink if editor ink changes
  useEffect(() => {
    setActiveInk(inkColor);
  }, [inkColor]);

  // Save current design to localStorage so mobile AR page can read it
  useEffect(() => {
    if (!isOpen) return;
    try {
      const stampData = {
        title: projectTitle || 'Custom Stamp',
        widthMm,
        heightMm,
        inkColor: activeInk,
        elements,
        shape,
      };
      localStorage.setItem('stamiox_ar_stamp_data', JSON.stringify(stampData));
    } catch (e) {
      console.warn('Could not cache stamp data in localStorage', e);
    }
  }, [isOpen, widthMm, heightMm, activeInk, elements, shape, projectTitle]);

  // Generate QR Code linking to Mobile AR page (with hash encoding so phones load exact stamp)
  useEffect(() => {
    if (!isOpen) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    let mobileUrl = `${origin}/ar-preview`;
    try {
      const minified = {
        title: projectTitle,
        widthMm,
        heightMm,
        inkColor: activeInk,
        shape,
        elements,
      };
      const jsonStr = JSON.stringify(minified);
      if (jsonStr.length < 2500) {
        const b64 = btoa(unescape(encodeURIComponent(jsonStr)));
        mobileUrl = `${origin}/ar-preview#stamp=${b64}`;
      }
    } catch (e) {
      // fallback to clean url
    }

    QRCode.toDataURL(mobileUrl, { width: 220, margin: 1, color: { dark: '#0b0f19', light: '#ffffff' } })
      .then(setQrDataUrl)
      .catch((err) => console.error('QR code error', err));
  }, [isOpen, projectTitle, widthMm, heightMm, activeInk, shape, elements]);

  // Start Camera Stream
  const initCamera = async (facing: 'environment' | 'user') => {
    setCameraLoading(true);
    setCameraError(null);

    // Stop existing stream if any
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported on this browser or connection');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      setHasCamera(true);
      setCameraLoading(false);
    } catch (err: any) {
      console.warn('Camera failed to start:', err);
      setHasCamera(false);
      setCameraLoading(false);
      setCameraError(err.name === 'NotAllowedError' ? 'Camera permission was denied' : 'Camera device not accessible');
      // If camera fails, automatically switch to realistic document preset mode!
      setViewMode('preset');
    }
  };

  // Lifecycle: Start camera when opened in camera mode
  useEffect(() => {
    if (!isOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      return;
    }

    if (viewMode === 'camera') {
      initCamera(cameraFacing);
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, viewMode, cameraFacing]);

  // Generate Stamp SVG String
  const stampSvgString = useMemo(() => {
    return generateStampSvg({
      widthMm,
      heightMm,
      inkColor: activeInk,
      elements,
      shape,
      invert: false,
      mirror: false,
      distressEffect: distress,
    });
  }, [widthMm, heightMm, activeInk, elements, shape, distress]);

  // Touch & Mouse Drag Handlers
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
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

      const newX = Math.max(8, Math.min(92, dragStartRef.current.posX + deltaX));
      const newY = Math.max(8, Math.min(92, dragStartRef.current.posY + deltaY));

      setPos({ x: newX, y: newY });
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

  // Take High-Res Real-World Snapshot
  const handleTakeSnapshot = async () => {
    setIsCapturing(true);

    try {
      const stage = stageRef.current;
      if (!stage) return;

      const canvas = document.createElement('canvas');
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      canvas.width = w * 2; // retina 2x
      canvas.height = h * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.scale(2, 2);

      // 1. Draw Background (Video frame OR Document Preset)
      if (viewMode === 'camera' && videoRef.current && hasCamera) {
        ctx.drawImage(videoRef.current, 0, 0, w, h);
      } else {
        // Draw the document preset background
        ctx.fillStyle = activePreset === 'wood_desk' ? '#8b4513' : activePreset === 'parcel' ? '#d4a373' : '#f8fafc';
        ctx.fillRect(0, 0, w, h);

        // Simple realistic paper sheet in center
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.15)';
        ctx.shadowBlur = 25;
        ctx.shadowOffsetY = 8;
        const padX = w * 0.08;
        const padY = h * 0.08;
        ctx.fillRect(padX, padY, w - padX * 2, h - padY * 2);
        ctx.shadowColor = 'transparent';
      }

      // 2. Draw Stamp SVG with Realistic Ink Multiply Blending
      const img = new Image();
      const svgBlob = new Blob([stampSvgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      await new Promise<void>((resolve) => {
        img.onload = () => {
          // Stamp pixel dimensions based on scale
          const baseW = (widthMm / 50) * (w * 0.35) * scale;
          const baseH = (heightMm / 50) * (w * 0.35) * scale;

          const stampPxX = (pos.x / 100) * w;
          const stampPxY = (pos.y / 100) * h;

          ctx.save();
          ctx.translate(stampPxX, stampPxY);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.globalAlpha = opacity;
          ctx.globalCompositeOperation = 'multiply'; // Ink absorbs into paper grain!

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

      // Convert to downloadable data URL
      const dataUrl = canvas.toDataURL('image/png', 0.95);
      setSnapshotUrl(dataUrl);
    } catch (err) {
      console.error('Snapshot failed', err);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleDownloadSnapshot = () => {
    if (!snapshotUrl) return;
    const a = document.createElement('a');
    a.href = snapshotUrl;
    a.download = `${projectTitle.replace(/\s+/g, '_')}_real_preview.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Real-World Stamp Proof: *${projectTitle}*\n` +
      `Physical Size: ${widthMm} × ${heightMm} mm\n` +
      `Ink Color: ${activeInk}\n` +
      `Tested with Stamiox AR Real-World Camera Preview`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Real-World AR Stamp Preview"
        className={`relative w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isFullscreen ? 'fixed inset-0 rounded-none max-w-none h-full' : 'max-w-4xl h-[90vh] max-h-[840px]'
        }`}
      >
        {/* Top Header Bar */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0d99ff] to-cyan-400 text-white flex items-center justify-center shadow-xs shrink-0">
              <Camera className="w-4 h-4 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                  Real-World AR Preview
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live AR
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden xs:block">
                Drag to stamp on paper · Realistic ink impression with paper texture
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* View Mode Toggle: Camera vs Documents */}
            <div className="flex items-center p-0.5 rounded-xl bg-slate-800 border border-slate-700/80 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('camera')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'camera'
                    ? 'bg-[#0d99ff] text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Camera</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preset')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'preset'
                    ? 'bg-[#0d99ff] text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Documents</span>
              </button>
            </div>

            {/* Camera Switcher (Front/Back) */}
            {viewMode === 'camera' && hasCamera && (
              <button
                type="button"
                onClick={() => {
                  const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
                  setCameraFacing(nextFacing);
                  initCamera(nextFacing);
                }}
                title="Flip Camera (Front / Rear)"
                className="w-8 h-8 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Mobile QR Code Button */}
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              title="Open on Smartphone Camera via QR code"
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-[#0d99ff]" />
              <span>On Phone</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="w-8 h-8 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewport Stage: Live Camera Feed OR Document Preset */}
        <div
          ref={stageRef}
          className="flex-1 relative overflow-hidden bg-black select-none touch-none flex items-center justify-center"
        >
          {/* A. Live Video Feed (AR Mode) */}
          {viewMode === 'camera' && (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover pointer-events-none"
              />

              {/* Camera Loading Overlay */}
              {cameraLoading && (
                <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full border-3 border-slate-700 border-t-[#0d99ff] animate-spin" />
                  <p className="text-xs font-semibold text-slate-300">
                    Connecting to your camera...
                  </p>
                </div>
              )}

              {/* Camera Permission / Error Fallback */}
              {!cameraLoading && !hasCamera && (
                <div className="absolute inset-0 bg-slate-900/90 p-6 flex flex-col items-center justify-center text-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Camera className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Camera Access Needed</h4>
                  <p className="text-xs text-slate-400 max-w-sm">
                    {cameraError || 'Please allow camera access in browser to view stamp on your table/paper.'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => initCamera(cameraFacing)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#0d99ff] text-white text-xs font-bold hover:bg-[#0b87e0] transition-colors"
                    >
                      Try Again
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('preset')}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-750 transition-colors"
                    >
                      Use Sample Documents
                    </button>
                  </div>
                </div>
              )}

              {/* AR Target Finder Crosshairs */}
              {hasCamera && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 border border-white/20 rounded-2xl relative flex items-center justify-center">
                    <div className="w-3 h-3 border-t-2 border-l-2 border-[#0d99ff] absolute -top-0.5 -left-0.5" />
                    <div className="w-3 h-3 border-t-2 border-r-2 border-[#0d99ff] absolute -top-0.5 -right-0.5" />
                    <div className="w-3 h-3 border-b-2 border-l-2 border-[#0d99ff] absolute -bottom-0.5 -left-0.5" />
                    <div className="w-3 h-3 border-b-2 border-r-2 border-[#0d99ff] absolute -bottom-0.5 -right-0.5" />
                    <span className="text-[10px] text-white/50 tracking-wider font-mono">
                      AR TARGET
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* B. Simulated Real-World Paper & Document Stage (Fallback / Studio) */}
          {viewMode === 'preset' && (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center p-4 sm:p-8 bg-slate-950">
              <div
                className={`relative w-full max-w-xl aspect-[1/1.35] rounded-xl shadow-2xl transition-all duration-300 overflow-hidden flex flex-col ${
                  activePreset === 'wood_desk'
                    ? 'bg-gradient-to-br from-[#78350f] via-[#92400e] to-[#451a03] border-4 border-[#78350f]'
                    : activePreset === 'parcel'
                    ? 'bg-[#d4a373] border-4 border-[#b08968]'
                    : 'bg-white text-slate-900 border border-slate-200'
                }`}
              >
                {/* Simulated Document Header */}
                {activePreset === 'invoice' && (
                  <div className="p-6 flex-1 flex flex-col justify-between font-sans">
                    <div className="border-b-2 border-slate-200 pb-4 flex justify-between items-start">
                      <div>
                        <div className="text-xl font-black text-slate-900 tracking-tight">COMMERCIAL INVOICE</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">INV-2026-8849 · ORIGINAL COPY</div>
                      </div>
                      <div className="text-right text-[10px] text-slate-500 leading-tight">
                        <strong>Apex Global Ltd</strong><br />
                        Kochi, Kerala<br />
                        GST: 32AAAAA0000A1Z5
                      </div>
                    </div>

                    <div className="space-y-2 py-4 flex-1">
                      <div className="text-[11px] font-bold text-slate-700">BILL TO: High-Tech Industries</div>
                      <div className="border border-slate-200 rounded-md overflow-hidden text-[10px]">
                        <div className="bg-slate-100 font-bold p-2 flex justify-between border-b border-slate-200">
                          <span>Description</span>
                          <span>Total</span>
                        </div>
                        <div className="p-2 flex justify-between border-b border-slate-100">
                          <span>Precision Laser Rubber Mount - 45mm</span>
                          <span>₹1,450.00</span>
                        </div>
                        <div className="p-2 flex justify-between border-b border-slate-100">
                          <span>Special Red Self-Inking Cartridge</span>
                          <span>₹320.00</span>
                        </div>
                        <div className="p-2 flex justify-between font-bold bg-slate-50">
                          <span>TOTAL (Incl. GST)</span>
                          <span className="text-emerald-700">₹1,770.00</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-dashed border-slate-300 flex justify-between items-end">
                      <div className="text-[9px] text-slate-400">
                        * Computer generated bill.<br />Valid when duly stamped & signed.
                      </div>
                      <div className="text-center w-40">
                        <div className="h-10 border-b border-slate-400"></div>
                        <div className="text-[10px] font-bold text-slate-700 mt-1">AUTHORIZED SIGNATORY</div>
                      </div>
                    </div>
                  </div>
                )}

                {activePreset === 'legal' && (
                  <div className="p-6 flex-1 flex flex-col justify-between font-serif text-slate-900 border-8 border-double border-emerald-900/30 m-3 bg-[#faf9f6]">
                    <div className="text-center border-b border-emerald-900/30 pb-3">
                      <div className="text-xs uppercase tracking-widest text-emerald-900 font-bold">Government of India</div>
                      <div className="text-base font-bold mt-1">NOTARIAL & LEGAL AGREEMENT</div>
                    </div>
                    <div className="text-[10px] leading-relaxed text-slate-700 space-y-2 py-4">
                      <p>
                        This document verifies that the designated parties have fulfilled all legal mandates
                        herein described, certified under official seal and authorized signature.
                      </p>
                      <p>
                        In witness whereof, the said parties have set their hands and seals on this 7th day of November, 2026.
                      </p>
                    </div>
                    <div className="flex justify-between items-end pt-4 border-t border-emerald-900/20">
                      <div className="text-[9px] text-slate-500 font-sans">REG NO: TSR/4482/2026</div>
                      <div className="text-center">
                        <div className="text-[10px] font-bold">NOTARY PUBLIC / ATTESTING OFFICER</div>
                      </div>
                    </div>
                  </div>
                )}

                {activePreset === 'cheque' && (
                  <div className="p-6 flex-1 flex flex-col justify-between bg-[#f0fdf4] border-2 border-emerald-300 m-2 font-mono text-slate-800">
                    <div className="flex justify-between items-center border-b border-emerald-200 pb-2">
                      <span className="font-bold text-emerald-950">APEX NATIONAL BANK</span>
                      <span className="text-[10px]">DATE: [ 07 / 11 / 2026 ]</span>
                    </div>
                    <div className="space-y-3 py-4 text-xs font-sans">
                      <div className="border-b border-slate-400 pb-1">PAY: <strong>M/S TRIVANDRUM TRADERS</strong></div>
                      <div className="border-b border-slate-400 pb-1 flex justify-between">
                        <span>RUPEES: <strong>TWENTY FIVE THOUSAND ONLY</strong></span>
                        <span className="px-2 py-0.5 bg-white border border-emerald-400 font-mono font-bold">₹ 25,000/-</span>
                      </div>
                    </div>
                    <div className="text-right pt-4">
                      <div className="text-[11px] font-bold font-sans">FOR APEX ENTERPRISES</div>
                      <div className="text-[9px] text-slate-500 mt-6">AUTHORIZED SIGNATORY</div>
                    </div>
                  </div>
                )}

                {activePreset === 'parcel' && (
                  <div className="p-6 flex-1 flex flex-col justify-between font-mono text-amber-950">
                    <div className="border-2 border-dashed border-amber-900/40 p-4 rounded-lg bg-amber-100/50">
                      <div className="text-sm font-black tracking-wider">PRIORITY AIR PARCEL</div>
                      <div className="text-[10px] mt-1">TRACKING: #STX-9884-KL</div>
                      <div className="mt-3 text-[11px] font-sans">
                        DELIVER TO:<br />
                        <strong>Apex Infotech Solutions</strong><br />
                        MG Road, Kochi, Kerala - 682016
                      </div>
                    </div>
                    <div className="text-right text-[10px] font-bold">
                      INSPECTED & DISPATCHED
                    </div>
                  </div>
                )}

                {activePreset === 'wood_desk' && (
                  <div className="p-6 flex-1 flex items-center justify-center">
                    <div className="w-5/6 h-5/6 bg-white rounded-lg shadow-xl p-5 flex flex-col justify-between border border-slate-200 text-slate-800">
                      <div className="font-bold text-xs border-b border-slate-200 pb-2">OFFICIAL DOCUMENT</div>
                      <div className="text-[10px] text-slate-500">Document proof placed on desk surface.</div>
                      <div className="text-right text-[10px] font-semibold">Signatory Stamp Area</div>
                    </div>
                  </div>
                )}

                {activePreset === 'plain_a4' && (
                  <div className="p-8 flex-1 flex flex-col justify-between text-slate-400 text-xs">
                    <div className="text-right text-[10px] font-mono">A4 80 GSM STANDARD</div>
                    <div className="text-center text-slate-300 text-sm font-sans font-light">
                      Clean Office Paper Sheet
                    </div>
                    <div className="text-left text-[10px] font-mono">1:1 PHYSICAL PROOF</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* C. The AR Stamp Overlay (Interactive Drag, Scale, Rotate & Blend) */}
          <div
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            style={{
              position: 'absolute',
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
              transformOrigin: 'center center',
              mixBlendMode: 'multiply', // Crucial: Natural ink bleed into paper fibers!
              opacity,
              cursor: isDraggingRef.current ? 'grabbing' : 'grab',
              touchAction: 'none',
              filter: distress ? 'drop-shadow(0px 1px 1.5px rgba(0,0,0,0.18))' : 'none',
            }}
            className="group active:scale-95 transition-transform duration-75 select-none"
            title="Touch or Drag to reposition stamp"
          >
            {/* Visual Bounding Indicator on Hover */}
            <div className="relative">
              <div
                className="pointer-events-none drop-shadow-xs"
                style={{
                  width: `${widthMm * 2.8}px`,
                  height: `${heightMm * 2.8}px`,
                }}
                dangerouslySetInnerHTML={{ __html: stampSvgString }}
              />

              {/* Hand-Placement Guide Ring */}
              <div className="absolute inset-0 border-2 border-[#0d99ff]/0 group-hover:border-[#0d99ff]/50 rounded-full transition-colors pointer-events-none -m-1" />
            </div>
          </div>

          {/* Quick Floating Hint Overlay */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-semibold shadow-md pointer-events-none flex items-center gap-1.5 border border-slate-700/60">
            <span className="w-2 h-2 rounded-full bg-[#0d99ff]" />
            <span>Drag stamp to position on document</span>
          </div>

          {/* Camera Shutter / Capture Button Floating on Stage */}
          <div className="absolute bottom-5 inset-x-0 flex items-center justify-center gap-3 z-10">
            {/* Toggle Adjustment Drawer */}
            <button
              type="button"
              onClick={() => setShowControls(!showControls)}
              className={`p-3 rounded-full backdrop-blur-md border transition-all cursor-pointer shadow-lg ${
                showControls
                  ? 'bg-[#0d99ff] border-[#0d99ff] text-white'
                  : 'bg-slate-900/80 border-slate-700/80 text-slate-200 hover:text-white'
              }`}
              title="Stamp Controls (Rotation, Scale, Ink)"
            >
              <Sliders className="w-5 h-5" />
            </button>

            {/* Main Shutter Button: Snap Photo */}
            <button
              type="button"
              onClick={handleTakeSnapshot}
              disabled={isCapturing}
              className="w-16 h-16 rounded-full bg-white hover:bg-slate-100 active:scale-90 text-slate-950 flex items-center justify-center shadow-2xl transition-all cursor-pointer ring-4 ring-white/30"
              title="Take Photo Proof"
            >
              {isCapturing ? (
                <span className="w-6 h-6 rounded-full border-3 border-slate-300 border-t-[#0d99ff] animate-spin" />
              ) : (
                <div className="w-13 h-13 rounded-full border-2 border-slate-950/20 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-slate-900" />
                </div>
              )}
            </button>

            {/* Reset Placement */}
            <button
              type="button"
              onClick={() => {
                setPos({ x: 50, y: 50 });
                setRotation(-2);
                setScale(1.0);
              }}
              className="p-3 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/80 text-slate-200 hover:text-white transition-all cursor-pointer shadow-lg"
              title="Reset Position & Rotation"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Floating Adjustments Drawer (Scale, Rotation, Ink Saturation) */}
        {showControls && (
          <div className="p-4 bg-slate-900/95 border-t border-slate-800 backdrop-blur-md z-20 space-y-3.5 animate-in slide-in-from-bottom-3 duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Slider 1: Rotation */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Natural Tilt / Rotation:</span>
                  <span className="font-mono text-[#0d99ff] font-bold">{rotation}°</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="-45"
                    max="45"
                    step="1"
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="w-full accent-[#0d99ff] cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setRotation(0)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400"
                  >
                    0°
                  </button>
                </div>
              </div>

              {/* Slider 2: Scale */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Stamp Scale:</span>
                  <span className="font-mono text-[#0d99ff] font-bold">{(scale * 100).toFixed(0)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0.5"
                    max="1.8"
                    step="0.05"
                    value={scale}
                    onChange={(e) => setScale(Number(e.target.value))}
                    className="w-full accent-[#0d99ff] cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setScale(1.0)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400"
                  >
                    1:1
                  </button>
                </div>
              </div>

              {/* Slider 3: Ink Pressure / Opacity */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Ink Pressure / Bleed:</span>
                  <span className="font-mono text-[#0d99ff] font-bold">{(opacity * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="1.0"
                  step="0.02"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-full accent-[#0d99ff] cursor-pointer"
                />
              </div>
            </div>

            {/* Bottom Row: Ink Colors & Distress Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Ink Color:</span>
                <div className="flex items-center gap-1.5">
                  {INK_COLORS.map((c) => {
                    const colorHex = c.hex || inkColor;
                    const isActive = activeInk === colorHex;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setActiveInk(colorHex)}
                        title={c.name}
                        className={`w-5 h-5 rounded-full transition-all cursor-pointer relative ${
                          isActive
                            ? 'ring-2 ring-[#0d99ff] ring-offset-2 ring-offset-slate-900 scale-110'
                            : 'opacity-70 hover:opacity-100 hover:scale-105'
                        }`}
                        style={{ backgroundColor: colorHex }}
                      >
                        {isActive && <Check className="w-3 h-3 text-white absolute inset-0 m-auto stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={distress}
                    onChange={(e) => setDistress(e.target.checked)}
                    className="rounded text-[#0d99ff] accent-[#0d99ff] cursor-pointer"
                  />
                  <span>Rubber porous texture (Realistic grain)</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Document Preset Selector Bar (Only in Preset Mode) */}
        {viewMode === 'preset' && (
          <div className="px-4 py-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0 z-20">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              Documents:
            </span>
            {DOCUMENT_PRESETS.map((p) => {
              const active = activePreset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActivePreset(p.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? 'bg-[#0d99ff] text-white shadow-xs'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/60'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: p.accent }}
                  />
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Snapshot Result Modal (Photo Proof Captured) */}
        {snapshotUrl && (
          <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-md flex flex-col p-4 sm:p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <h4 className="text-sm font-bold text-white">AR Photo Proof Captured!</h4>
              </div>
              <button
                type="button"
                onClick={() => setSnapshotUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 my-3 rounded-2xl overflow-hidden bg-black flex items-center justify-center p-2">
              <img
                src={snapshotUrl}
                alt="Real-World Stamp Proof"
                className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <div className="text-xs text-slate-400">
                1:1 Scale Proof · Ink merged with paper texture
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSnapshotUrl(null)}
                  className="px-3 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold"
                >
                  Retake Photo
                </button>

                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSnapshot}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0d99ff] hover:bg-[#0b87e0] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Image</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scan on Mobile QR Code Modal */}
        {showQrModal && (
          <div
            onClick={() => setShowQrModal(false)}
            className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Mobile AR Camera
                </span>
                <button
                  onClick={() => setShowQrModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 bg-white rounded-2xl inline-block shadow-md">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Scan for Mobile AR" className="w-48 h-48 mx-auto" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-slate-400">
                    Generating QR...
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-bold text-white">Scan with your Phone Camera</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Point your phone camera at this QR code to open the AR Camera directly on your phone and test on physical paper!
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-white text-xs font-semibold"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
