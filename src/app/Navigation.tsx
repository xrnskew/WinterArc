import { NavLink, useLocation } from 'react-router';
import { cx } from '../lib/cx';
import { DESKTOP_RAIL, MOBILE_BAR, MORE_ITEMS, PATHS, type NavItem } from './routes';

/** Телефон — нижний бар, десктоп (от 768px) — узкая боковая панель. */
export function Navigation() {
  return (
    <>
      <MobileBar />
      <DesktopRail />
    </>
  );
}

function MobileBar() {
  const { pathname } = useLocation();
  // «Ещё» подсвечиваем и на экранах, которые в нём спрятаны.
  const insideMore = MORE_ITEMS.some((item) => pathname.startsWith(item.to));

  return (
    <nav
      aria-label="Основная навигация"
      className="glass fixed inset-x-0 bottom-0 z-20 rounded-none border-x-0 border-b-0 pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-xl grid-cols-5">
        {MOBILE_BAR.left.map((item) => (
          <li key={item.to}>
            <BarLink item={item} />
          </li>
        ))}
        <li>
          <CheckinButton />
        </li>
        {MOBILE_BAR.right.map((item) => (
          <li key={item.to}>
            <BarLink item={item} forceActive={item.to === PATHS.more && insideMore} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function BarLink({ item, forceActive = false }: { item: NavItem; forceActive?: boolean }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.to === PATHS.center}
      className={({ isActive }) =>
        cx(
          'relative flex h-full flex-col items-center justify-center gap-1 text-xs',
          'transition-colors duration-(--wa-motion-fast)',
          isActive || forceActive ? 'text-number' : 'text-muted hover:text-text',
        )
      }
    >
      {({ isActive }) => (
        <>
          {(isActive || forceActive) && (
            <span className="absolute top-0 h-0.5 w-6 bg-number shadow-glow" aria-hidden="true" />
          )}
          <Icon size={22} strokeWidth={1.5} aria-hidden="true" />
          {item.label}
        </>
      )}
    </NavLink>
  );
}

/**
 * Крупная центральная кнопка: главный ежедневный ритуал.
 * Квадрат приподнят над баром, а подпись стоит на одной линии с соседними.
 */
function CheckinButton() {
  const Icon = MOBILE_BAR.checkin.icon;
  return (
    <NavLink
      to={MOBILE_BAR.checkin.to}
      className="relative flex h-full flex-col items-center justify-center gap-1 text-xs text-text"
    >
      {({ isActive }) => (
        <>
          <span
            className={cx(
              'absolute -top-5 left-1/2 flex size-13 -translate-x-1/2 items-center justify-center rounded-md bg-number text-night',
              'transition-shadow duration-(--wa-motion-base)',
              isActive ? 'shadow-glow-strong' : 'shadow-glow',
            )}
          >
            <Icon size={26} strokeWidth={2} aria-hidden="true" />
          </span>
          {/* Пустое место размером с иконку соседей — чтобы подписи стояли ровно. */}
          <span className="size-5.5" aria-hidden="true" />
          {MOBILE_BAR.checkin.label}
        </>
      )}
    </NavLink>
  );
}

function DesktopRail() {
  return (
    <nav
      aria-label="Основная навигация"
      className="glass fixed inset-y-0 left-0 z-20 hidden w-22 rounded-none border-y-0 border-l-0 md:block"
    >
      <ul className="flex flex-col items-stretch gap-1 px-2 pt-8">
        {DESKTOP_RAIL.map((item) => {
          const Icon = item.icon;
          const isCheckin = item.to === PATHS.checkin;
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === PATHS.center}
                className={({ isActive }) =>
                  cx(
                    'flex flex-col items-center gap-1 rounded-md px-1 py-2.5 text-center text-xs leading-tight',
                    'transition-colors duration-(--wa-motion-fast)',
                    isActive ? 'bg-gray-800 text-number' : 'text-muted hover:text-text',
                    isCheckin && !isActive && 'text-text',
                  )
                }
              >
                <Icon size={22} strokeWidth={isCheckin ? 2 : 1.5} aria-hidden="true" />
                {item.label}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
