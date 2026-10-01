import { NavLink, useLocation } from 'react-router';
import { cx } from '../lib/cx';
import { MOBILE_BAR, MORE_ITEMS, PATHS, SIDEBAR, type NavItem } from './routes';

/**
 * Телефон — нижний бар. От 768px — боковая панель слева:
 * узкая (иконки с подписями под ними), а от 1024px — широкая, с названием
 * приложения и подписями рядом с иконками.
 */
export function Navigation() {
  return (
    <>
      <MobileBar />
      <Sidebar />
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
      <ul className="mx-auto grid h-(--wa-nav-height) max-w-xl grid-cols-5">
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
              'absolute -top-(--wa-nav-raise) left-1/2 flex size-13 -translate-x-1/2 items-center justify-center rounded-md bg-number text-night',
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

function Sidebar() {
  return (
    <nav
      aria-label="Основная навигация"
      className="glass fixed inset-y-0 left-0 z-20 hidden w-22 flex-col rounded-none border-y-0 border-l-0 px-2 pt-8 pb-6 md:flex lg:w-60 lg:px-4"
    >
      <p className="screen-title mb-6 hidden px-3 text-xl text-number lg:block">Winter Arc</p>
      <SidebarCheckin />
      <ul className="mt-4 flex flex-col gap-1">
        {SIDEBAR.main.map((item) => (
          <li key={item.to}>
            <SidebarLink item={item} />
          </li>
        ))}
      </ul>
      <ul className="mt-auto flex flex-col gap-1 border-t border-gray-800 pt-4">
        {SIDEBAR.bottom.map((item) => (
          <li key={item.to}>
            <SidebarLink item={item} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Пункт панели: в узкой — иконка над подписью, в широкой — рядом. */
function SidebarLink({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.to === PATHS.center}
      className={({ isActive }) =>
        cx(
          'relative flex flex-col items-center gap-1 rounded-md px-1 py-2.5 text-center text-xs leading-tight',
          'lg:flex-row lg:gap-3 lg:px-3 lg:text-left lg:text-base',
          'transition-colors duration-(--wa-motion-fast)',
          isActive ? 'bg-gray-800 text-number' : 'text-muted hover:text-text',
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Метка текущего экрана — как светящаяся черта в нижнем баре, только слева. */}
          {isActive && (
            <span
              className="absolute inset-y-2 -left-2 w-0.5 bg-number shadow-glow lg:-left-4"
              aria-hidden="true"
            />
          )}
          <Icon size={22} strokeWidth={1.5} className="shrink-0" aria-hidden="true" />
          {item.label}
        </>
      )}
    </NavLink>
  );
}

/** Чек-ин в панели — белая кнопка, как приподнятый квадрат в нижнем баре. */
function SidebarCheckin() {
  const Icon = SIDEBAR.checkin.icon;
  return (
    <NavLink
      to={SIDEBAR.checkin.to}
      className={({ isActive }) =>
        cx(
          'flex flex-col items-center gap-1 rounded-md bg-number px-1 py-2.5 text-xs leading-tight font-medium text-night',
          'lg:flex-row lg:gap-3 lg:px-3 lg:py-3 lg:text-base',
          'transition-shadow duration-(--wa-motion-base)',
          isActive ? 'shadow-glow-strong' : 'shadow-glow hover:shadow-glow-strong',
        )
      }
    >
      <Icon size={22} strokeWidth={2} className="shrink-0" aria-hidden="true" />
      {SIDEBAR.checkin.label}
    </NavLink>
  );
}
