import { describe, expect, it } from 'vitest';
import { createEmptyData } from '../storage/schema';
import {
  archiveActiveArc,
  arcDayNumber,
  arcDays,
  arcLength,
  arcPhase,
  arcProgress,
  daysUntilEnd,
  daysUntilStart,
  defaultArcDraft,
  getActiveArc,
  getArchivedArcs,
  startArc,
  updateArc,
  validateArcDraft,
  type ArcDraft,
} from './arc';
import { hasErrors } from '../lib/hasErrors';
import { EMPTY_HABIT_DRAFT, habitFromDraft } from './habits';

const winter = { startDate: '2026-10-01', endDate: '2026-12-31' };
const NOW = '2026-10-01T08:00:00.000Z';

let counter = 0;
const fakeId = () => `id-${++counter}`;

describe('расчёты арки', () => {
  it('1 октября – 31 декабря — 92 дня', () => {
    expect(arcLength(winter)).toBe(92);
  });

  it('фаза: до начала, идёт, закончилась', () => {
    expect(arcPhase(winter, '2026-09-30')).toBe('upcoming');
    expect(arcPhase(winter, '2026-10-01')).toBe('active');
    expect(arcPhase(winter, '2026-12-31')).toBe('active');
    expect(arcPhase(winter, '2027-01-01')).toBe('finished');
  });

  it('номер дня ограничен рамками арки', () => {
    expect(arcDayNumber(winter, '2026-10-01')).toBe(1);
    expect(arcDayNumber(winter, '2026-11-09')).toBe(40);
    expect(arcDayNumber(winter, '2026-09-01')).toBe(0);
    expect(arcDayNumber(winter, '2027-02-01')).toBe(92);
  });

  it('дни до конца не считают сегодняшний', () => {
    expect(daysUntilEnd(winter, '2026-10-01')).toBe(91);
    expect(daysUntilEnd(winter, '2026-12-31')).toBe(0);
    expect(daysUntilEnd(winter, '2027-01-05')).toBe(0);
  });

  it('дни до начала', () => {
    expect(daysUntilStart(winter, '2026-09-25')).toBe(6);
    expect(daysUntilStart(winter, '2026-10-02')).toBe(0);
  });

  it('прогресс: 0 в первый день, 1 после конца', () => {
    expect(arcProgress(winter, '2026-10-01')).toBe(0);
    expect(arcProgress(winter, '2026-11-16')).toBeCloseTo(0.5);
    expect(arcProgress(winter, '2027-01-01')).toBe(1);
    expect(arcProgress(winter, '2026-09-01')).toBe(0);
  });

  it('лента дней: прошедшие, сегодня, будущие', () => {
    const days = arcDays(winter, '2026-10-03');
    expect(days).toHaveLength(92);
    expect(days.slice(0, 4).map((d) => d.status)).toEqual(['past', 'past', 'today', 'future']);
    expect(days[0]).toMatchObject({ date: '2026-10-01', weekday: 4 });
  });
});

describe('арка по умолчанию', () => {
  it('1 октября — с сегодня до 31 декабря', () => {
    expect(defaultArcDraft('2026-10-01')).toMatchObject({
      name: 'Winter Arc 2026',
      startDate: '2026-10-01',
      endDate: '2026-12-31',
    });
  });

  it('в середине сезона — начинаем сегодня', () => {
    expect(defaultArcDraft('2026-11-15')).toMatchObject({
      startDate: '2026-11-15',
      endDate: '2026-12-31',
    });
  });

  it('до сезона — ближайшие 1 октября – 31 декабря', () => {
    expect(defaultArcDraft('2026-03-10')).toMatchObject({
      startDate: '2026-10-01',
      endDate: '2026-12-31',
    });
  });

  it('в конце декабря — хотя бы неделя', () => {
    const draft = defaultArcDraft('2026-12-29');
    expect(draft.startDate).toBe('2026-12-29');
    expect(arcLength(draft)).toBe(7);
    expect(hasErrors(validateArcDraft(draft))).toBe(false);
  });
});

describe('проверка формы арки', () => {
  const valid: ArcDraft = { name: 'Winter Arc 2026', why: '', ...winter };

  it('правильная форма — без ошибок', () => {
    expect(validateArcDraft(valid)).toEqual({});
  });

  it('нужно название', () => {
    expect(validateArcDraft({ ...valid, name: '   ' }).name).toBeDefined();
  });

  it('конец раньше начала или слишком короткая арка — ошибка дат', () => {
    expect(validateArcDraft({ ...valid, endDate: '2026-09-01' }).dates).toBeDefined();
    expect(validateArcDraft({ ...valid, endDate: '2026-10-03' }).dates).toBeDefined();
  });

  it('длиннее года — ошибка', () => {
    expect(validateArcDraft({ ...valid, endDate: '2028-01-01' }).dates).toBeDefined();
  });

  it('пустые даты — ошибка, а не падение', () => {
    expect(validateArcDraft({ ...valid, startDate: '' }).dates).toBeDefined();
  });
});

describe('изменения данных', () => {
  const draft: ArcDraft = { name: '  Winter Arc 2026 ', why: ' Стать сильнее ', ...winter };
  const reading = habitFromDraft(
    { ...EMPTY_HABIT_DRAFT, name: 'Чтение', kind: 'count', unit: 'страниц', dailyTarget: 20 },
    'habit-reading',
    NOW,
    winter.startDate,
  );

  it('startArc создаёт арку, добавляет привычки и делает арку текущей', () => {
    const empty = createEmptyData(fakeId);
    const data = startArc(empty, { draft, newHabits: [reading], keptHabitIds: [] }, 'arc-1', NOW);

    const arc = getActiveArc(data);
    expect(arc).toMatchObject({
      id: 'arc-1',
      name: 'Winter Arc 2026',
      why: 'Стать сильнее',
      habitIds: ['habit-reading'],
      archivedAt: null,
    });
    expect(data.habits).toHaveLength(1);
    expect(empty.arcs).toHaveLength(0); // исходные данные не изменились
  });

  it('archiveActiveArc уносит арку в историю, привычки остаются', () => {
    const started = startArc(
      createEmptyData(fakeId),
      { draft, newHabits: [reading], keptHabitIds: [] },
      'arc-1',
      NOW,
    );
    const archived = archiveActiveArc(started, '2027-01-01T10:00:00.000Z');

    expect(archived.activeArcId).toBeNull();
    expect(getArchivedArcs(archived).map((arc) => arc.id)).toEqual(['arc-1']);
    expect(archived.habits).toHaveLength(1);
  });

  it('новая арка может взять привычки прошлой', () => {
    const first = startArc(
      createEmptyData(fakeId),
      { draft, newHabits: [reading], keptHabitIds: [] },
      'arc-1',
      NOW,
    );
    const archived = archiveActiveArc(first, NOW);
    const next = startArc(
      archived,
      { draft: { ...draft, name: 'Spring Arc' }, newHabits: [], keptHabitIds: ['habit-reading'] },
      'arc-2',
      NOW,
    );
    expect(getActiveArc(next)?.habitIds).toEqual(['habit-reading']);
    expect(next.habits).toHaveLength(1); // привычка не задвоилась
  });

  it('updateArc меняет только нужную арку', () => {
    const data = startArc(
      createEmptyData(fakeId),
      { draft, newHabits: [], keptHabitIds: [] },
      'arc-1',
      NOW,
    );
    const updated = updateArc(data, 'arc-1', { ...draft, name: 'Новая', endDate: '2027-01-31' });
    expect(getActiveArc(updated)).toMatchObject({ name: 'Новая', endDate: '2027-01-31' });
  });
});
