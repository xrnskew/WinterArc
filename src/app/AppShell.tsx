import { Outlet, ScrollRestoration } from 'react-router';
import { SnowBackground } from '../background/SnowBackground';
import { THEMES } from '../design/themes';
import { AchievementToast } from '../features/achievements/AchievementToast';
import { OnboardingScreen } from '../features/onboarding/OnboardingScreen';
import { useAchievementUnlocks } from '../hooks/useAchievementUnlocks';
import { useToday } from '../hooks/useToday';
import { cx } from '../lib/cx';
import { useAppStore } from '../store/useAppStore';
import { Navigation } from './Navigation';
import { NewerDataScreen, StorageNotice } from './StorageNotice';

/**
 * Оболочка всех экранов: метель позади, навигация, контент экрана.
 * Пока нет текущей арки, вместо экранов показывается онбординг.
 */
export function AppShell() {
  const { snow, performance, themeId } = useAppStore((state) => state.data.settings);
  const hasArc = useAppStore((state) => state.data.activeArcId !== null);
  const notice = useAppStore((state) => state.notice);
  const today = useToday();
  useAchievementUnlocks(today);

  const background = (
    <SnowBackground intensity={snow} performance={performance} theme={THEMES[themeId]} />
  );

  if (notice.kind === 'newer') {
    return (
      <>
        {background}
        <main className="relative z-10">
          <NewerDataScreen version={notice.version} />
        </main>
      </>
    );
  }

  return (
    <>
      {background}
      {hasArc && <Navigation />}
      <main
        className={cx(
          'relative z-10 min-h-dvh',
          // Снизу — место под нижний бар навигации (на десктопе бара нет).
          hasArc && 'pb-(--wa-nav-clearance) md:pb-12 md:pl-22',
        )}
      >
        <div className="mx-auto w-full max-w-xl px-4 pt-[calc(1.5rem+env(safe-area-inset-top))] md:max-w-3xl md:px-8 md:pt-10">
          <StorageNotice />
          {hasArc ? <Outlet /> : <OnboardingScreen />}
        </div>
      </main>
      {hasArc && <AchievementToast today={today} />}
      <ScrollRestoration />
    </>
  );
}
