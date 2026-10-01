import { X } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'react-router';
import { PATHS } from '../../app/routes';
import { allAchievements } from '../../domain/achievements';
import type { DateKey } from '../../domain/types';
import { IceToken } from '../../design/ui/IceToken';
import { useAppStore } from '../../store/useAppStore';

/** Сколько висит сообщение. */
const VISIBLE_MS = 6000;

/** Всплывающее сообщение «Новый жетон» над нижней навигацией. */
export function AchievementToast({ today }: { today: DateKey }) {
  const fresh = useAppStore((state) => state.freshAchievements);
  const data = useAppStore((state) => state.data);
  const dismiss = useAppStore((state) => state.dismissFreshAchievements);

  useEffect(() => {
    if (fresh.length === 0) return;
    const timer = window.setTimeout(dismiss, VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [fresh, dismiss]);

  if (fresh.length === 0) return null;
  const first = allAchievements(data, today).find((item) => item.id === fresh[0]);
  const many = fresh.length > 1;

  return (
    <div
      role="status"
      // На десктопе — по центру области контента, правее боковой панели.
      className="fixed inset-x-4 bottom-(--wa-nav-clearance) z-40 mx-auto max-w-sm md:bottom-6 md:left-26 lg:left-64"
    >
      <div className="flex items-center gap-3 rounded-lg border border-glass-border bg-graphite p-3 shadow-glow">
        {first && <IceToken badge={first.badge} tier={first.tier} earned size={44} />}
        <Link to={PATHS.achievements} onClick={dismiss} className="min-w-0 flex-1">
          <span className="block text-xs text-muted">
            {many ? `Новые жетоны: ${fresh.length}` : 'Новый жетон'}
          </span>
          <span className="block truncate text-base text-text">
            {first ? first.title : 'Ледяной жетон'}
            {first?.subject && <span className="text-muted">, {first.subject}</span>}
          </span>
        </Link>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Закрыть"
          className="flex size-10 shrink-0 items-center justify-center rounded-md text-muted hover:text-text"
        >
          <X size={18} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
