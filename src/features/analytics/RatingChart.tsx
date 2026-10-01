import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { RatingWeek } from '../../domain/analytics';
import { formatDayMonth, formatShortDate } from '../../domain/dates';
import type { ThemeTokens } from '../../design/tokens';
import { formatNumber } from '../../lib/formatNumber';

/**
 * Средняя оценка по неделям — линия; сплошная серая — среднее за арку.
 * Один ряд — без легенды, пояснение под заголовком карточки.
 */

interface RatingChartProps {
  weeks: RatingWeek[];
  /** Среднее за арку — опорная линия. */
  average: number;
  theme: ThemeTokens;
}

const TICKS = [0, 5, 10];

export default function RatingChart({ weeks, average, theme }: RatingChartProps) {
  const c = theme.color;
  const axisTick = { fill: c.textMuted, fontSize: 12, fontFamily: theme.font.body };
  const rated = weeks.filter((week) => week.average !== null);

  return (
    <div>
      <div style={{ height: 150 }} aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={weeks} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={c.gray800} />
            <XAxis
              dataKey="monday"
              tickFormatter={formatShortDate}
              tick={axisTick}
              tickLine={false}
              axisLine={{ stroke: c.gray700 }}
              interval="preserveStartEnd"
              minTickGap={24}
            />
            <YAxis
              width={28}
              tick={axisTick}
              tickLine={false}
              axisLine={false}
              ticks={TICKS}
              domain={[0, 10]}
            />
            <ReferenceLine y={average} stroke={c.gray500} strokeWidth={1} />
            <Tooltip
              cursor={{ stroke: c.gray500, strokeWidth: 1 }}
              isAnimationActive={false}
              content={({ active, payload }) => {
                const week = payload?.[0]?.payload as RatingWeek | undefined;
                if (!active || !week || week.average === null) return null;
                return (
                  <div className="rounded-md border border-glass-border bg-graphite px-3 py-2">
                    <p className="numeric text-base text-number">{formatNumber(week.average, 1)}</p>
                    <p className="text-xs text-muted">Неделя с {formatDayMonth(week.monday)}</p>
                  </div>
                );
              }}
            />
            <Line
              dataKey="average"
              stroke={c.number}
              strokeWidth={2}
              dot={{ r: 4, fill: c.number, stroke: c.graphite, strokeWidth: 2 }}
              activeDot={{ r: 5, fill: c.number, stroke: c.graphite, strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-sm text-muted hover:text-text">
          Показать таблицей
        </summary>
        <table className="mt-2 w-full text-sm">
          <tbody>
            {[...rated].reverse().map((week) => (
              <tr key={week.monday} className="border-t border-gray-800">
                <td className="py-1.5 text-muted">Неделя с {formatDayMonth(week.monday)}</td>
                <td className="numeric py-1.5 text-right text-text">
                  {formatNumber(week.average!, 1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
