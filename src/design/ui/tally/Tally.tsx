import { useId, useRef, type CSSProperties } from 'react';
import { useElementWidth } from '../../../hooks/useElementWidth';
import { layoutTally, MIN_UNIT_PX } from './tallyLayout';

export interface TallyDay {
  key: string;
  /** 1 = пн … 7 = вс — для группировки по неделям. */
  weekday: number;
  status: 'past' | 'today' | 'future';
  /** Индекс дисциплины дня 0…1; null — данных нет. */
  score: number | null;
  /** В этот день был срыв — черта красная. */
  relapse: boolean;
}

interface TallyProps {
  days: TallyDay[];
  /** Текст для скринридера: «Арка: день 40 из 92». */
  label: string;
  /** Подпись под сегодняшней чертой. */
  todayCaption?: string;
  minUnitPx?: number;
}

const ROW_HEIGHT = 24;
const TODAY_EXTRA = 8; // сегодняшняя черта выше остальных
const FUTURE_SHARE = 0.4; // будущие дни — короткие бледные риски
const ROW_GAP = 12;

/** Цвет прошедшего дня: чем выше индекс дисциплины, тем ближе к белому. */
function pastColor(score: number | null): string {
  const percent = Math.round((score ?? 0) * 100);
  return `color-mix(in srgb, var(--wa-color-number) ${percent}%, var(--wa-color-gray-600))`;
}

/**
 * «Зарубки» — вся арка одной лентой: каждый день — вертикальная черта,
 * как счёт дней на стене. Прошедшие светлеют по индексу дисциплины,
 * срыв — красный, сегодня — выше и со свечением, будущие — короткие риски.
 */
export function Tally({ days, label, todayCaption, minUnitPx = MIN_UNIT_PX }: TallyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const width = useElementWidth(containerRef);
  // id для SVG-фильтра свечения: только буквы и цифры, чтобы url(#…) не сломался.
  const glowId = `tally-glow-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  const layout =
    width > 0
      ? layoutTally(
          days.map((d) => d.weekday),
          width,
          minUnitPx,
        )
      : null;
  const rowPitch = ROW_HEIGHT + TODAY_EXTRA + ROW_GAP;
  const height = layout ? layout.rows * rowPitch - ROW_GAP : ROW_HEIGHT + TODAY_EXTRA;

  const todayIndex = days.findIndex((d) => d.status === 'today');
  const todayPosition = layout && todayIndex >= 0 ? layout.positions[todayIndex] : null;

  return (
    <div ref={containerRef} className="w-full">
      <svg width={width} height={height} role="img" aria-label={label} className="block">
        <defs>
          <filter id={glowId} x="-300%" y="-50%" width="700%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {layout &&
          days.map((day, i) => {
            const { x, row } = layout.positions[i];
            const baseline = row * rowPitch + TODAY_EXTRA + ROW_HEIGHT;

            if (day.status === 'future') {
              const h = ROW_HEIGHT * FUTURE_SHARE;
              return (
                <rect
                  key={day.key}
                  x={x}
                  y={baseline - h}
                  width={layout.tickWidth}
                  height={h}
                  fill="var(--wa-color-gray-700)"
                />
              );
            }

            if (day.status === 'today') {
              const h = ROW_HEIGHT + TODAY_EXTRA;
              return (
                <rect
                  key={day.key}
                  x={x}
                  y={baseline - h}
                  width={layout.tickWidth}
                  height={h}
                  fill="var(--wa-color-number)"
                  filter={`url(#${glowId})`}
                />
              );
            }

            return (
              <rect
                key={day.key}
                x={x}
                y={baseline - ROW_HEIGHT}
                width={layout.tickWidth}
                height={ROW_HEIGHT}
                style={{ fill: day.relapse ? 'var(--wa-color-danger)' : pastColor(day.score) }}
              />
            );
          })}
      </svg>

      {todayCaption && todayPosition && layout && (
        <TodayCaption
          text={todayCaption}
          // В одну строку подпись стоит прямо под сегодняшней чертой.
          // В несколько строк — слева: иначе она попала бы под чужую строку.
          x={layout.rows === 1 ? todayPosition.x + layout.tickWidth / 2 : null}
          width={width}
        />
      )}
    </div>
  );
}

/**
 * Подпись под зарубками: под сегодняшней чертой (x) или слева (x = null).
 * У краёв прижимается, чтобы не вылезти за контейнер.
 */
function TodayCaption({ text, x, width }: { text: string; x: number | null; width: number }) {
  const EDGE = 56;
  let style: CSSProperties = { left: 0 };
  if (x !== null) style = { left: x, transform: 'translateX(-50%)' };
  if (x !== null && x < EDGE) style = { left: Math.max(0, x - 4) };
  if (x !== null && x > width - EDGE) style = { right: Math.max(0, width - x - 4) };

  return (
    <div className="relative mt-2 h-5">
      <span className="absolute top-0 text-xs whitespace-nowrap text-muted" style={style}>
        {text}
      </span>
    </div>
  );
}
