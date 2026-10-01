import { eachDay, formatDayMonth } from '../../domain/dates';
import {
  goalProgress,
  goalStartDate,
  neededPace,
  numericForecast,
  sortedEntries,
} from '../../domain/goals';
import type { DateKey, Goal, NumericGoal } from '../../domain/types';
import { formatNumber, formatSigned } from '../../lib/formatNumber';
import { plural } from '../../lib/plural';

/** Подписи целей для экранов: прогресс, темп, прогноз. */

/** "12 400 ₽", "78 кг", "3" (без единицы). */
export function formatValue(value: number, unit: string): string {
  return unit ? `${formatNumber(value)} ${unit}` : formatNumber(value);
}

/** "Цель по шагам", "Пополнения", "Замеры" — подпись под названием цели. */
export function goalKindLabel(goal: Goal): string {
  if (goal.kind === 'steps') return 'Цель по шагам';
  return goal.entryMode === 'add' ? 'Цель с пополнениями' : 'Цель с замерами';
}

/** Пройденная доля в процентах. Вниз: 99,6% — ещё 99, чтобы 100 означало «достигнута». */
export function goalPercent(goal: Goal): number {
  return Math.floor(goalProgress(goal).ratio * 100 + 1e-9);
}

/** "3 из 5 шагов", "12 400 из 50 000 ₽", "сейчас 78 кг, цель 75 кг". */
export function progressLabel(goal: Goal): string {
  const { current, target } = goalProgress(goal);
  if (goal.kind === 'steps') {
    return `${current} из ${target} ${plural(target, 'шага', 'шагов', 'шагов')}`;
  }
  if (goal.entryMode === 'add') {
    return `${formatNumber(current)} из ${formatValue(target, goal.unit)}`;
  }
  return `сейчас ${formatValue(current, goal.unit)}, цель ${formatValue(target, goal.unit)}`;
}

/** Строки прогноза числовой цели: главная и пояснения под ней. */
export interface ForecastText {
  headline: string;
  details: string[];
}

export function forecastText(goal: NumericGoal, today: DateKey): ForecastText {
  const forecast = numericForecast(goal, today);
  const pace = neededPace(goal, today);
  const unit = goal.unit ? ` ${goal.unit}` : '';
  const perWeek = (value: number) => `${formatSigned(value)}${unit} в неделю`;
  const perDay = (value: number) => `${formatSigned(value)}${unit} в день`;

  const details: string[] = [];
  let headline: string;

  switch (forecast.status) {
    case 'reached':
      return { headline: 'Цель достигнута.', details: [] };
    case 'noEntries':
      headline =
        goal.entryMode === 'add'
          ? 'Прогноз появится после первых пополнений.'
          : 'Прогноз появится после первых замеров.';
      break;
    case 'tooEarly':
      headline = `Прогноз появится ${formatDayMonth(forecast.readyOn)}: нужна неделя данных.`;
      break;
    case 'stalled':
      headline = 'При таком темпе цель не приблизится.';
      details.push(`Темп: ${perWeek(forecast.perWeek)}.`);
      break;
    case 'eta':
      headline = `При таком темпе — к ${formatDayMonth(forecast.date)}.`;
      details.push(`Темп: ${perWeek(forecast.perWeek)}.`);
      break;
  }

  if (pace && goal.deadline) {
    const deadline = formatDayMonth(goal.deadline);
    const onTrack = forecast.status === 'eta' && forecast.date <= goal.deadline;
    if (onTrack) {
      details.push(`К дедлайну ${deadline} успеваешь.`);
    } else {
      // Меньше двух недель — понятнее «в день».
      const needed = pace.daysLeft < 14 ? perDay(pace.perDay) : perWeek(pace.perWeek);
      details.push(`Чтобы успеть к ${deadline}, нужно ${needed}.`);
    }
  }
  return { headline, details };
}

/**
 * Значения по дням от начала цели до сегодня — для маленького графика.
 * Пополнения — накопленная сумма; замеры — значение в день замера, в остальные дни пропуск.
 */
export function progressSeries(goal: NumericGoal, today: DateKey): (number | null)[] {
  const entries = sortedEntries(goal);
  // Записи задним числом раньше создания цели — тоже на графике.
  const first = entries[0]?.date;
  const start = goalStartDate(goal);
  const days = eachDay(first && first < start ? first : start, today);

  if (goal.entryMode === 'add') {
    const added = new Map<DateKey, number>();
    for (const entry of entries) added.set(entry.date, (added.get(entry.date) ?? 0) + entry.value);
    let total = goal.startValue;
    return days.map((day) => (total += added.get(day) ?? 0));
  }

  const measured = new Map<DateKey, number>();
  for (const entry of entries) measured.set(entry.date, entry.value);
  return days.map((day, i) => measured.get(day) ?? (i === 0 ? goal.startValue : null));
}

/** Сколько знаков после запятой показать: 78 → 0, 78,5 → 1, 78,25 → 2 (не больше двух). */
export function decimalsOf(value: number): number {
  for (let digits = 0; digits < 2; digits++) {
    const scaled = value * 10 ** digits;
    if (Math.abs(scaled - Math.round(scaled)) < 1e-9) return digits;
  }
  return 2;
}
