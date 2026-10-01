import type { AppData, Id, WidgetInstance, WidgetSize, WidgetType } from './types';

/**
 * Виджеты командного центра: какие бывают, набор по умолчанию
 * и изменения раскладки (добавить, убрать, переставить, сменить размер).
 */

/** К чему привязан виджет: к привычке, к шкале оценок, к цели или ни к чему. */
export type WidgetTarget = 'habit' | 'scale' | 'goal' | null;

export interface WidgetInfo {
  type: WidgetType;
  title: string;
  /** Одна фраза для каталога «Добавить виджет». */
  description: string;
  target: WidgetTarget;
  defaultSize: WidgetSize;
  /** Можно ли сделать виджет на пол-ширины. */
  canBeHalf: boolean;
}

/** Каталог виджетов в том порядке, в каком он показывается при добавлении. */
export const WIDGET_CATALOG: WidgetInfo[] = [
  {
    type: 'discipline',
    title: 'Индекс недели',
    description: 'Индекс дисциплины 0–100 за эту неделю и сравнение с прошлой.',
    target: null,
    defaultSize: 'half',
    canBeHalf: true,
  },
  {
    type: 'today',
    title: 'Сегодня',
    description: 'Привычки на сегодня: что уже отмечено, а что ещё нет.',
    target: null,
    defaultSize: 'full',
    canBeHalf: true,
  },
  {
    type: 'week',
    title: 'Неделя',
    description: 'Семь дней недели, каждый — со своим индексом.',
    target: null,
    defaultSize: 'half',
    canBeHalf: true,
  },
  {
    type: 'streak',
    title: 'Серия',
    description: 'Текущая и лучшая серия одной привычки.',
    target: 'habit',
    defaultSize: 'half',
    canBeHalf: true,
  },
  {
    type: 'ratingTrend',
    title: 'Оценка',
    description: 'Как менялась одна из оценок дня за две недели.',
    target: 'scale',
    defaultSize: 'half',
    canBeHalf: true,
  },
  {
    type: 'heatmap',
    title: 'Тепловая карта',
    description: 'Вся арка одной привычки клетками, как на GitHub.',
    target: 'habit',
    defaultSize: 'full',
    canBeHalf: false,
  },
  {
    type: 'goal',
    title: 'Цель',
    description: 'Прогресс одной цели.',
    target: 'goal',
    defaultSize: 'full',
    canBeHalf: true,
  },
  {
    type: 'tasks',
    title: 'Задачи',
    description: 'Ближайшие и просроченные задачи.',
    target: null,
    defaultSize: 'full',
    canBeHalf: false,
  },
  {
    type: 'why',
    title: 'Зачем',
    description: 'Твои слова о том, ради чего эта арка.',
    target: null,
    defaultSize: 'full',
    canBeHalf: false,
  },
];

export function widgetInfo(type: WidgetType): WidgetInfo {
  const info = WIDGET_CATALOG.find((item) => item.type === type);
  if (!info) throw new Error(`Неизвестный виджет: ${type}`);
  return info;
}

/** Набор для нового пользователя: индекс и неделя рядом, ниже — сегодня и «зачем». */
export function defaultDashboard(newId: () => Id): WidgetInstance[] {
  return [
    { id: newId(), type: 'discipline', size: 'half' },
    { id: newId(), type: 'week', size: 'half' },
    { id: newId(), type: 'today', size: 'full' },
    { id: newId(), type: 'why', size: 'full' },
  ];
}

// ── Изменения раскладки ──────────────────────────────────

export function addWidget(data: AppData, widget: WidgetInstance): AppData {
  return { ...data, dashboard: [...data.dashboard, widget] };
}

export function removeWidget(data: AppData, widgetId: Id): AppData {
  return { ...data, dashboard: data.dashboard.filter((widget) => widget.id !== widgetId) };
}

/** Сдвинуть виджет на одно место вверх (-1) или вниз (+1). У краёв ничего не меняется. */
export function moveWidget(data: AppData, widgetId: Id, step: -1 | 1): AppData {
  const index = data.dashboard.findIndex((widget) => widget.id === widgetId);
  const target = index + step;
  if (index < 0 || target < 0 || target >= data.dashboard.length) return data;
  const dashboard = [...data.dashboard];
  [dashboard[index], dashboard[target]] = [dashboard[target], dashboard[index]];
  return { ...data, dashboard };
}

/** Сменить размер. Виджет, который не бывает узким, остаётся во всю ширину. */
export function resizeWidget(data: AppData, widgetId: Id, size: WidgetSize): AppData {
  return {
    ...data,
    dashboard: data.dashboard.map((widget) =>
      widget.id === widgetId
        ? { ...widget, size: widgetInfo(widget.type).canBeHalf ? size : 'full' }
        : widget,
    ),
  };
}
