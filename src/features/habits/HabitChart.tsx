import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { formatDayMonth, fromDateKey } from '../../domain/dates';
import type { ChartPoint, HabitChartData } from '../../domain/habitCharts';
import type { ThemeTokens } from '../../design/tokens';
import { niceTicks } from '../../lib/niceTicks';

/**
 * График на странице привычки. Монохром по теме: выполненное — белым,
 * остальное — серым. Один ряд данных, поэтому
 * без легенды: что показано, говорит заголовок карточки.
 * Recharts тяжёлый, поэтому этот файл грузится отдельно (lazy).
 */

interface HabitChartProps {
  chart: HabitChartData;
  theme: ThemeTokens;
}

const CHART_HEIGHT = 180;

const shortDate = (date: string) =>
  format(fromDateKey(date), 'd MMM', { locale: ru }).replace('.', '');

/** Подпись точки в подсказке и таблице. */
function pointLabel(chart: HabitChartData, point: ChartPoint): string {
  return chart.kind === 'weekly' || chart.kind === 'weeklyRate'
    ? `Неделя с ${formatDayMonth(point.date)}`
    : formatDayMonth(point.date);
}

/** Пояснение под заголовком: что значит цвет и линия. Вместо легенды — у нас один ряд. */
function chartCaption(chart: HabitChartData): string {
  switch (chart.kind) {
    case 'daily':
      return `Белые — цель дня выполнена. Линия — цель: ${chart.target} ${chart.unit}.`;
    case 'weekly':
      return `Белые — неделя выполнена. Линия — цель: ${chart.target} ${chart.unit} в неделю.`;
    case 'weeklyRate':
      return 'Доля дней по плану, когда отмечено. Белые — все дни недели.';
  }
}

function pointValue(chart: HabitChartData, point: ChartPoint): string {
  return chart.unit === '%' ? `${point.value}%` : `${point.value} ${chart.unit}`;
}

export default function HabitChart({ chart, theme }: HabitChartProps) {
  const c = theme.color;
  const axisTick = { fill: c.textMuted, fontSize: 12, fontFamily: theme.font.body };
  const maxValue = Math.max(...chart.points.map((p) => p.value), chart.target ?? 0);
  const ticks = chart.unit === '%' ? [0, 50, 100] : niceTicks(maxValue);

  const tooltip = (
    <Tooltip
      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
      isAnimationActive={false}
      content={({ active, payload }) => {
        const point = payload?.[0]?.payload as ChartPoint | undefined;
        if (!active || !point) return null;
        return (
          <div className="rounded-md border border-glass-border bg-graphite px-3 py-2">
            <p className="numeric text-base text-number">{pointValue(chart, point)}</p>
            <p className="text-xs text-muted">{pointLabel(chart, point)}</p>
          </div>
        );
      }}
    />
  );

  const xAxis = (
    <XAxis
      dataKey="date"
      tickFormatter={shortDate}
      tick={axisTick}
      tickLine={false}
      axisLine={{ stroke: c.gray700 }}
      interval="preserveStartEnd"
      minTickGap={24}
    />
  );
  const yAxis = (
    <YAxis
      width={36}
      allowDecimals={false}
      tick={axisTick}
      tickLine={false}
      axisLine={false}
      ticks={ticks}
      domain={[0, ticks.at(-1) ?? 1]}
    />
  );
  const grid = <CartesianGrid vertical={false} stroke={c.gray800} />;

  return (
    <div>
      <p className="mb-3 text-sm text-muted">{chartCaption(chart)}</p>
      <div style={{ height: CHART_HEIGHT }} aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chart.points}
            margin={{ top: 8, right: 4, bottom: 0, left: 0 }}
            barCategoryGap="20%"
          >
            {grid}
            {xAxis}
            {yAxis}
            {tooltip}
            {chart.target !== null && (
              <ReferenceLine y={chart.target} stroke={c.gray400} strokeWidth={1} />
            )}
            <Bar dataKey="value" maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {chart.points.map((point) => (
                <Cell key={point.date} fill={point.done ? c.number : c.gray400} />
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
            {[...chart.points].reverse().map((point) => (
              <tr key={point.date} className="border-t border-gray-800">
                <td className="py-1.5 text-muted">{pointLabel(chart, point)}</td>
                <td className="numeric py-1.5 text-right text-text">{pointValue(chart, point)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
