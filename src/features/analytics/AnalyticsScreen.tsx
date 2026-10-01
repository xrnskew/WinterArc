import { useSearchParams } from 'react-router';
import { getActiveArc } from '../../domain/arc';
import { daysBetween, formatDayMonth, formatRange } from '../../domain/dates';
import { EmptyState } from '../../design/ui/EmptyState';
import { ScreenHeader } from '../../design/ui/ScreenHeader';
import { Segmented } from '../../design/ui/Segmented';
import { useToday } from '../../hooks/useToday';
import { useAppStore } from '../../store/useAppStore';
import { ArcTab } from './ArcTab';
import { HabitsTab } from './HabitsTab';
import { LinksTab } from './LinksTab';
import { RatingsTab } from './RatingsTab';

type Tab = 'arc' | 'habits' | 'ratings' | 'links';

const TABS: { value: Tab; label: string }[] = [
  { value: 'arc', label: 'Арка' },
  { value: 'habits', label: 'Привычки' },
  { value: 'ratings', label: 'Оценки' },
  { value: 'links', label: 'Связи' },
];

const isTab = (value: string | null): value is Tab => TABS.some((tab) => tab.value === value);

/** Аналитика текущей арки на четырёх вкладках. Вкладка — в адресе (?tab=…). */
export function AnalyticsScreen() {
  const today = useToday();
  const data = useAppStore((state) => state.data);
  const [params, setParams] = useSearchParams();
  const arc = getActiveArc(data);
  if (!arc) return null;

  const requested = params.get('tab');
  const tab: Tab = isTab(requested) ? requested : 'arc';

  return (
    <>
      <ScreenHeader title="Аналитика" description={formatRange(arc.startDate, arc.endDate)} />

      {daysBetween(today, arc.startDate) > 0 ? (
        <EmptyState
          title="Арка ещё не началась"
          text={`Она начнётся ${formatDayMonth(arc.startDate)} — аналитика появится с первыми отметками.`}
        />
      ) : (
        <>
          <div className="mb-5 lg:max-w-xl">
            <Segmented
              label="Раздел аналитики"
              value={tab}
              onChange={(next) => setParams(next === 'arc' ? {} : { tab: next }, { replace: true })}
              options={TABS}
            />
          </div>
          {tab === 'arc' && <ArcTab data={data} arc={arc} today={today} />}
          {tab === 'habits' && <HabitsTab data={data} arc={arc} today={today} />}
          {tab === 'ratings' && <RatingsTab data={data} arc={arc} today={today} />}
          {tab === 'links' && <LinksTab data={data} arc={arc} today={today} />}
        </>
      )}
    </>
  );
}
