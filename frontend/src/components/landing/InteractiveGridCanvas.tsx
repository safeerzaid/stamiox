'use client';

import React, { useEffect, useRef } from 'react';

interface GridPoint {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
}

export const InteractiveGridCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let dpr = 1;
    let width = 0;
    let height = 0;

    const mouse = {
      x: -9999,
      y: -9999,
      targetX: -9999,
      targetY: -9999,
      isActive: false,
      radius: 200,
    };

    let points: GridPoint[][] = [];
    let cols = 0;
    let rows = 0;

    const initGrid = () => {
      const spacing = 36 * dpr;
      cols = Math.ceil(width / spacing) + 2;
      rows = Math.ceil(height / spacing) + 2;
      points = [];

      for (let r = 0; r < rows; r++) {
        points[r] = [];
        for (let c = 0; c < cols; c++) {
          const originX = (c - 0.5) * spacing;
          const originY = (r - 0.5) * spacing;
          points[r][c] = {
            x: originX,
            y: originY,
            originX,
            originY,
            vx: 0,
            vy: 0,
          };
        }
      }
    };

    const handleResize = () => {
      if (!canvas || !container) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = container.clientWidth * dpr;
      height = container.clientHeight * dpr;
      canvas.width = width;
      canvas.height = height;
      mouse.radius = 190 * dpr;
      initGrid();
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Listen on parent card so hovering over text or any child triggers grid physics seamlessly
    const targetEl = container.parentElement || container;

    // Precise proportional coordinate calculation (100% immune to DPR, CSS transforms, or window zoom)
    const updateMousePos = (clientX: number, clientY: number) => {
      const c = canvasRef.current;
      if (!c) return;
      const rect = c.getBoundingClientRect();
      const inside =
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom;

      if (inside && rect.width > 0 && rect.height > 0) {
        mouse.targetX = ((clientX - rect.left) / rect.width) * c.width;
        mouse.targetY = ((clientY - rect.top) / rect.height) * c.height;
        mouse.isActive = true;
      } else {
        mouse.isActive = false;
        mouse.targetX = -9999;
        mouse.targetY = -9999;
      }
    };

    // Mouse & Touch Listeners
    const handleMouseMove = (e: MouseEvent) => {
      updateMousePos(e.clientX, e.clientY);
    };

    const handleMouseEnter = (e: MouseEvent) => {
      updateMousePos(e.clientX, e.clientY);
    };

    const handleMouseLeave = () => {
      mouse.isActive = false;
      mouse.targetX = -9999;
      mouse.targetY = -9999;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updateMousePos(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchEnd = () => {
      mouse.isActive = false;
      mouse.targetX = -9999;
      mouse.targetY = -9999;
    };

    targetEl.addEventListener('mousemove', handleMouseMove);
    targetEl.addEventListener('mouseenter', handleMouseEnter);
    targetEl.addEventListener('mouseleave', handleMouseLeave);
    targetEl.addEventListener('touchmove', handleTouchMove, { passive: true });
    targetEl.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('mousemove', handleMouseMove);

    // Animation Loop
    const render = () => {
      // Immediate responsive mouse follow
      if (mouse.isActive) {
        mouse.x += (mouse.targetX - mouse.x) * 0.75;
        mouse.y += (mouse.targetY - mouse.y) * 0.75;
      } else {
        mouse.x = -9999;
        mouse.y = -9999;
      }

      ctx.clearRect(0, 0, width, height);

      // Update grid physics with spring + mouse repulsion
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const pt = points[r][c];

          // 1. Mouse repulsion / interactive warp
          if (mouse.isActive) {
            const dx = pt.x - mouse.x;
            const dy = pt.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < mouse.radius && dist > 0) {
              const force = (1 - dist / mouse.radius) * (20 * dpr);
              pt.vx += (dx / dist) * force * 0.25;
              pt.vy += (dy / dist) * force * 0.25;
            }
          }

          // 2. Spring force back to origin
          const springK = 0.08;
          const damp = 0.82;
          pt.vx += (pt.originX - pt.x) * springK;
          pt.vy += (pt.originY - pt.y) * springK;
          pt.vx *= damp;
          pt.vy *= damp;

          pt.x += pt.vx;
          pt.y += pt.vy;
        }
      }

      // Draw horizontal & vertical grid lines
      ctx.lineWidth = Math.max(1, dpr * 0.85);

      // Draw horizontal lines
      for (let r = 0; r < rows; r++) {
        ctx.beginPath();
        for (let c = 0; c < cols; c++) {
          const pt = points[r][c];
          if (c === 0) {
            ctx.moveTo(pt.x, pt.y);
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.045)';
        ctx.stroke();
      }

      // Draw vertical lines
      for (let c = 0; c < cols; c++) {
        ctx.beginPath();
        for (let r = 0; r < rows; r++) {
          const pt = points[r][c];
          if (r === 0) {
            ctx.moveTo(pt.x, pt.y);
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.045)';
        ctx.stroke();
      }

      // Draw glowing intersection points near cursor
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const pt = points[r][c];
          let alpha = 0.12;
          let size = 1.2 * dpr;

          if (mouse.isActive) {
            const dx = pt.x - mouse.x;
            const dy = pt.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < mouse.radius) {
              const intensity = 1 - dist / mouse.radius;
              alpha = 0.15 + intensity * 0.75;
              size = (1.2 + intensity * 2.5) * dpr;

              // Draw subtle glowing line segments near cursor
              ctx.beginPath();
              ctx.arc(pt.x, pt.y, size, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(96, 165, 250, ${alpha})`;
              ctx.fill();
              continue;
            }
          }

          ctx.beginPath();
          ctx.arc(pt.x, pt.y, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.fill();
        }
      }

      // Draw dynamic mouse glow flashlight on top of grid
      if (mouse.isActive) {
        const glow = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          mouse.radius * 1.1
        );
        glow.addColorStop(0, 'rgba(59, 130, 246, 0.22)');
        glow.addColorStop(0.5, 'rgba(37, 99, 235, 0.09)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      targetEl.removeEventListener('mousemove', handleMouseMove);
      targetEl.removeEventListener('mouseenter', handleMouseEnter);
      targetEl.removeEventListener('mouseleave', handleMouseLeave);
      targetEl.removeEventListener('touchmove', handleTouchMove);
      targetEl.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-auto z-0 overflow-hidden"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
