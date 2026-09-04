'use client';

import React from 'react';

interface LiquidAiLoaderProps {
  size?: number; // scale e.g. 0.45, 0.6, 0.8
  colorOne?: string;
  colorTwo?: string;
}

export const LiquidAiLoader: React.FC<LiquidAiLoaderProps> = ({
  size = 0.5,
  colorOne = '#38bdf8',
  colorTwo = '#6366f1',
}) => {
  return (
    <div
      className="liquid-ai-loader-container select-none pointer-events-none"
      style={{
        width: `${100 * size}px`,
        height: `${100 * size}px`,
        ['--size' as any]: size,
        ['--color-one' as any]: colorOne,
        ['--color-two' as any]: colorTwo,
      }}
    >
      <div className="liquid-ai-loader">
        <svg width={100} height={100} viewBox="0 0 100 100">
          <defs>
            <mask id="liquid-clipping">
              <polygon points="0,0 100,0 100,100 0,100" fill="black" />
              <polygon points="25,25 75,25 50,75" fill="white" />
              <polygon points="50,25 75,75 25,75" fill="white" />
              <polygon points="35,35 65,35 50,65" fill="white" />
              <polygon points="35,35 65,35 50,65" fill="white" />
              <polygon points="35,35 65,35 50,65" fill="white" />
              <polygon points="35,35 65,35 50,65" fill="white" />
            </mask>
          </defs>
        </svg>
        <div className="liquid-box" />
      </div>
    </div>
  );
};
