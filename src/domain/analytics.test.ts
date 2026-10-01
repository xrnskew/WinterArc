import { describe, expect, it } from 'vitest';
import { getActiveArc } from './arc';
import {
  arcCalendar,
  arcRatingAverage,
  arcSummary,
  arcWeeks,
  habitArcRate,
  habitLinks,
  noteWords,
  ratingWeeks,
  weekdayExtremes,
  wordLinks,
} from './analytics';
import { addDays, eachDay } from './dates';
import { setDayNote, setRating } from './days';
import { setLog } from './progress';
import { makeData, makeHabit } from './testData';
import type { AppData } from './types';

const gym = makeHabit('gym', { kind: 'check' });
const run = makeHabit('run', { kind: 'check', schedule: { type: 'timesPerWeek', times: 2 } });

function withLogs(habitId: string, days: string[], data = makeData([gym, run])): AppData {
  return days.reduce((result, day) => setLog(result, habitId, day, 1), data);
}

const arcOf = (data: AppData) => getActiveArc(data)!;

describe('недели и итоги арки', () => {
  it('недели с понедельника до конца арки, текущая и будущие', () => {
    const data = withLogs('gym', ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']);
    const weeks = arcWeeks(data, arcOf(data), '2026-10-07');
    expect(weeks).toHaveLength(14);
    expect(weeks.slice(0, 3).map((week) => `${week.monday}:${week.status}`)).toEqual([
      '2026-09-28:past',
      '2026-10-05:current',
      '2026-10-12:future',
    ]);
    // Первая неделя: тренировки — все 4 дня, пробежки — ни одной из 2 (пропорционально 4 дням).
    expect(weeks[0].index).toBe(50);
    expect(weeks[2].index).toBeNull();
  });

  it('средний индекс, лучшая неделя, идеальные дни и отметки', () => {
    let data = withLogs('gym', ['2026-10-01', '2026-10-02', '2026-10-05']);
    data = withLogs('run', ['2026-10-01', '2026-10-02'], data);
    const summary = arcSummary(data, arcOf(data), '2026-10-06');
    expect(summary.bestWeek?.monday).toBe('2026-09-28');
    expect(summary.perfectDays).toBe(3);
    expect(summary.marks).toBe(5);
    expect(summary.averageIndex).not.toBeNull();
  });
});

describe('календарь арки', () => {
  it('месяцы сеткой с понедельника, дни вне месяца пустые', () => {
    const data = withLogs('gym', ['2026-10-01']);
    const months = arcCalendar(data, arcOf(data), '2026-10-02');
    expect(months.map((month) => month.title)).toEqual([
      'Октябрь 2026',
      'Ноябрь 2026',
      'Декабрь 2026',
    ]);
    const october = months[0];
    expect(october.weeks).toHaveLength(5);
    // 1 октября — четверг.
    expect(october.weeks[0].map((day) => day?.day ?? null)).toEqual([null, null, null, 1, 2, 3, 4]);
    expect(october.weeks[0][3]).toMatchObject({ status: 'past', score: 1, inArc: true });
    expect(october.weeks[0][4]).toMatchObject({ status: 'today', score: 0 });
    expect(october.weeks[0][5]).toMatchObject({ status: 'future', score: null });
  });
});

describe('выполнение привычки за арку', () => {
  it('дневная: сегодня считается, только если уже сделано', () => {
    const data = withLogs('gym', ['2026-10-01', '2026-10-02', '2026-10-04']);
    expect(habitArcRate(gym, data, arcOf(data), '2026-10-05')).toEqual({
      done: 3,
      total: 4,
      unit: 'day',
    });
    const today = withLogs('gym', ['2026-10-05'], data);
    expect(habitArcRate(gym, today, arcOf(today), '2026-10-05').total).toBe(5);
  });

  it('гибкая: недели; первая неполная и текущая — только если цель выполнена', () => {
    const data = withLogs('run', ['2026-10-02', '2026-10-03', '2026-10-06']);
    expect(habitArcRate(run, data, arcOf(data), '2026-10-14')).toEqual({
      done: 1,
      total: 2,
      unit: 'week',
    });
  });
});

describe('оценки', () => {
  /** Энергия 8 по чётным дням, 5 — по нечётным, с 1 по 28 октября. */
  function rated(): AppData {
    let data = makeData([gym, run]);
    const energy = data.ratingScales[0].id;
    for (const day of eachDay('2026-10-01', '2026-10-28')) {
      data = setRating(data, day, energy, Number(day.slice(8)) % 2 === 0 ? 8 : 5);
    }
    return data;
  }

  it('среднее за арку и по неделям', () => {
    const data = rated();
    const energy = data.ratingScales[0].id;
    expect(arcRatingAverage(data, energy, arcOf(data), '2026-10-28')).toBe(6.5);
    const weeks = ratingWeeks(data, energy, arcOf(data), '2026-10-28');
    expect(weeks.map((week) => week.monday)).toEqual([
      '2026-09-28',
      '2026-10-05',
      '2026-10-12',
      '2026-10-19',
      '2026-10-26',
    ]);
    // 1–4 октября: 5, 8, 5, 8.
    expect(weeks[0].average).toBe(6.5);
  });

  it('лучший и худший день недели', () => {
    let data = makeData([]);
    const mood = data.ratingScales[1].id;
    for (const day of eachDay('2026-10-01', '2026-10-31')) {
      // Субботы — 9, понедельники — 3, остальные — 6.
      const weekday = new Date(`${day}T12:00:00`).getDay();
      data = setRating(data, day, mood, weekday === 6 ? 9 : weekday === 1 ? 3 : 6);
    }
    const extremes = weekdayExtremes(data, mood, arcOf(data), '2026-10-31');
    expect(extremes?.best).toMatchObject({ weekday: 6, average: 9 });
    expect(extremes?.worst).toMatchObject({ weekday: 1, average: 3 });
  });
});

describe('связи с оценками', () => {
  it('привычка: в дни с тренировкой энергия выше', () => {
    let data = makeData([gym, run]);
    const energy = data.ratingScales[0].id;
    for (const day of eachDay('2026-10-01', '2026-10-20')) {
      const done = Number(day.slice(8)) % 2 === 0;
      if (done) data = setLog(data, 'gym', day, 1);
      data = setRating(data, day, energy, done ? 8 : 6);
    }
    const links = habitLinks(data, arcOf(data), '2026-10-21');
    const gymEnergy = links.find(
      (link) => link.subject.kind === 'habit' && link.subject.habit.id === 'gym',
    );
    expect(gymEnergy).toMatchObject({ withAverage: 8, withoutAverage: 6, difference: 2 });
    expect(gymEnergy?.withDays).toBe(10);
  });

  it('мало дней или маленькая разница — связи нет', () => {
    let data = makeData([gym]);
    const energy = data.ratingScales[0].id;
    for (const day of eachDay('2026-10-01', '2026-10-05')) {
      data = setLog(data, 'gym', day, 1);
      data = setRating(data, day, energy, 8);
    }
    expect(habitLinks(data, arcOf(data), '2026-10-20')).toEqual([]);
  });

  it('слова, которые всегда встречаются вместе, — одна связь', () => {
    let data = makeData([]);
    const mood = data.ratingScales[1].id;
    eachDay('2026-10-01', '2026-10-10').forEach((day, i) => {
      const walk = i % 2 === 0;
      data = setDayNote(data, day, walk ? 'Прогулка с друзьями' : 'Дома');
      data = setRating(data, day, mood, walk ? 8 : 5);
    });
    const links = wordLinks(data, arcOf(data), '2026-10-11');
    expect(links[0].subject).toEqual({ kind: 'word', words: ['прогулка', 'друзьями'] });
  });

  it('слова в заметках: разные формы одного слова вместе, служебные не считаются', () => {
    expect([
      ...noteWords('Устал, но тренировка была — и ещё тренировки! Лёг рано').values(),
    ]).toEqual(['устал', 'тренировка', 'лёг', 'рано']);

    let data = makeData([]);
    const mood = data.ratingScales[1].id;
    eachDay('2026-10-01', '2026-10-10').forEach((day, i) => {
      const tired = i % 2 === 0;
      data = setDayNote(data, day, tired ? 'Очень устал после работы' : 'Нормально, работа');
      data = setRating(data, day, mood, tired ? 4 : 7);
    });
    const links = wordLinks(data, arcOf(data), addDays('2026-10-10', 1));
    // «работа» есть во всех заметках — сравнивать не с чем; «нормально» — зеркальная связь.
    expect(links.map((link) => link.subject.kind === 'word' && link.subject.words)).toEqual([
      ['устал'],
      ['нормально'],
    ]);
    expect(links[0]).toMatchObject({
      withAverage: 4,
      withoutAverage: 7,
      difference: -3,
    });
  });
});
