import { describe, expect, it } from 'vitest';
import { getActiveArc } from './arc';
import {
  addWidget,
  defaultDashboard,
  moveWidget,
  removeWidget,
  resizeWidget,
  WIDGET_CATALOG,
  widgetInfo,
} from './dashboard';
import { averageRating, ratingSeries, setRating } from './days';
import { weekSummary } from './discipline';
import { habitHeatmap } from './heatmap';
import { setLog } from './progress';
import { makeData, makeHabit } from './testData';

let counter = 0;
const id = () => `w${++counter}`;

describe('раскладка виджетов', () => {
  const base = { ...makeData([]), dashboard: defaultDashboard(id) };

  it('набор по умолчанию: индекс и неделя рядом, сегодня и «зачем»', () => {
    expect(base.dashboard.map((w) => `${w.type}:${w.size}`)).toEqual([
      'discipline:half',
      'week:half',
      'today:full',
      'why:full',
    ]);
  });

  it('у каждого виджета из каталога есть описание', () => {
    for (const info of WIDGET_CATALOG) expect(info.description.length).toBeGreaterThan(10);
  });

  it('добавить и убрать', () => {
    const added = addWidget(base, { id: 'x', type: 'streak', size: 'half', habitId: 'h' });
    expect(added.dashboard.at(-1)?.id).toBe('x');
    expect(removeWidget(added, 'x').dashboard).toHaveLength(4);
  });

  it('переставить на место вверх и вниз, у краёв — без изменений', () => {
    const [a, b] = base.dashboard;
    expect(
      moveWidget(base, b.id, -1)
        .dashboard.slice(0, 2)
        .map((w) => w.id),
    ).toEqual([b.id, a.id]);
    expect(moveWidget(base, a.id, -1)).toBe(base);
    expect(moveWidget(base, base.dashboard.at(-1)!.id, 1)).toBe(base);
  });

  it('тепловая карта и задачи не бывают узкими', () => {
    expect(widgetInfo('heatmap').canBeHalf).toBe(false);
    const withHeatmap = addWidget(base, { id: 'h', type: 'heatmap', size: 'full', habitId: 'x' });
    expect(resizeWidget(withHeatmap, 'h', 'half').dashboard.at(-1)?.size).toBe('full');
    expect(resizeWidget(base, base.dashboard[2].id, 'half').dashboard[2].size).toBe('half');
  });
});

describe('неделя', () => {
  const check = makeHabit('check', { kind: 'check' });

  it('индекс недели, прошлая неделя и семь дней', () => {
    let data = makeData([check]);
    // Неделя 5–11 октября: пн, вт сделано; сегодня ср.
    data = setLog(data, 'check', '2026-10-05', 1);
    data = setLog(data, 'check', '2026-10-06', 1);
    const week = weekSummary(data, getActiveArc(data)!, '2026-10-07');
    expect(week.monday).toBe('2026-10-05');
    expect(week.days.map((d) => d.status)).toEqual([
      'past',
      'past',
      'today',
      'future',
      'future',
      'future',
      'future',
    ]);
    expect(week.days.map((d) => d.score)).toEqual([1, 1, 0, null, null, null, null]);
    // Сегодня ещё ничего не сделано — день идёт и в индекс пока не входит: (1 + 1) / 2.
    expect(week.index).toBe(100);
    // Прошлая неделя началась до арки (28 сен), считаются только чт–вс: 0.
    expect(week.previousIndex).toBe(0);
  });

  it('первая неделя арки: дни до старта без оценки', () => {
    const data = makeData([check]);
    const week = weekSummary(data, getActiveArc(data)!, '2026-10-01');
    expect(week.days.slice(0, 3).every((d) => d.score === null)).toBe(true);
    expect(week.previousIndex).toBeNull();
  });
});

describe('тепловая карта', () => {
  it('столбцы — недели, клетки — выполнение; будущее и выходные пустые', () => {
    const weekdays = makeHabit('study', {
      kind: 'count',
      unit: 'задач',
      dailyTarget: 4,
      schedule: { type: 'weekdays', days: [1, 2, 3, 4, 5] },
    });
    let data = makeData([weekdays]);
    data = setLog(data, 'study', '2026-10-01', 2);
    const weeks = habitHeatmap(weekdays, data.habitLogs, '2026-10-01', '2026-10-11', '2026-10-06');
    expect(weeks.map((w) => w.monday)).toEqual(['2026-09-28', '2026-10-05']);
    const first = weeks[0].days.map((d) => d.value);
    // пн–ср до арки, чт — половина цели, пт — 0, сб–вс не по плану.
    expect(first).toEqual([null, null, null, 0.5, 0, null, null]);
    // 7 октября и дальше — будущее.
    expect(weeks[1].days.slice(2).every((d) => d.value === null)).toBe(true);
  });
});

describe('ряды оценок', () => {
  it('оценки по дням и среднее без пропусков', () => {
    let data = makeData([]);
    const scale = data.ratingScales[0].id;
    data = setRating(data, '2026-10-01', scale, 6);
    data = setRating(data, '2026-10-03', scale, 9);
    const points = ratingSeries(data, scale, ['2026-10-01', '2026-10-02', '2026-10-03']);
    expect(points.map((p) => p.value)).toEqual([6, null, 9]);
    expect(averageRating(points)).toBe(7.5);
    expect(averageRating([])).toBeNull();
  });
});
