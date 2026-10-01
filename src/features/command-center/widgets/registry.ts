import type { ComponentType } from 'react';
import type { WidgetType } from '../../../domain/types';
import { DisciplineWidget } from './DisciplineWidget';
import { GoalWidget } from './GoalWidget';
import { HeatmapWidget } from './HeatmapWidget';
import { RatingTrendWidget } from './RatingTrendWidget';
import { StreakWidget } from './StreakWidget';
import { TasksWidget } from './TasksWidget';
import { TodayWidget } from './TodayWidget';
import { WeekWidget } from './WeekWidget';
import type { WidgetProps } from './WidgetFrame';
import { WhyWidget } from './WhyWidget';

/**
 * Какой компонент рисует виджет каждого типа.
 * Новый виджет: тип в domain/types.ts, описание в domain/dashboard.ts,
 * компонент в этой папке и строка здесь.
 */
export const WIDGET_COMPONENTS: Record<WidgetType, ComponentType<WidgetProps>> = {
  discipline: DisciplineWidget,
  today: TodayWidget,
  week: WeekWidget,
  streak: StreakWidget,
  ratingTrend: RatingTrendWidget,
  heatmap: HeatmapWidget,
  goal: GoalWidget,
  tasks: TasksWidget,
  why: WhyWidget,
};
