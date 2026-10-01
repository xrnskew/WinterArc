import { cleanDaysBetween, cleanStreak, cravingsResisted, moneySaved } from '../../domain/abstain';
import { daysBetween, weekStart } from '../../domain/dates';
import { habitStreak, habitTotals, weekProgress } from '../../domain/progress';
import { isWeeklyHabit } from '../../domain/schedule';
import type { AppData, Arc, DateKey, Habit } from '../../domain/types';
import { plural } from '../../lib/plural';

/** Одна плитка статистики: крупное число и подпись под ним. */
export interface StatTile {
  value: number;
  decimals?: number;
  /** Знак после числа: «%». */
  suffix?: string;
  label: string;
}

const dayWord = (n: number) => plural(n, 'день', 'дня', 'дней');

/** От 10 000 показываем в тысячах, чтобы число помещалось в плитку: 11,1 тыс. ₽. */
function moneyTile(money: number, currency: string): StatTile {
  if (money < 10_000) return { value: money, label: `${currency} сэкономлено` };
  return {
    value: Math.round(money / 100) / 10,
    decimals: 1,
    label: `тыс. ${currency} сэкономлено`,
  };
}
const weekWord = (n: number) => plural(n, 'неделя', 'недели', 'недель');

/** Четыре плитки статистики привычки за текущую арку (серии — за всё время). */
export function habitStatTiles(
  habit: Habit,
  data: AppData,
  arc: Arc,
  today: DateKey,
  currency: string,
): StatTile[] {
  // Период арки до сегодня (или до конца арки, если она уже прошла).
  const to = daysBetween(today, arc.endDate) < 0 ? arc.endDate : today;

  if (habit.kind === 'abstain') {
    const streak = cleanStreak(habit, data, today);
    const clean = cleanDaysBetween(habit, data, arc.startDate, to);
    const money = moneySaved(habit, clean);
    const cravings = cravingsResisted(data, habit.id, arc.startDate, to);
    return [
      { value: streak.current, label: `${dayWord(streak.current)} без срыва` },
      { value: streak.best, label: 'лучшая серия' },
      { value: clean, label: `чистых ${plural(clean, 'день', 'дня', 'дней')} в арке` },
      money !== null
        ? moneyTile(money, currency)
        : {
            value: cravings,
            label: `${plural(cravings, 'раз', 'раза', 'раз')} устоял перед тягой`,
          },
    ];
  }

  const streak = habitStreak(habit, data.habitLogs, today);
  const totals = habitTotals(habit, data.habitLogs, arc.startDate, to);
  const isTime = habit.kind === 'time';
  const hours = { value: Math.round((totals.sum / 60) * 10) / 10, decimals: 1, label: 'ч всего' };

  if (isWeeklyHabit(habit)) {
    const week = weekProgress(habit, data.habitLogs, weekStart(today), today);
    // Недельная цель по времени считается в минутах, «N раз в неделю» — в разах.
    const weeklyMinutes = habit.kind === 'time' && habit.targetPeriod === 'week';
    return [
      { value: streak.current, label: `${weekWord(streak.current)} подряд` },
      { value: streak.best, label: 'лучшая серия' },
      {
        value: week.done,
        label: weeklyMinutes
          ? `из ${week.target} мин на этой неделе`
          : `из ${week.target} на этой неделе`,
      },
      isTime
        ? hours
        : {
            value: totals.doneDays,
            label: `${plural(totals.doneDays, 'раз', 'раза', 'раз')} за арку`,
          },
    ];
  }

  const percent =
    totals.plannedDays > 0 ? Math.round((totals.doneDays / totals.plannedDays) * 100) : 0;
  const third: StatTile =
    habit.kind === 'count'
      ? { value: totals.sum, label: `${habit.unit} всего` }
      : isTime
        ? hours
        : { value: totals.doneDays, label: `из ${totals.plannedDays} по плану` };

  return [
    { value: streak.current, label: `${dayWord(streak.current)} подряд` },
    { value: streak.best, label: 'лучшая серия' },
    third,
    { value: percent, suffix: '%', label: 'дней выполнено' },
  ];
}
