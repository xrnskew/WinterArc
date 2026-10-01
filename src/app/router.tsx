import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';
import { CheckinScreen } from '../features/checkin/CheckinScreen';
import { CommandCenterScreen } from '../features/command-center/CommandCenterScreen';
import { HabitsScreen } from '../features/habits/HabitsScreen';
import { AppShell } from './AppShell';
import { LoadingScreen } from './LoadingScreen';
import { PATHS } from './routes';

/*
 * Главный экран, чек-ин и список привычек входят в стартовый файл — они нужны
 * каждый день. Остальные экраны грузятся отдельными файлами при первом открытии
 * (`lazy`): так приложение стартует быстрее. Без сети они всё равно открываются —
 * все файлы заранее лежат в кэше PWA.
 */

/**
 * Настройки маршрута для оболочки. wide — экран занимает всю ширину десктопа
 * (командный центр, аналитика); остальные — колонкой удобной для чтения ширины.
 */
export interface RouteHandle {
  wide?: boolean;
}

const WIDE: RouteHandle = { wide: true };

/** Витрина дизайн-системы — только при разработке, в сборку не попадает. */
const devRoutes: RouteObject[] = import.meta.env.DEV
  ? [
      {
        path: PATHS.kit,
        lazy: async () => ({ Component: (await import('../features/kit/KitScreen')).KitScreen }),
      },
    ]
  : [];

/** Все экраны приложения. Каждый рисуется внутри AppShell на месте <Outlet />. */
export const router = createBrowserRouter([
  {
    element: <AppShell />,
    HydrateFallback: LoadingScreen,
    children: [
      { path: PATHS.center, element: <CommandCenterScreen />, handle: WIDE },
      { path: PATHS.checkin, element: <CheckinScreen /> },
      { path: PATHS.habits, element: <HabitsScreen /> },
      {
        path: `${PATHS.habits}/:habitId`,
        lazy: async () => ({
          Component: (await import('../features/habits/HabitDetailScreen')).HabitDetailScreen,
        }),
      },
      {
        path: PATHS.goals,
        lazy: async () => ({
          Component: (await import('../features/goals/GoalsScreen')).GoalsScreen,
        }),
      },
      {
        path: `${PATHS.goals}/:goalId`,
        lazy: async () => ({
          Component: (await import('../features/goals/GoalDetailScreen')).GoalDetailScreen,
        }),
      },
      {
        path: PATHS.more,
        lazy: async () => ({
          Component: (await import('../features/more/MoreScreen')).MoreScreen,
        }),
      },
      {
        path: PATHS.analytics,
        handle: WIDE,
        lazy: async () => ({
          Component: (await import('../features/analytics/AnalyticsScreen')).AnalyticsScreen,
        }),
      },
      {
        path: PATHS.review,
        lazy: async () => ({
          Component: (await import('../features/weekly-review/WeeklyReviewScreen'))
            .WeeklyReviewScreen,
        }),
      },
      {
        path: PATHS.achievements,
        lazy: async () => ({
          Component: (await import('../features/achievements/AchievementsScreen'))
            .AchievementsScreen,
        }),
      },
      {
        path: PATHS.settings,
        lazy: async () => ({
          Component: (await import('../features/settings/SettingsScreen')).SettingsScreen,
        }),
      },
      ...devRoutes,
      // Неизвестный адрес — на главный экран.
      { path: '*', element: <Navigate to={PATHS.center} replace /> },
    ],
  },
]);
