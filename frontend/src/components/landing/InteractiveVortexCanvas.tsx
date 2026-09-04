'use client';

import React, { useEffect, useRef } from 'react';

interface Particle {
  baseRadiusRatio: number;
  baseAngle: number;
  currentAngle: number;
  orbitSpeed: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  thickness: number;
  color: string;
  baseAlpha: number;
}

const PALETTE = [
  '#4285F4', // Google Blue
  '#2563EB', // Royal Blue
  '#3B82F6', // Sky Blue
  '#34A853', // Google Green
  '#10B981', // Emerald
  '#FBBC05', // Google Yellow
  '#F59E0B', // Amber
  '#EA4335', // Google Red
  '#EF4444', // Crimson
  '#8B5CF6', // Purple
  '#6366F1', // Indigo
  '#06B6D4', // Cyan
];

export const InteractiveVortexCanvas: React.FC<{ isDark?: boolean }> = ({ isDark = false }) => {
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

    // Mouse coordinates (null when cursor is not inside)
    const mouse = {
      x: -9999,
      y: -9999,
      targetX: -9999,
      targetY: -9999,
      isActive: false,
    };

    // Initialize spiral constellation particles
    const particles: Particle[] = [];
    const arms = 14;
    const pointsPerArm = 22;

    for (let arm = 0; arm < arms; arm++) {
      const armAngleOffset = (arm / arms) * Math.PI * 2;
      for (let i = 0; i < pointsPerArm; i++) {
        const t = (i + 1) / pointsPerArm;
        // Exponential radial spread for natural spiral curve
        const baseRadiusRatio = 0.16 + Math.pow(t, 1.35) * 0.42;
        const baseAngle = armAngleOffset + t * Math.PI * 1.6;
        const color = PALETTE[(arm * 3 + i) % PALETTE.length];
        const length = 4 + t * 9;
        const thickness = 2.4 + t * 1.6;
        const baseAlpha = Math.min(0.85, 0.28 + t * 0.65);
        const orbitSpeed = 0.0008 + (1 - t) * 0.0012; // Inner particles orbit slightly faster

        const cx = width / 2;
        const cy = height / 2;
        const minDim = Math.min(width, height);
        const r = baseRadiusRatio * minDim;
        const x = cx + r * Math.cos(baseAngle);
        const y = cy + (r * 0.78) * Math.sin(baseAngle);

        particles.push({
          baseRadiusRatio,
          baseAngle,
          currentAngle: baseAngle,
          orbitSpeed,
          x,
          y,
          vx: 0,
          vy: 0,
          length,
          thickness,
          color,
          baseAlpha,
        });
      }
    }

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

    // Mouse & Touch Interaction Handlers
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
      mouse.isActive = true;
    };

    const handleMouseEnter = () => {
      mouse.isActive = true;
    };

    const handleMouseLeave = () => {
      mouse.isActive = false;
      mouse.targetX = -9999;
      mouse.targetY = -9999;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = container.getBoundingClientRect();
        mouse.targetX = e.touches[0].clientX - rect.left;
        mouse.targetY = e.touches[0].clientY - rect.top;
        mouse.isActive = true;
      }
    };

    const handleTouchEnd = () => {
      mouse.isActive = false;
      mouse.targetX = -9999;
      mouse.targetY = -9999;
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);

    // Main 60-120 FPS Animation Loop
    const render = () => {
      // Smooth lerp mouse coordinates
      if (mouse.isActive) {
        mouse.x += (mouse.targetX - mouse.x) * 0.2;
        mouse.y += (mouse.targetY - mouse.y) * 0.2;
      } else {
        mouse.x = -9999;
        mouse.y = -9999;
      }

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const minDim = Math.min(width, height);
      const repelRadius = 180; // Distance of mouse influence

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // 1. Organic slow orbital rotation
        p.currentAngle += p.orbitSpeed;
        const currentR = p.baseRadiusRatio * minDim;
        const targetX = cx + currentR * Math.cos(p.currentAngle);
        const targetY = cy + (currentR * 0.78) * Math.sin(p.currentAngle);

        // 2. Cursor repulsion physics
        if (mouse.isActive) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < repelRadius && dist > 0) {
            const force = Math.pow((repelRadius - dist) / repelRadius, 1.4);
            const repelStrength = 8.5;
            p.vx += (dx / dist) * force * repelStrength;
            p.vy += (dy / dist) * force * repelStrength;
          }
        }

        // 3. Spring physics back to base spiral trajectory
        const springK = 0.055;
        p.vx += (targetX - p.x) * springK;
        p.vy += (targetY - p.y) * springK;

        // 4. Damping / Friction
        p.vx *= 0.86;
        p.vy *= 0.86;

        // 5. Update position
        p.x += p.vx;
        p.y += p.vy;

        // 6. Calculate dash tangent orientation
        // Base tangent angle along the spiral + velocity deflection
        const baseTangent = p.currentAngle + Math.PI / 2 + 0.35;
        const velAngle = Math.atan2(p.vy, p.vx);
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const dashAngle = speed > 1 ? velAngle : baseTangent;

        // 7. Draw vibrant rounded capsule dash
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(dashAngle);

        ctx.beginPath();
        const halfLen = (p.length + Math.min(speed * 1.5, 12)) / 2;
        const r = p.thickness / 2;
        ctx.arc(-halfLen + r, 0, r, Math.PI / 2, (3 * Math.PI) / 2);
        ctx.arc(halfLen - r, 0, r, (3 * Math.PI) / 2, Math.PI / 2);
        ctx.closePath();

        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.min(1, p.baseAlpha + Math.min(speed * 0.05, 0.3));
        ctx.fill();

        ctx.restore();
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
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-auto z-0 overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
      {/* Soft Radial Center Mask to preserve pristine text contrast while showing dark blue gradient */}
      <div
        className={`absolute inset-0 pointer-events-none ${
          isDark
            ? 'bg-[radial-gradient(circle_at_center,rgba(2,6,23,0.55)_15%,rgba(2,6,23,0.2)_55%,transparent_90%)]'
            : 'bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.92)_25%,rgba(255,255,255,0.55)_60%,transparent_100%)]'
        }`}
      />
    </div>
  );
};
