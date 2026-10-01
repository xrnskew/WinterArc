import { ChevronRight, Component } from 'lucide-react';
import { Link } from 'react-router';
import { MORE_ITEMS, PATHS, type NavItem } from '../../app/routes';
import { GlassCard } from '../../design/ui/GlassCard';
import { ScreenHeader } from '../../design/ui/ScreenHeader';

/** Витрина дизайн-системы видна только при разработке (npm run dev). */
const DEV_ITEMS: NavItem[] = import.meta.env.DEV
  ? [{ to: PATHS.kit, label: 'Витрина', icon: Component, hint: 'Дизайн-система для разработки' }]
  : [];

/** На телефоне сюда спрятаны экраны, которым не хватило места в нижнем баре. */
export function MoreScreen() {
  return (
    <>
      <ScreenHeader title="Ещё" />
      <GlassCard as="section" className="p-0">
        <ul className="divide-y divide-gray-800">
          {[...MORE_ITEMS, ...DEV_ITEMS].map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="flex items-center gap-4 px-4 py-3.5 transition-colors duration-(--wa-motion-fast) hover:bg-gray-800/60"
                >
                  <Icon size={22} strokeWidth={1.5} className="shrink-0 text-text" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-base text-text">{item.label}</span>
                    <span className="block text-sm text-muted">{item.hint}</span>
                  </span>
                  <ChevronRight size={18} className="shrink-0 text-gray-400" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      </GlassCard>
    </>
  );
}
