import { Outlet, ScrollRestoration } from 'react-router';
import { SnowBackground } from '../background/SnowBackground';
import { THEMES } from '../design/themes';
import { useAppStore } from '../store/useAppStore';
import { Navigation } from './Navigation';

/** Оболочка всех экранов: метель позади, навигация, контент экрана. */
export function AppShell() {
  const { snow, performance, themeId } = useAppStore((state) => state.settings);

  return (
    <>
      <SnowBackground intensity={snow} performance={performance} theme={THEMES[themeId]} />
      <Navigation />
      <main className="relative z-10 min-h-dvh pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-12 md:pl-22">
        <div className="mx-auto w-full max-w-xl px-4 pt-[calc(1.5rem+env(safe-area-inset-top))] md:max-w-3xl md:px-8 md:pt-10">
          <Outlet />
        </div>
      </main>
      <ScrollRestoration />
    </>
  );
}
