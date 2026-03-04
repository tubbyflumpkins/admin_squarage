'use client';

import { useEffect, useState } from 'react';

const LETTERS = ['s', 'q', 'u', 'a', 'r', 'a', 'g', 'e'];
const TILE_W = 70;
const TILE_H = 71;
const GAP = 5;
const STEP = TILE_W + GAP;
const FONT_SIZE = 78;
const TEXT_Y = 40.5;

// "Admin" text positioned after the last tile with a gap
const ADMIN_X = LETTERS.length * STEP + GAP * 2;
const ADMIN_FONT_SIZE = 66;
const ADMIN_Y = TILE_H * 0.82;
// Total width includes the "Admin" text
const TOTAL_W = ADMIN_X + 210;

interface StaticLogoProps {
  className?: string;
}

export default function StaticLogo({ className = '' }: StaticLogoProps) {
  const [fontReady, setFontReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function waitForFont() {
      try {
        await document.fonts.ready;
        let attempts = 0;
        while (!document.fonts.check('78px "Soap Regular"') && attempts < 50) {
          await new Promise(r => setTimeout(r, 50));
          attempts++;
          if (cancelled) return;
        }
      } catch { /* proceed */ }
      if (!cancelled) setFontReady(true);
    }

    waitForFont();
    return () => { cancelled = true; };
  }, []);

  return (
    <div
      className={className}
      role="img"
      aria-label="Squarage Admin"
    >
      <svg
        viewBox={`0 0 ${TOTAL_W} ${TILE_H}`}
        className="h-full w-auto"
        style={{
          visibility: fontReady ? 'visible' : 'hidden',
        }}
      >
        {LETTERS.map((letter, i) => (
          <g key={i}>
            <defs>
              <mask id={`static-logo-mask-${i}`}>
                <rect x={i * STEP} width={TILE_W} height={TILE_H} fill="white" />
                <text
                  x={i * STEP + TILE_W / 2}
                  y={TEXT_Y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontFamily="'Soap Regular', serif"
                  fontSize={FONT_SIZE}
                  fill="black"
                >
                  {letter}
                </text>
              </mask>
            </defs>
            <rect
              x={i * STEP}
              width={TILE_W}
              height={TILE_H}
              fill="#FFFFFF"
              mask={`url(#static-logo-mask-${i})`}
            />
          </g>
        ))}
        <text
          x={ADMIN_X}
          y={ADMIN_Y}
          fontFamily="var(--font-neue-haas), sans-serif"
          fontSize={ADMIN_FONT_SIZE}
          fontWeight={900}
          fill="#FFFFFF"
        >
          Admin
        </text>
      </svg>
    </div>
  );
}
