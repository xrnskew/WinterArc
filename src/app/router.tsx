import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';
import { AchievementsScreen } from '../features/achievements/AchievementsScreen';
import { AnalyticsScreen } from '../features/analytics/AnalyticsScreen';
import { CheckinScreen } from '../features/checkin/CheckinScreen';
import { CommandCenterScreen } from '../features/command-center/CommandCenterScreen';
import { GoalsScreen } from '../features/goals/GoalsScreen';
import { HabitsScreen } from '../features/habits/HabitsScreen';
import { KitScreen } from '../features/kit/KitScreen';
import { MoreScreen } from '../features/more/MoreScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { WeeklyReviewScreen } from '../features/weekly-review/WeeklyReviewScreen';
import { AppShell } from './AppShell';
import { PATHS } from './routes';

/** Витрина дизайн-системы — только при разработке, в сборку не попадает. */
const devRoutes: RouteObject[] = import.meta.env.DEV
  ? [{ path: PATHS.kit, element: <KitScreen /> }]
  : [];

/** Все экраны приложения. Каждый рисуется внутри AppShell на месте <Outlet />. */
export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: PATHS.center, element: <CommandCenterScreen /> },
      { path: PATHS.checkin, element: <CheckinScreen /> },
      { path: PATHS.habits, element: <HabitsScreen /> },
      { path: PATHS.goals, element: <GoalsScreen /> },
      { path: PATHS.more, element: <MoreScreen /> },
      { path: PATHS.analytics, element: <AnalyticsScreen /> },
      { path: PATHS.review, element: <WeeklyReviewScreen /> },
      { path: PATHS.achievements, element: <AchievementsScreen /> },
      { path: PATHS.settings, element: <SettingsScreen /> },
      ...devRoutes,
      // Неизвестный адрес — на главный экран.
      { path: '*', element: <Navigate to={PATHS.center} replace /> },
    ],
  },
]);
