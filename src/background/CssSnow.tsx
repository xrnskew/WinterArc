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
  duration: number; // с
  delay: number; // с, отрицательная — чтобы снег не начинался с пустого экрана
  drift: number; // vw, снос вбок за одно падение
}

function makeFlakes(count: number): Flake[] {
  const random = createRandom(2026);
  return Array.from({ length: count }, () => {
    const near = random() < 0.25; // каждая четвёртая — «ближняя»: крупнее и быстрее
    const duration = near ? between(random, 7, 11) : between(random, 13, 22);
    return {
      left: between(random, -10, 100),
      top: between(random, 0, 100),
      size: near ? between(random, 3.5, 5) : between(random, 1.5, 2.8),
      opacity: near ? between(random, 0.55, 0.8) : between(random, 0.25, 0.5),
      duration,
      delay: -between(random, 0, duration),
      drift: between(random, 4, 14),
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
        const style: CSSProperties & { '--drift': string } = {
          position: 'absolute',
          top: still ? `${flake.top}%` : 0,
          left: `${flake.left}%`,
          width: flake.size,
          height: flake.size,
          borderRadius: '50%',
          background: snowflake,
          opacity: flake.opacity,
          '--drift': `${flake.drift}vw`,
          animation: still
            ? 'none'
            : `wa-fall ${flake.duration}s linear ${flake.delay}s infinite`,
          willChange: still ? undefined : 'transform',
        };
        return <span key={index} style={style} />;
      })}
    </div>
  );
}
