import { Outlet, ScrollRestoration } from 'react-router';
import { SnowBackground } from '../background/SnowBackground';
import { THEMES } from '../design/themes';
import { OnboardingScreen } from '../features/onboarding/OnboardingScreen';
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
          hasArc && 'pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-12 md:pl-22',
        )}
      >
        <div className="mx-auto w-full max-w-xl px-4 pt-[calc(1.5rem+env(safe-area-inset-top))] md:max-w-3xl md:px-8 md:pt-10">
          <StorageNotice />
          {hasArc ? <Outlet /> : <OnboardingScreen />}
        </div>
      </main>
      <ScrollRestoration />
    </>
  );
}
