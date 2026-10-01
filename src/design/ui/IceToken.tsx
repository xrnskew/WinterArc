import { useId } from 'react';
import { cx } from '../../lib/cx';

interface IceTokenProps {
  /** Крупная надпись в центре: "30", "10 ч". */
  badge: string;
  /** 1–4: чем выше, тем больше граней у льда. */
  tier: 1 | 2 | 3 | 4;
  earned: boolean;
  size?: number;
  className?: string;
}

// Шестигранник «остриём вверх» в поле 100 × 100.
const OUTER = [
  [50, 4],
  [90, 27],
  [90, 73],
  [50, 96],
  [10, 73],
  [10, 27],
];
const INNER = OUTER.map(([x, y]) => [50 + (x - 50) * 0.72, 50 + (y - 50) * 0.72]);
const points = (list: number[][]) => list.map(([x, y]) => `${x},${y}`).join(' ');

/**
 * Ледяной жетон — значок достижения. Полученный: светлый лёд с гранями,
 * белая надпись, у высших уровней — свечение. Не полученный: только тёмный контур.
 * Что за жетон, говорит подпись рядом, поэтому для скринридера рисунок скрыт.
 */
export function IceToken({ badge, tier, earned, size = 64, className }: IceTokenProps) {
  const gradient = useId();
  const fontSize = badge.length <= 2 ? 30 : badge.length <= 3 ? 25 : 20;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden="true"
      className={cx(
        'shrink-0',
        earned && tier === 4 && 'drop-shadow-[0_0_10px_rgba(255,255,255,0.35)]',
        className,
      )}
    >
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="white" stopOpacity="0.32" />
          <stop offset="1" stopColor="white" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <polygon
        points={points(OUTER)}
        fill={earned ? `url(#${gradient})` : 'none'}
        stroke={earned ? 'var(--wa-color-number)' : 'var(--wa-color-gray-700)'}
        strokeWidth={earned ? 2.5 : 2}
        strokeLinejoin="round"
      />
      {earned && tier >= 2 && (
        <polygon
          points={points(INNER)}
          fill="none"
          stroke="var(--wa-color-number)"
          strokeOpacity={0.35}
          strokeWidth={1.2}
        />
      )}
      {/* Грани льда: у 3-го уровня — три, у 4-го — шесть. */}
      {earned &&
        tier >= 3 &&
        OUTER.map(
          ([x, y], i) =>
            (tier === 4 || i % 2 === 0) && (
              <line
                key={i}
                x1={x}
                y1={y}
                x2={INNER[i][0]}
                y2={INNER[i][1]}
                stroke="var(--wa-color-number)"
                strokeOpacity={0.45}
                strokeWidth={1.2}
              />
            ),
        )}
      <text
        x="50"
        y="51"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="var(--wa-font-mono)"
        fontSize={fontSize}
        fontWeight={500}
        fill={earned ? 'var(--wa-color-number)' : 'var(--wa-color-text-muted)'}
      >
        {badge}
      </text>
    </svg>
  );
}
