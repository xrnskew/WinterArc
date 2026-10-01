import { useMemo, type CSSProperties } from 'react';
import { between, createRandom } from '../lib/random';

interface CssSnowProps {
  count: number;
  /** Не анимировать: снежинки просто висят на своих местах. */
  still: boolean;
  snowflake: string;
}

interface Flake {
  left: number; // % ширины
  top: number; // % высоты — для застывшего варианта
  size: number; // px
  opacity: number;
  duration: number; // с, одно падение сверху вниз
  delay: number; // с, отрицательная — чтобы снег не начинался с пустого экрана
  drift: number; // vw, снос вбок за одно падение
  sway: number; // px, размах покачивания
  swayDuration: number; // с, полпериода покачивания
}

/** Три слоя глубины, как у шейдера: доля снежинок, размер, яркость, время падения. */
const DEPTHS = [
  { share: 0.55, size: [1.2, 2.2], opacity: [0.2, 0.4], duration: [28, 40], sway: [3, 6] },
  { share: 0.3, size: [2.2, 3.4], opacity: [0.35, 0.6], duration: [18, 26], sway: [6, 12] },
  { share: 0.15, size: [3.4, 5], opacity: [0.6, 0.85], duration: [12, 17], sway: [10, 18] },
];

function makeFlakes(count: number): Flake[] {
  const random = createRandom(2026);
  return Array.from({ length: count }, () => {
    // Слой выбираем по доле: дальних больше всего.
    const roll = random();
    const depth = roll < DEPTHS[0].share ? DEPTHS[0] : roll < 0.85 ? DEPTHS[1] : DEPTHS[2];
    const duration = between(random, depth.duration[0], depth.duration[1]);
    return {
      left: between(random, -10, 100),
      top: between(random, 0, 100),
      size: between(random, depth.size[0], depth.size[1]),
      opacity: between(random, depth.opacity[0], depth.opacity[1]),
      duration,
      delay: -between(random, 0, duration),
      drift: between(random, 3, 9),
      sway: between(random, depth.sway[0], depth.sway[1]),
      swayDuration: between(random, 1.6, 3.6),
    };
  });
}

/**
 * Запасной снег для слабых устройств: редкие снежинки,
 * анимируется только transform — это дёшево для видеокарты.
 */
export function CssSnow({ count, still, snowflake }: CssSnowProps) {
  const flakes = useMemo(() => makeFlakes(count), [count]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      {flakes.map((flake, index) => {
        // Внешний элемент падает (и чуть сносится ветром), внутренний — покачивается.
        const fall: CSSProperties & { '--drift': string } = {
          position: 'absolute',
          top: still ? `${flake.top}%` : 0,
          left: `${flake.left}%`,
          '--drift': `${flake.drift}vw`,
          animation: still ? 'none' : `wa-fall ${flake.duration}s linear ${flake.delay}s infinite`,
          willChange: still ? undefined : 'transform',
        };
        const sway: CSSProperties & { '--sway': string } = {
          display: 'block',
          width: flake.size,
          height: flake.size,
          borderRadius: '50%',
          background: snowflake,
          opacity: flake.opacity,
          '--sway': `${flake.sway}px`,
          animation: still
            ? 'none'
            : `wa-sway ${flake.swayDuration}s ease-in-out ${flake.delay}s infinite alternate`,
        };
        return (
          <span key={index} style={fall}>
            <span style={sway} />
          </span>
        );
      })}
    </div>
  );
}
