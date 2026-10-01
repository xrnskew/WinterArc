import { describe, expect, it } from 'vitest';
import { eachDay } from './dates';
import { dayCompletion, getLog, habitStreak, habitTotals, setLog, weekProgress } from './progress';
import { dayRequirement, habitStartDate, isHabitActiveOn, isWeeklyHabit } from './schedule';
import { makeData, makeHabit } from './testData';
import type { AppData } from './types';

const check = makeHabit('check', { kind: 'check' });
const weekdaysCheck = makeHabit('weekdays', {
  kind: 'check',
  schedule: { type: 'weekdays', days: [1, 2, 3, 4, 5] },
});
const reading = makeHabit('reading', { kind: 'count', unit: 'страниц', dailyTarget: 20 });
const gym = makeHabit('gym', { kind: 'check', schedule: { type: 'timesPerWeek', times: 3 } });
const study = makeHabit('study', { kind: 'time', targetMinutes: 180, targetPeriod: 'week' });
const smoking = makeHabit('smoking', { kind: 'abstain' });

/** Отметить привычку выполненной в перечисленные дни. */
function logDays(data: AppData, habitId: string, days: string[], value = 1): AppData {
  return days.reduce((acc, day) => setLog(acc, habitId, day, value), data);
}

describe('расписание', () => {
  it('по будням: выходные не по плану', () => {
    expect(dayRequirement(weekdaysCheck, '2026-10-02')).toBe('required'); // пт
    expect(dayRequirement(weekdaysCheck, '2026-10-03')).toBe('off'); // сб
  });

  it('N раз в неделю и недельное время — гибкие', () => {
    expect(isWeeklyHabit(gym)).toBe(true);
    expect(isWeeklyHabit(study)).toBe(true);
    expect(dayRequirement(gym, '2026-10-03')).toBe('flexible');
  });

  it('отказ нужен каждый день', () => {
    expect(dayRequirement(smoking, '2026-10-03')).toBe('required');
  });

  it('привычка активна с даты создания и до архива', () => {
    expect(habitStartDate(check)).toBe('2026-10-01');
    expect(isHabitActiveOn(check, '2026-09-30')).toBe(false);
    const archived = { ...check, archivedAt: '2026-10-10T12:00:00.000Z' };
    expect(isHabitActiveOn(archived, '2026-10-10')).toBe(true);
    expect(isHabitActiveOn(archived, '2026-10-11')).toBe(false);
  });
});

describe('записи и выполнение дня', () => {
  it('0 удаляет запись', () => {
    let data = makeData([reading]);
    data = setLog(data, 'reading', '2026-10-01', 12);
    expect(getLog(data.habitLogs, 'reading', '2026-10-01')).toBe(12);
    data = setLog(data, 'reading', '2026-10-01', 0);
    expect(data.habitLogs.reading).toEqual({});
  });

  it('количество: доля от цели, не больше 1', () => {
    let data = makeData([reading]);
    data = setLog(data, 'reading', '2026-10-01', 10);
    expect(dayCompletion(reading, data.habitLogs, '2026-10-01')).toBe(0.5);
    data = setLog(data, 'reading', '2026-10-01', 35);
    expect(dayCompletion(reading, data.habitLogs, '2026-10-01')).toBe(1);
  });
});

describe('неделя', () => {
  it('N раз в неделю: считает выполненные дни до сегодня', () => {
    const data = logDays(makeData([gym]), 'gym', ['2026-10-05', '2026-10-07', '2026-10-10']);
    expect(weekProgress(gym, data.habitLogs, '2026-10-05', '2026-10-08')).toEqual({
      done: 2,
      target: 3,
    });
    expect(weekProgress(gym, data.habitLogs, '2026-10-05', '2026-10-11')).toEqual({
      done: 3,
      target: 3,
    });
  });

  it('время с недельной целью: сумма минут', () => {
    const data = logDays(makeData([study]), 'study', ['2026-10-05', '2026-10-06'], 60);
    expect(weekProgress(study, data.habitLogs, '2026-10-05', '2026-10-11')).toEqual({
      done: 120,
      target: 180,
    });
  });
});

describe('серии', () => {
  it('каждый день: пропуск рвёт серию', () => {
    const data = logDays(makeData([check]), 'check', [
      '2026-10-01',
      '2026-10-02',
      // 3-го пропуск
      '2026-10-04',
      '2026-10-05',
      '2026-10-06',
    ]);
    expect(habitStreak(check, data.habitLogs, '2026-10-06')).toEqual({
      current: 3,
      best: 3,
      unit: 'day',
    });
  });

  it('сегодня ещё не отмечено — серия не рвётся', () => {
    const data = logDays(makeData([check]), 'check', ['2026-10-01', '2026-10-02']);
    expect(habitStreak(check, data.habitLogs, '2026-10-03').current).toBe(2);
    expect(habitStreak(check, data.habitLogs, '2026-10-04').current).toBe(0);
  });

  it('по будням: выходные серию не рвут', () => {
    const data = logDays(makeData([weekdaysCheck]), 'weekdays', [
      '2026-10-01', // чт
      '2026-10-02', // пт
      '2026-10-05', // пн
    ]);
    expect(habitStreak(weekdaysCheck, data.habitLogs, '2026-10-05').current).toBe(3);
  });

  it('N раз в неделю — серия в неделях', () => {
    const days = [
      '2026-10-05',
      '2026-10-06',
      '2026-10-07', // неделя 2 — выполнена
      '2026-10-12',
      '2026-10-14',
      '2026-10-16', // неделя 3 — выполнена
    ];
    const data = logDays(makeData([gym]), 'gym', days);
    const streak = habitStreak(gym, data.habitLogs, '2026-10-20');
    expect(streak).toEqual({ current: 2, best: 2, unit: 'week' });
  });

  it('проваленная прошлая неделя рвёт недельную серию', () => {
    const data = logDays(makeData([gym]), 'gym', ['2026-10-05', '2026-10-06', '2026-10-07']);
    expect(habitStreak(gym, data.habitLogs, '2026-10-20').current).toBe(0);
    expect(habitStreak(gym, data.habitLogs, '2026-10-20').best).toBe(1);
  });
});

describe('итоги', () => {
  it('сумма, выполненные и запланированные дни', () => {
    const days = eachDay('2026-10-01', '2026-10-05');
    let data = logDays(makeData([reading]), 'reading', days.slice(0, 3), 20);
    data = setLog(data, 'reading', '2026-10-04', 5);
    expect(habitTotals(reading, data.habitLogs, '2026-10-01', '2026-10-05')).toEqual({
      sum: 65,
      doneDays: 3,
      plannedDays: 5,
    });
  });
});
