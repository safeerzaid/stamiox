import React, { useEffect, useRef, useState } from 'react';

export const AiOrbIcon = ({ className = "w-4 h-4" }: { className?: string }) => {
  const orbRef = useRef<HTMLDivElement>(null);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const idleIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Function to trigger natural random glances when mouse is idle
    const triggerRandomGlance = () => {
      // 35% chance to look center, 65% chance to glance in a random direction
      if (Math.random() < 0.35) {
        setEyeOffset({ x: 0, y: 0 });
      } else {
        const angles = [
          { x: 14, y: -9 },   // Up Right
          { x: -14, y: -9 },  // Up Left
          { x: 16, y: 0 },    // Right
          { x: -16, y: 0 },   // Left
          { x: 12, y: 10 },   // Down Right
          { x: -12, y: 10 },  // Down Left
          { x: 0, y: -12 },   // Up
          { x: 0, y: 10 },    // Down
        ];
        const randomGlance = angles[Math.floor(Math.random() * angles.length)];
        setEyeOffset(randomGlance);
      }
    };

    // Start idle cycle
    const startIdleCycle = () => {
      if (idleIntervalRef.current) clearInterval(idleIntervalRef.current);
      triggerRandomGlance();
      idleIntervalRef.current = setInterval(triggerRandomGlance, 2200);
    };

    // Reset idle timer when mouse moves
    const handleMouseMove = (e: MouseEvent) => {
      if (idleIntervalRef.current) {
        clearInterval(idleIntervalRef.current);
        idleIntervalRef.current = null;
      }
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }

      if (orbRef.current) {
        const rect = orbRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;
        
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 400; // sensitivity range
        const strength = Math.min(distance / maxDistance, 1);
        
        const angle = Math.atan2(dy, dx);
        const maxTravelPercent = 17;
        
        const targetX = Math.cos(angle) * maxTravelPercent * strength;
        const targetY = Math.sin(angle) * maxTravelPercent * strength;
        
        setEyeOffset({ x: targetX, y: targetY });
      }

      // After 1.4s of no mouse movement, switch to random glances
      idleTimeoutRef.current = setTimeout(startIdleCycle, 1400);
    };

    // Start idle loop initially
    idleTimeoutRef.current = setTimeout(startIdleCycle, 1000);

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      if (idleIntervalRef.current) clearInterval(idleIntervalRef.current);
    };
  }, []);

  return (
    <>
      <style>{`
        @keyframes ai-jelly-morph {
          0% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
          34% { border-radius: 70% 30% 50% 50% / 30% 30% 70% 70%; }
          67% { border-radius: 100% 60% 60% 100% / 100% 100% 60% 60%; }
          100% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
        }
        @keyframes ai-blink {
          0%, 94%, 98%, 100% { transform: scaleY(1); }
          96% { transform: scaleY(0.1); }
        }
        @keyframes ai-breathe {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.03) rotate(2deg); }
        }
        .ai-orb-jelly {
          animation: ai-jelly-morph 3.5s ease-in-out infinite, ai-breathe 3.5s ease-in-out infinite;
          border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
        }
        .ai-eye-blink {
          animation: ai-blink 2.8s infinite;
          transform-origin: center;
        }
      `}</style>
      <div
        ref={orbRef}
        className={`relative overflow-hidden shrink-0 ai-orb-jelly ${className}`}
        style={{
          background: `
            radial-gradient(circle at 25% 25%, #38bdf8 0%, transparent 55%),
            radial-gradient(circle at 75% 20%, #3b82f6 0%, #2563eb 30%, transparent 65%),
            radial-gradient(circle at 20% 80%, #6366f1 0%, #4338ca 40%, transparent 70%),
            radial-gradient(circle at 80% 80%, #818cf8 0%, #6366f1 40%, transparent 70%),
            radial-gradient(circle at 50% 50%, #0284c7 0%, #0369a1 40%, transparent 60%)
          `,
          backgroundColor: '#334155',
          boxShadow: 'inset 0px 3px 5px rgba(255, 255, 255, 0.25), inset 0px -3px 5px rgba(15, 23, 42, 0.4), inset 3px 0px 5px rgba(255, 255, 255, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        {/* Soft Glass Reflection Highlight */}
        <div className="absolute top-[6%] left-[18%] right-[18%] h-[25%] rounded-full bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
        
        {/* Soft overlay to blend */}
        <div className="absolute inset-0 bg-white/5 mix-blend-overlay backdrop-blur-[1px]" />
        
        {/* Eyes with smooth cursor follow & idle random glances */}
        <div
          className="absolute inset-0 flex items-center justify-center gap-[12%] z-10 pointer-events-none"
          style={{
            transform: `translate3d(${eyeOffset.x}%, ${eyeOffset.y}%, 0)`,
            transition: 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        >
          <div className="w-[12%] h-[20%] bg-white rounded-full shadow-[0_0_4px_rgba(255,255,255,0.95)] ai-eye-blink" />
          <div className="w-[12%] h-[20%] bg-white rounded-full shadow-[0_0_4px_rgba(255,255,255,0.95)] ai-eye-blink" />
        </div>
      </div>
    </>
  );
};
