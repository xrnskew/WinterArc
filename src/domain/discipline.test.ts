import { describe, expect, it } from 'vitest';
import { arcDayMarks, dayScore, habitWeekScore, toIndex, weekScore } from './discipline';
import { getActiveArc } from './arc';
import { setLog } from './progress';
import { makeData, makeHabit } from './testData';

const check = makeHabit('check', { kind: 'check' });
const reading = makeHabit('reading', { kind: 'count', unit: 'страниц', dailyTarget: 20 });
const gym = makeHabit('gym', { kind: 'check', schedule: { type: 'timesPerWeek', times: 4 } });
const habits = [check, reading, gym];

describe('индекс дисциплины', () => {
  it('индекс дня — среднее по запланированным, гибкие не входят', () => {
    let data = makeData(habits);
    data = setLog(data, 'check', '2026-10-01', 1);
    data = setLog(data, 'reading', '2026-10-01', 10);
    data = setLog(data, 'gym', '2026-10-01', 1);
    // check 1, reading 0.5; gym гибкая — не входит → 1.5 / 2
    expect(dayScore(habits, data, '2026-10-01')).toBeCloseTo(0.75);
    expect(toIndex(dayScore(habits, data, '2026-10-01'))).toBe(75);
  });

  it('ничего не отмечено — индекс 0, а не «нет данных»', () => {
    expect(dayScore([check, reading], makeData([check, reading]), '2026-10-02')).toBe(0);
  });

  it('до создания привычки дней нет', () => {
    expect(dayScore([check], makeData([check]), '2026-09-30')).toBeNull();
  });

  it('гибкая привычка в текущей неделе: цель пропорциональна прошедшим дням', () => {
    // Неделя 5–11 октября, сегодня среда (3 дня из 7), цель 4 раза → ожидаем ~1.7.
    let data = makeData([gym]);
    data = setLog(data, 'gym', '2026-10-05', 1);
    data = setLog(data, 'gym', '2026-10-06', 1);
    expect(habitWeekScore(gym, data, '2026-10-05', '2026-10-07')).toBe(1);
    // Неделя закончилась (сегодня уже 12-е): 2 из 4 — половина.
    expect(habitWeekScore(gym, data, '2026-10-05', '2026-10-11', '2026-10-12')).toBe(0.5);
  });

  it('сегодняшний день, пока ничего не сделано, индекс недели не тянет вниз', () => {
    let data = makeData([check]);
    data = setLog(data, 'check', '2026-10-05', 1);
    // Вторник: понедельник сделан, вторник ещё нет — индекс 1, а не 0,5.
    expect(habitWeekScore(check, data, '2026-10-05', '2026-10-06')).toBe(1);
    // Понедельник утром: ничего не сделано — считать нечего.
    expect(habitWeekScore(check, makeData([check]), '2026-10-05', '2026-10-05')).toBeNull();
  });

  it('индекс недели — у каждой привычки равный вес', () => {
    let data = makeData([check, gym]);
    for (const day of [
      '2026-10-05',
      '2026-10-06',
      '2026-10-07',
      '2026-10-08',
      '2026-10-09',
      '2026-10-10',
      '2026-10-11',
    ]) {
      data = setLog(data, 'check', day, 1);
    }
    // check — 1, gym — 0 из 4 → 0.5
    expect(weekScore([check, gym], data, '2026-10-05', '2026-10-11')).toBe(0.5);
  });

  it('зарубки: индекс прошлых дней, будущее без оценки', () => {
    let data = makeData([check, reading]);
    data = setLog(data, 'check', '2026-10-01', 1);
    data = setLog(data, 'reading', '2026-10-01', 20);
    const marks = arcDayMarks(data, getActiveArc(data)!, '2026-10-03');
    expect(marks[0]).toMatchObject({ status: 'past', score: 1 });
    expect(marks[1]).toMatchObject({ status: 'past', score: 0 });
    expect(marks[2].status).toBe('today');
    expect(marks[3]).toMatchObject({ status: 'future', score: null });
    expect(marks[0]).not.toHaveProperty('relapse');
  });
});
