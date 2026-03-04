'use client';

const LETTERS = ['s', 'q', 'u', 'a', 'r', 'a', 'g', 'e'];
const TILE_W = 70;
const TILE_H = 71;
const GAP = 5;
const STEP = TILE_W + GAP;
const STAGE_W = LETTERS.length * TILE_W + (LETTERS.length - 1) * GAP;
const STAGE_H = TILE_H;
const FONT_SIZE = 78;
const TEXT_Y = 40.5;

interface StaticLogoProps {
  className?: string;
}

export default function StaticLogo({ className = '' }: StaticLogoProps) {
  return (
    <div
      className={`flex items-end gap-2 ${className}`}
      role="img"
      aria-label="Squarage Admin"
    >
      <svg
        viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
        className="h-full w-auto"
        style={{ aspectRatio: `${STAGE_W} / ${STAGE_H}` }}
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
      </svg>
      <span
        className="text-white font-black leading-none"
        style={{ fontSize: '140%', marginBottom: '-0.18em', fontFamily: 'var(--font-neue-haas)' }}
      >
        Admin
      </span>
    </div>
  );
}
