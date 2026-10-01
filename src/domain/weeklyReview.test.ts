import { describe, expect, it } from 'vitest';
import { allAchievements, isEarned, newlyEarned, unlockAchievements } from './achievements';
import { getActiveArc } from './arc';
import { eachDay } from './dates';
import { setRating } from './days';
import { setLog } from './progress';
import { makeData, makeHabit } from './testData';
import type { AppData } from './types';
import {
  defaultReviewWeek,
  previousFocus,
  reviewDue,
  reviewWeekRange,
  saveReview,
  weekReviewSummary,
} from './weeklyReview';

const gym = makeHabit('gym', { kind: 'check' });
const run = makeHabit('run', { kind: 'check', schedule: { type: 'timesPerWeek', times: 3 } });
const swim = makeHabit('swim', {
  kind: 'time',
  targetMinutes: 45,
  targetPeriod: 'day',
  schedule: { type: 'timesPerWeek', times: 2 },
});
const study = makeHabit('study', {
  kind: 'time',
  targetMinutes: 60,
  targetPeriod: 'day',
  schedule: { type: 'weekdays', days: [1, 2, 3, 4, 5] },
});
const NOW = '2026-10-12T19:00:00.000Z';

const arcOf = (data: AppData) => getActiveArc(data)!;

describe('недели обзора', () => {
  it('от недели старта до текущей; в понедельник — прошлая неделя', () => {
    const arc = arcOf(makeData([]));
    expect(reviewWeekRange(arc, '2026-10-14')).toEqual({ first: '2026-09-28', last: '2026-10-12' });
    expect(defaultReviewWeek(arc, '2026-10-14')).toBe('2026-10-12');
    expect(defaultReviewWeek(arc, '2026-10-12')).toBe('2026-10-05');
    // В первый день арки (четверг) — первая неделя.
    expect(defaultReviewWeek(arc, '2026-10-01')).toBe('2026-09-28');
  });
});

describe('итоги недели', () => {
  it('привычки, лучший и худший день, оценки, задачи', () => {
    let data = makeData([gym, run, study]);
    // Неделя 5–11 октября.
    for (const day of ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-09']) {
      data = setLog(data, 'gym', day, 1);
    }
    for (const day of ['2026-10-05', '2026-10-08']) data = setLog(data, 'run', day, 1);
    data = setLog(data, 'study', '2026-10-05', 60);
    data = setLog(data, 'study', '2026-10-06', 30);
    const energy = data.ratingScales[0].id;
    data = setRating(data, '2026-10-05', energy, 8);
    data = setRating(data, '2026-10-06', energy, 6);
    data = setRating(data, '2026-10-02', energy, 4);
    data = {
      ...data,
      tasks: [
        {
          id: 't',
          title: 'Отчёт',
          goalId: null,
          priority: 'medium',
          deadline: null,
          doneAt: '2026-10-07T10:00:00.000Z',
          createdAt: NOW,
        },
      ],
    };

    const summary = weekReviewSummary(data, arcOf(data), '2026-10-05', '2026-10-20');
    expect(summary.status).toBe('past');
    expect(summary.sunday).toBe('2026-10-11');
    expect(
      summary.habits.map((item) => `${item.habit.id}:${item.done}/${item.target}:${item.unit}`),
    ).toEqual(['gym:4/7:days', 'run:2/3:times', 'study:1/5:days']);
    // Понедельник: всё сделано; четверг (8 окт): ни тренировки, ни учёбы.
    expect(summary.bestDay).toEqual({ date: '2026-10-05', index: 100 });
    expect(summary.worstDay).toEqual({ date: '2026-10-08', index: 0 });
    expect(summary.ratings[0]).toMatchObject({ average: 7, previousAverage: 4 });
    expect(summary.tasksDone).toBe(1);
  });

  it('время с расписанием «N раз в неделю» считается в разах, недельное время — в минутах', () => {
    const reading = makeHabit('reading', {
      kind: 'time',
      targetMinutes: 120,
      targetPeriod: 'week',
    });
    let data = makeData([swim, reading]);
    data = setLog(data, 'swim', '2026-10-05', 45);
    data = setLog(data, 'reading', '2026-10-05', 30);
    const summary = weekReviewSummary(data, arcOf(data), '2026-10-05', '2026-10-20');
    expect(summary.habits.map((item) => `${item.done}/${item.target}:${item.unit}`)).toEqual([
      '1/2:times',
      '30/120:minutes',
    ]);
  });

  it('текущая неделя: сделанное — до сегодня, лучшие дни — только закончившиеся', () => {
    let data = makeData([gym]);
    data = setLog(data, 'gym', '2026-10-12', 1);
    const summary = weekReviewSummary(data, arcOf(data), '2026-10-12', '2026-10-13');
    expect(summary.status).toBe('current');
    expect(summary.habits[0]).toMatchObject({ done: 1, target: 7 });
    expect(summary.bestDay).toBeNull();
  });
});

describe('ответы', () => {
  it('сохраняются по понедельнику, пустые — удаляются; фокус прошлой недели', () => {
    let data = makeData([]);
    data = saveReview(
      data,
      '2026-10-05',
      { wins: ' Режим ', misses: '', nextFocus: 'Сон до 23:30' },
      NOW,
    );
    expect(data.weeklyReviews['2026-10-05']).toEqual({
      wins: 'Режим',
      misses: '',
      nextFocus: 'Сон до 23:30',
      updatedAt: NOW,
    });
    expect(previousFocus(data, '2026-10-12')).toBe('Сон до 23:30');
    data = saveReview(data, '2026-10-05', { wins: ' ', misses: '', nextFocus: '' }, NOW);
    expect(data.weeklyReviews).toEqual({});
  });

  it('напоминание: в воскресенье — эта неделя, в понедельник — прошлая, если обзора нет', () => {
    let data = makeData([]);
    const arc = arcOf(data);
    expect(reviewDue(data, arc, '2026-10-11')).toBe('2026-10-05');
    expect(reviewDue(data, arc, '2026-10-12')).toBe('2026-10-05');
    expect(reviewDue(data, arc, '2026-10-13')).toBeNull();
    data = saveReview(data, '2026-10-05', { wins: 'Да', misses: '', nextFocus: '' }, NOW);
    expect(reviewDue(data, arc, '2026-10-12')).toBeNull();
  });
});

describe('достижения', () => {
  it('серия 7 дней, первая отметка и идеальный день', () => {
    let data = makeData([gym]);
    for (const day of eachDay('2026-10-01', '2026-10-07')) data = setLog(data, 'gym', day, 1);
    const earned = newlyEarned(data, '2026-10-08').map((item) => item.id);
    expect(earned).toContain('streak-7:gym');
    expect(earned).toContain('first-mark');
    expect(earned).toContain('perfect-day');
    expect(earned).not.toContain('streak-30:gym');
  });

  it('у гибкой привычки серия в неделях, у времени — часы', () => {
    const items = allAchievements(makeData([run, study]), '2026-10-08');
    expect(items.filter((item) => item.subject === 'run').map((item) => item.id)).toEqual([
      'streak-w2:run',
      'streak-w4:run',
      'streak-w8:run',
      'streak-w12:run',
    ]);
    expect(items.some((item) => item.id === 'hours-10:study')).toBe(true);
  });

  it('записанный жетон не выдаётся второй раз и остаётся', () => {
    let data = makeData([gym]);
    data = setLog(data, 'gym', '2026-10-01', 1);
    const ids = newlyEarned(data, '2026-10-02').map((item) => item.id);
    data = unlockAchievements(data, ids, NOW);
    expect(data.achievements.map((item) => item.id)).toEqual(ids);
    expect(newlyEarned(data, '2026-10-02')).toEqual([]);
    expect(unlockAchievements(data, ids, NOW)).toBe(data);
  });

  it('экватор арки', () => {
    const data = makeData([]);
    const half = allAchievements(data, '2026-11-15').find((item) => item.id === 'arc-half:arc')!;
    // Арка 92 дня: экватор — 46-й день, 15 ноября.
    expect(half.target).toBe(46);
    expect(isEarned(half)).toBe(true);
    const before = allAchievements(data, '2026-11-14').find((item) => item.id === 'arc-half:arc')!;
    expect(isEarned(before)).toBe(false);
  });
});
