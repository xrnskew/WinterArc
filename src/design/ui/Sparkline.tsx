interface SparklineProps {
  /** Значения по порядку; null — пропуск (день без оценки). */
  values: (number | null)[];
  min: number;
  max: number;
  height?: number;
}

const WIDTH = 100;

/**
 * Маленький график-линия без осей: тенденция одним взглядом.
 * Точные цифры показываются рядом текстом, поэтому для скринридера график скрыт.
 */
export function Sparkline({ values, min, max, height = 36 }: SparklineProps) {
  const step = values.length > 1 ? WIDTH / (values.length - 1) : 0;
  const y = (value: number) => height - 3 - ((value - min) / (max - min)) * (height - 6);
  const points = values.flatMap((value, i) =>
    value === null ? [] : [{ x: i * step, y: y(value) }],
  );
  const last = points.at(-1);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${height}`}
      preserveAspectRatio="none"
      className="block w-full"
      style={{ height }}
      aria-hidden="true"
    >
      <polyline
        points={points.map((p) => `${p.x},${p.y}`).join(' ')}
        fill="none"
        stroke="var(--wa-color-number)"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {/* Точка на конце. Это линия нулевой длины с круглым концом: при растяжении
          графика по ширине обычный circle стал бы овалом, а она остаётся кругом. */}
      {last && (
        <line
          x1={last.x}
          y1={last.y}
          x2={last.x}
          y2={last.y}
          stroke="var(--wa-color-number)"
          strokeWidth={7}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}
