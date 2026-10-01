import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ArcWeek } from '../../domain/analytics';
import { formatDayMonth, formatShortDate } from '../../domain/dates';
import type { ThemeTokens } from '../../design/tokens';

/**
 * Индекс дисциплины по неделям арки. Один ряд — без легенды.
 * Завершённые недели — белые, текущая — серая (она ещё идёт), будущие — пустые.
 * Recharts тяжёлый, поэтому файл грузится отдельно (lazy).
 */

interface WeeksChartProps {
  weeks: ArcWeek[];
  theme: ThemeTokens;
}

const TICKS = [0, 50, 100];

export default function WeeksChart({ weeks, theme }: WeeksChartProps) {
  const c = theme.color;
  const axisTick = { fill: c.textMuted, fontSize: 12, fontFamily: theme.font.body };
  const shown = weeks.filter((week) => week.index !== null);

  return (
    <div>
      <p className="mb-3 text-sm text-muted">
        Белые — завершённые недели, серая — текущая: она ещё идёт.
      </p>
      <div className="h-45 lg:h-65" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeks} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
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
              width={36}
              tick={axisTick}
              tickLine={false}
              axisLine={false}
              ticks={TICKS}
              domain={[0, 100]}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              isAnimationActive={false}
              content={({ active, payload }) => {
                const week = payload?.[0]?.payload as ArcWeek | undefined;
                if (!active || !week || week.index === null) return null;
                return (
                  <div className="rounded-md border border-glass-border bg-graphite px-3 py-2">
                    <p className="numeric text-base text-number">{week.index}</p>
                    <p className="text-xs text-muted">Неделя с {formatDayMonth(week.monday)}</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="index" maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {weeks.map((week) => (
                <Cell key={week.monday} fill={week.status === 'current' ? c.gray400 : c.number} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Те же данные таблицей — для скринридера и тех, кому так удобнее. */}
      <details className="mt-3">
        <summary className="cursor-pointer text-sm text-muted hover:text-text">
          Показать таблицей
        </summary>
        <table className="mt-2 w-full text-sm">
          <tbody>
            {[...shown].reverse().map((week) => (
              <tr key={week.monday} className="border-t border-gray-800">
                <td className="py-1.5 text-muted">
                  Неделя с {formatDayMonth(week.monday)}
                  {week.status === 'current' && ', идёт'}
                </td>
                <td className="numeric py-1.5 text-right text-text">{week.index}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
