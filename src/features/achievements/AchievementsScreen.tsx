import {
  allAchievements,
  GROUP_TITLES,
  isEarned,
  unlockedAt,
  type Achievement,
  type AchievementGroup,
} from '../../domain/achievements';
import { formatDayMonth, toDateKey } from '../../domain/dates';
import type { AppData } from '../../domain/types';
import { GlassCard } from '../../design/ui/GlassCard';
import { IceToken } from '../../design/ui/IceToken';
import { ScreenHeader } from '../../design/ui/ScreenHeader';
import { useToday } from '../../hooks/useToday';
import { formatNumber } from '../../lib/formatNumber';
import { plural } from '../../lib/plural';
import { useAppStore } from '../../store/useAppStore';

const GROUP_ORDER: AchievementGroup[] = [
  'streak',
  'total',
  'discipline',
  'goals',
  'reviews',
  'arc',
];

/** Получен: записан в данных или уже заработан (запишется через мгновение). */
function earnedOf(achievement: Achievement, data: AppData): boolean {
  return unlockedAt(data, achievement.id) !== null || isEarned(achievement);
}

/** Ледяные жетоны: полученные и те, к которым идёшь, с прогрессом. */
export function AchievementsScreen() {
  const today = useToday();
  const data = useAppStore((state) => state.data);
  const items = allAchievements(data, today);
  const earned = items.filter((item) => earnedOf(item, data)).length;

  return (
    <>
      <ScreenHeader
        title="Достижения"
        description={`${earned} из ${items.length} ${plural(items.length, 'жетона', 'жетонов', 'жетонов')}`}
      />

      <div className="flex flex-col gap-4">
        {GROUP_ORDER.map((group) => {
          const groupItems = items.filter((item) => item.group === group);
          if (groupItems.length === 0) return null;
          // Серии и рубежи — по привычкам; остальное — одним списком.
          const subjects = [...new Set(groupItems.map((item) => item.subject))];
          return (
            <GlassCard key={group} as="section" aria-label={GROUP_TITLES[group]} className="p-4">
              <h2 className="text-base text-text">{GROUP_TITLES[group]}</h2>
              {subjects.map((subject) => (
                <div key={subject ?? 'all'} className="mt-3">
                  {subject && group !== 'arc' && (
                    <h3 className="mb-1 text-sm text-muted">{subject}</h3>
                  )}
                  <ul className="grid grid-cols-3 gap-x-2 gap-y-4">
                    {groupItems
                      .filter((item) => item.subject === subject)
                      .map((item) => (
                        <AchievementItem key={item.id} item={item} data={data} />
                      ))}
                  </ul>
                </div>
              ))}
            </GlassCard>
          );
        })}
      </div>
    </>
  );
}

function AchievementItem({ item, data }: { item: Achievement; data: AppData }) {
  const earned = earnedOf(item, data);
  const at = unlockedAt(data, item.id);
  let status: string;
  if (at) status = `получен ${formatDayMonth(toDateKey(new Date(at)))}`;
  else if (earned) status = 'получен сегодня';
  else
    status = `${formatNumber(Math.min(item.current, item.target))} из ${formatNumber(item.target)}`;

  return (
    <li className="flex flex-col items-center text-center">
      <IceToken badge={item.badge} tier={item.tier} earned={earned} />
      <span className={`mt-1.5 text-sm leading-tight ${earned ? 'text-text' : 'text-muted'}`}>
        {item.title}
      </span>
      <span className="mt-0.5 text-xs text-muted">
        {status}
        <span className="sr-only">{earned ? ', получен' : ', ещё не получен'}</span>
      </span>
    </li>
  );
}
