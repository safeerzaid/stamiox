'use client';

import React, { useEffect, useRef } from 'react';

interface StampImprint {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  type: 'round-seal' | 'notary-oval' | 'approved-rect';
  opacity: number;
  distressSeed: number;
}

interface InkSplatterParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
  life: number;
  maxLife: number;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  opacity: number;
}

const INK_COLORS = [
  '#1e3a8a', // Deep Royal Blue Ink
  '#b91c1c', // Crimson Red Ink
  '#047857', // Forest Emerald Ink
  '#312e81', // Midnight Indigo Ink
  '#18181b', // Pure Carbon Black Ink
];

export const InteractiveStampCursor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = container.clientWidth);
    let height = (canvas.height = container.clientHeight);

    // Dynamic cursor physics state
    const cursor = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      vx: 0,
      vy: 0,
      tiltX: 0,
      tiltY: 0,
      scale: 1,
      targetScale: 1,
      isHovering: false,
      isPressed: false,
      pressDepth: 0, // 0 = resting, 1 = fully pressed on paper
    };

    const imprints: StampImprint[] = [];
    const splatters: InkSplatterParticle[] = [];
    const shockwaves: Shockwave[] = [];

    // Pre-populate with 2 subtle authentic stamp seals in background
    imprints.push(
      {
        id: 1,
        x: width * 0.14,
        y: height * 0.32,
        rotation: -0.12,
        scale: 0.95,
        color: '#1e3a8a',
        type: 'round-seal',
        opacity: 0.4,
        distressSeed: 42,
      },
      {
        id: 2,
        x: width * 0.86,
        y: height * 0.45,
        rotation: 0.16,
        scale: 0.95,
        color: '#b91c1c',
        type: 'approved-rect',
        opacity: 0.38,
        distressSeed: 88,
      }
    );

    // Resize listener with DPR support
    const handleResize = () => {
      if (!canvas || !container) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Mouse Movement Tracking
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = e.clientX - rect.left;
      const ny = e.clientY - rect.top;

      cursor.targetX = nx;
      cursor.targetY = ny;
      cursor.isHovering = true;
    };

    const handleMouseEnter = () => {
      cursor.isHovering = true;
    };

    const handleMouseLeave = () => {
      cursor.isHovering = false;
      cursor.targetX = width / 2;
      cursor.targetY = height / 2;
    };

    // Stamp Press Click Event
    const handleMouseDown = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      cursor.targetScale = 0.86;
      cursor.isPressed = true;
      cursor.pressDepth = 1;

      const selectedColor = INK_COLORS[Math.floor(Math.random() * INK_COLORS.length)];
      const stampTypes: ('round-seal' | 'notary-oval' | 'approved-rect')[] = ['round-seal', 'notary-oval', 'approved-rect'];
      const selectedType = stampTypes[Math.floor(Math.random() * stampTypes.length)];

      // Shockwave Ring
      shockwaves.push({
        x: sx,
        y: sy,
        radius: 12,
        maxRadius: 70,
        color: selectedColor,
        opacity: 0.65,
      });

      // Ink Splatters
      for (let s = 0; s < 10; s++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.2 + Math.random() * 4.8;
        splatters.push({
          x: sx,
          y: sy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 1.2 + Math.random() * 2.2,
          color: selectedColor,
          opacity: 0.9,
          life: 0,
          maxLife: 22 + Math.random() * 18,
        });
      }

      // Add Authentic Stamped Impression
      const rot = (Math.random() - 0.5) * 0.28;
      imprints.push({
        id: Date.now() + Math.random(),
        x: sx,
        y: sy,
        rotation: rot,
        scale: 1,
        color: selectedColor,
        type: selectedType,
        opacity: 0.92,
        distressSeed: Math.floor(Math.random() * 1000),
      });

      if (imprints.length > 25) {
        imprints.shift();
      }
    };

    const handleMouseUp = () => {
      cursor.targetScale = 1;
      cursor.isPressed = false;
    };

    // Touch Support
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = container.getBoundingClientRect();
        cursor.targetX = e.touches[0].clientX - rect.left;
        cursor.targetY = e.touches[0].clientY - rect.top;
        cursor.isHovering = true;
      }
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('touchmove', handleTouchMove, { passive: true });

    // --- DRAW AUTHENTIC VECTOR RUBBER STAMP SEALS ---
    const drawStampSealImpression = (
      c: CanvasRenderingContext2D,
      type: 'round-seal' | 'notary-oval' | 'approved-rect',
      radius: number,
      color: string,
      isGhost: boolean = false
    ) => {
      c.strokeStyle = color;
      c.fillStyle = color;

      if (type === 'round-seal') {
        // Double concentric outer rings
        c.lineWidth = isGhost ? 1.4 : 2.6;
        c.setLineDash(isGhost ? [4, 3] : []);
        c.beginPath();
        c.arc(0, 0, radius, 0, Math.PI * 2);
        c.stroke();

        c.lineWidth = isGhost ? 1 : 1.4;
        c.beginPath();
        c.arc(0, 0, radius * 0.74, 0, Math.PI * 2);
        c.stroke();

        c.lineWidth = 0.8;
        c.setLineDash([]);
        c.beginPath();
        c.arc(0, 0, radius * 0.65, 0, Math.PI * 2);
        c.stroke();

        // Center typography
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.font = `bold ${Math.round(radius * 0.2)}px "Product Sans", Arial, sans-serif`;
        c.fillText('STAMIOX', 0, -radius * 0.12);

        c.font = `600 ${Math.round(radius * 0.12)}px "Product Sans", Arial, sans-serif`;
        c.fillText('OFFICIAL SEAL', 0, radius * 0.14);

        c.font = `bold ${Math.round(radius * 0.16)}px Arial`;
        c.fillText('★ ★ ★', 0, radius * 0.36);
        c.fillText('★', 0, -radius * 0.36);

        if (!isGhost) {
          const drawArc = (txt: string, r: number, startA: number, endA: number, rev: boolean) => {
            const chars = txt.split('');
            const step = (endA - startA) / (chars.length - 1 || 1);
            for (let i = 0; i < chars.length; i++) {
              c.save();
              c.rotate(startA + i * step);
              c.translate(0, rev ? r : -r);
              if (rev) c.rotate(Math.PI);
              c.font = `bold ${Math.round(radius * 0.11)}px "Product Sans", sans-serif`;
              c.fillText(chars[i], 0, 0);
              c.restore();
            }
          };
          drawArc('★ STAMIOX VECTOR STUDIO ★', radius * 0.86, -Math.PI * 0.72, Math.PI * 0.72, false);
          drawArc('AUTHENTIC CERTIFIED STAMP', radius * 0.86, -Math.PI * 0.65, Math.PI * 0.65, true);
        }
      } else if (type === 'notary-oval') {
        const rx = radius * 1.28;
        const ry = radius * 0.84;
        c.lineWidth = isGhost ? 1.4 : 2.6;
        c.setLineDash(isGhost ? [4, 3] : []);
        c.beginPath();
        c.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        c.stroke();

        c.lineWidth = 1.2;
        c.beginPath();
        c.ellipse(0, 0, rx * 0.76, ry * 0.76, 0, 0, Math.PI * 2);
        c.stroke();

        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.font = `bold ${Math.round(radius * 0.18)}px "Product Sans", sans-serif`;
        c.fillText('NOTARY PUBLIC', 0, -radius * 0.15);
        c.font = `600 ${Math.round(radius * 0.12)}px "Product Sans", sans-serif`;
        c.fillText('COMMISSION EXPIRES', 0, radius * 0.1);
        c.font = `bold ${Math.round(radius * 0.14)}px monospace`;
        c.fillText('STATE OF CALIFORNIA', 0, radius * 0.34);
      } else if (type === 'approved-rect') {
        const rw = radius * 2.4;
        const rh = radius * 1.22;
        c.lineWidth = isGhost ? 1.4 : 3;
        c.setLineDash(isGhost ? [4, 3] : []);

        c.beginPath();
        c.roundRect(-rw / 2, -rh / 2, rw, rh, 8);
        c.stroke();

        c.lineWidth = 1.2;
        c.beginPath();
        c.roundRect(-rw / 2 + 5, -rh / 2 + 5, rw - 10, rh - 10, 5);
        c.stroke();

        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.font = `900 ${Math.round(radius * 0.34)}px "Product Sans", sans-serif`;
        c.fillText('APPROVED', 0, -radius * 0.08);

        c.font = `bold ${Math.round(radius * 0.14)}px "JetBrains Mono", monospace`;
        c.fillText('DATE: 2026-08-31', 0, radius * 0.28);
        c.fillText('STAMIOX VERIFIED', 0, -radius * 0.38);
      }
    };

    // --- DRAW AUTHENTIC PHOTOREALISTIC WOODEN & BRASS RUBBER STAMP MOUNT ---
    const drawAuthenticWoodenStamp = (
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      tiltX: number,
      tiltY: number,
      pressDepth: number
    ) => {
      const baseR = 46;
      const compression = pressDepth * 12; // Physically pushes down on click

      c.save();
      c.translate(x, y);
      c.scale(cursor.scale, cursor.scale);

      // --- 1. Multi-Layered Soft Ambient Occlusion Paper Shadow ---
      c.save();
      const shadowSpread = 28 - compression * 1.4;
      const shadowAlpha = 0.32 - compression * 0.08;
      const shadowGrad = c.createRadialGradient(0, 14, baseR * 0.3, 0, 14, baseR * 1.6);
      shadowGrad.addColorStop(0, `rgba(15, 23, 42, ${shadowAlpha})`);
      shadowGrad.addColorStop(0.6, `rgba(15, 23, 42, ${shadowAlpha * 0.4})`);
      shadowGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
      c.fillStyle = shadowGrad;
      c.beginPath();
      c.ellipse(0, 14, baseR * 1.35, baseR * 0.85, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();

      // Apply dynamic 3D tilt & compression elevation
      c.save();
      c.translate(0, -compression);
      c.rotate(tiltX * 0.4);

      // --- 2. Red Rubber Die Cushion Layer (The authentic rubber stamp bottom) ---
      c.save();
      const rubberGrad = c.createLinearGradient(-baseR, 0, baseR, 0);
      rubberGrad.addColorStop(0, '#7f1d1d');
      rubberGrad.addColorStop(0.3, '#b91c1c');
      rubberGrad.addColorStop(0.7, '#dc2626');
      rubberGrad.addColorStop(1, '#991b1b');
      c.fillStyle = rubberGrad;
      c.beginPath();
      c.ellipse(0, 2, baseR * 0.98, baseR * 0.62, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();

      // --- 3. Solid Polished Mahogany Wooden Circular Base Disk ---
      c.save();
      // Wooden base rim thickness
      const woodBaseSideGrad = c.createLinearGradient(-baseR, -10, baseR, 0);
      woodBaseSideGrad.addColorStop(0, '#3e1c0c');
      woodBaseSideGrad.addColorStop(0.4, '#6a3219');
      woodBaseSideGrad.addColorStop(0.7, '#8B4513');
      woodBaseSideGrad.addColorStop(1, '#3b180a');
      c.fillStyle = woodBaseSideGrad;
      c.beginPath();
      c.ellipse(0, -4, baseR, baseR * 0.64, 0, 0, Math.PI * 2);
      c.fill();

      // Wooden base top beveled surface
      const woodTopGrad = c.createRadialGradient(-10, -14, 5, 0, -8, baseR);
      woodTopGrad.addColorStop(0, '#ba6838');
      woodTopGrad.addColorStop(0.4, '#8B4513');
      woodTopGrad.addColorStop(0.8, '#5c2c16');
      woodTopGrad.addColorStop(1, '#33170b');
      c.fillStyle = woodTopGrad;
      c.beginPath();
      c.ellipse(0, -8, baseR * 0.94, baseR * 0.58, 0, 0, Math.PI * 2);
      c.fill();

      // Base specular sheen ring
      c.strokeStyle = 'rgba(255, 220, 180, 0.4)';
      c.lineWidth = 1.5;
      c.beginPath();
      c.ellipse(0, -9, baseR * 0.88, baseR * 0.53, 0, 0, Math.PI * 2);
      c.stroke();
      c.restore();

      // --- 4. Gleaming Polished Gold / Brass Metal Collar (Neck Ferrule) ---
      c.save();
      const brassGrad = c.createLinearGradient(-16, -24, 16, -12);
      brassGrad.addColorStop(0, '#946c19');
      brassGrad.addColorStop(0.25, '#d4af37');
      brassGrad.addColorStop(0.5, '#fff0a6'); // Mirror metallic shine
      brassGrad.addColorStop(0.75, '#e0b84c');
      brassGrad.addColorStop(1, '#855d14');
      c.fillStyle = brassGrad;
      c.beginPath();
      c.roundRect(-14, -22, 28, 12, 3);
      c.fill();

      // Brass ring highlights
      c.strokeStyle = '#ffe57f';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(-13, -16);
      c.lineTo(13, -16);
      c.stroke();
      c.restore();

      // --- 5. Turned Ergonomic Wooden Handle Stem ---
      c.save();
      const stemGrad = c.createLinearGradient(-12, -60, 12, -22);
      stemGrad.addColorStop(0, '#5a2713');
      stemGrad.addColorStop(0.3, '#994d22');
      stemGrad.addColorStop(0.55, '#ba6838'); // Light wood grain highlight
      stemGrad.addColorStop(0.8, '#743417');
      stemGrad.addColorStop(1, '#441a0b');
      c.fillStyle = stemGrad;

      // Sculpted vase/lathe handle silhouette
      c.beginPath();
      c.moveTo(-10, -22);
      c.bezierCurveTo(-14, -34, -7, -48, -12, -62);
      c.lineTo(12, -62);
      c.bezierCurveTo(7, -48, 14, -34, 10, -22);
      c.closePath();
      c.fill();
      c.restore();

      // --- 6. Polished Round Wooden Top Knob Handle ---
      c.save();
      const knobGrad = c.createRadialGradient(-6, -74, 4, 0, -68, 22);
      knobGrad.addColorStop(0, '#f1aa76'); // High gloss specular wood highlight
      knobGrad.addColorStop(0.35, '#a75225');
      knobGrad.addColorStop(0.7, '#6b2f15');
      knobGrad.addColorStop(1, '#381609');
      c.fillStyle = knobGrad;
      c.beginPath();
      c.arc(0, -68, 18, 0, Math.PI * 2);
      c.fill();

      // Top Glass/Lacquer Gloss Specular Reflex
      c.fillStyle = 'rgba(255, 255, 255, 0.65)';
      c.beginPath();
      c.ellipse(-5, -74, 6, 3, -Math.PI / 6, 0, Math.PI * 2);
      c.fill();
      c.restore();

      // --- 7. Laser-Engraved "STAMIOX" Golden Nameplate on Handle ---
      c.save();
      c.fillStyle = 'rgba(212, 175, 55, 0.95)';
      c.font = 'bold 7px "Product Sans", Arial, sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('STAMIOX', 0, -36);
      c.restore();

      c.restore();
      c.restore();
    };

    // --- MAIN ANIMATION RENDER LOOP ---
    const render = () => {
      // Smooth Physics Spring Interpolation
      const spring = 0.16;
      cursor.vx = (cursor.targetX - cursor.x) * spring;
      cursor.vy = (cursor.targetY - cursor.y) * spring;
      cursor.x += cursor.vx;
      cursor.y += cursor.vy;

      cursor.tiltX += ((cursor.vx * 0.0035) - cursor.tiltX) * 0.12;
      cursor.tiltY += ((cursor.vy * 0.0035) - cursor.tiltY) * 0.12;
      cursor.scale += (cursor.targetScale - cursor.scale) * 0.2;
      cursor.pressDepth *= 0.86;

      ctx.clearRect(0, 0, width, height);

      // --- 1. Subtle Drafting Blueprint Grid ---
      ctx.save();
      ctx.fillStyle = '#64748b';
      ctx.globalAlpha = 0.09;
      const gSize = 40;
      for (let gx = 0; gx < width; gx += gSize) {
        for (let gy = 0; gy < height; gy += gSize) {
          ctx.beginPath();
          ctx.arc(gx, gy, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // --- 2. Render Stamped Impressions on Paper ---
      for (let i = 0; i < imprints.length; i++) {
        const imp = imprints[i];
        ctx.save();
        ctx.translate(imp.x, imp.y);
        ctx.rotate(imp.rotation);
        ctx.globalAlpha = imp.opacity;
        ctx.scale(imp.scale, imp.scale);

        drawStampSealImpression(ctx, imp.type, 44, imp.color, false);
        ctx.restore();
      }

      // --- 3. Render Shockwaves & Ink Splatters ---
      for (let s = shockwaves.length - 1; s >= 0; s--) {
        const sw = shockwaves[s];
        sw.radius += 2.2;
        sw.opacity *= 0.92;

        if (sw.opacity < 0.01 || sw.radius > sw.maxRadius) {
          shockwaves.splice(s, 1);
          continue;
        }

        ctx.save();
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = 1.8;
        ctx.globalAlpha = sw.opacity;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      for (let sp = splatters.length - 1; sp >= 0; sp--) {
        const p = splatters[sp];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.9;
        p.vy *= 0.9;
        p.life++;

        if (p.life > p.maxLife) {
          splatters.splice(sp, 1);
          continue;
        }

        const alpha = p.opacity * (1 - p.life / p.maxLife);
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // --- 4. Semi-transparent Holographic Preview Stamp on Paper & Real Wooden Stamp Mount Follower ---
      if (cursor.isHovering) {
        // Holographic stamp position preview on paper
        ctx.save();
        ctx.translate(cursor.x, cursor.y);
        ctx.scale(cursor.scale, cursor.scale);
        ctx.globalAlpha = cursor.isPressed ? 0.9 : 0.35;
        drawStampSealImpression(ctx, 'round-seal', 44, '#1e3a8a', true);
        ctx.restore();

        // Realistic Wooden & Brass Rubber Stamp Following Cursor
        drawAuthenticWoodenStamp(ctx, cursor.x, cursor.y, cursor.tiltX, cursor.tiltY, cursor.pressDepth);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-auto z-0 overflow-hidden select-none cursor-crosshair"
      title="Click anywhere to stamp on canvas!"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Soft Radial Center Mask to preserve pristine text contrast */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.88)_25%,rgba(255,255,255,0.45)_65%,transparent_100%)] pointer-events-none" />
    </div>
  );
};
