import { ChevronLeft } from 'lucide-react';
import { lazy, Suspense, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { PATHS } from '../../app/routes';
import { getActiveArc } from '../../domain/arc';
import { chartFor, type HabitChartKind } from '../../domain/habitCharts';
import { describeHabit, draftFromHabit, getHabit } from '../../domain/habits';
import { BigNumber } from '../../design/ui/BigNumber';
import { Button } from '../../design/ui/Button';
import { EmptyState } from '../../design/ui/EmptyState';
import { GlassCard } from '../../design/ui/GlassCard';
import { ScreenHeader } from '../../design/ui/ScreenHeader';
import { Sheet } from '../../design/ui/Sheet';
import { StatTiles } from '../../design/ui/StatTiles';
import { THEMES } from '../../design/themes';
import { useToday } from '../../hooks/useToday';
import { useAppStore } from '../../store/useAppStore';
import { HabitForm } from './HabitForm';
import { habitStatTiles } from './habitStats';

// График грузится отдельным файлом: библиотека тяжёлая, а нужна только здесь.
const HabitChart = lazy(() => import('./HabitChart'));

const CHART_TITLES: Record<HabitChartKind, string> = {
  daily: 'Последние 4 недели',
  weekly: 'По неделям',
  weeklyRate: 'Выполнение по неделям',
};

/** Страница привычки: серии, статистика, график, правка и архив. */
export function HabitDetailScreen() {
  const { habitId = '' } = useParams();
  const today = useToday();
  const navigate = useNavigate();
  const data = useAppStore((state) => state.data);
  const updateHabit = useAppStore((state) => state.updateHabit);
  const archiveHabit = useAppStore((state) => state.archiveHabit);
  const [sheet, setSheet] = useState<'edit' | 'archive' | null>(null);

  const habit = getHabit(data, habitId);
  const arc = getActiveArc(data);

  const backLink = (
    <Link
      to={PATHS.habits}
      className="on-snow -ml-1 mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-text"
    >
      <ChevronLeft size={18} strokeWidth={1.5} aria-hidden="true" />
      Привычки
    </Link>
  );

  if (!habit || !arc || habit.archivedAt !== null) {
    return (
      <>
        {backLink}
        <EmptyState
          title="Привычка не найдена"
          text="Возможно, она убрана в архив. Вернись к списку привычек."
        />
      </>
    );
  }

  const theme = THEMES[data.settings.themeId];
  const tiles = habitStatTiles(habit, data, arc, today);
  const chart = chartFor(habit, data, arc.startDate, today);

  return (
    <>
      {backLink}
      <ScreenHeader title={habit.name} description={describeHabit(draftFromHabit(habit))} />

      <div className="flex flex-col gap-4">
        <StatTiles
          label="Статистика"
          tiles={tiles.map((tile) => ({
            key: tile.label,
            label: tile.label,
            value: (
              <>
                <BigNumber value={tile.value} size="sm" decimals={tile.decimals} />
                {tile.suffix && <span className="numeric text-xl text-number">{tile.suffix}</span>}
              </>
            ),
          }))}
        />

        {chart.points.length > 0 && (
          <GlassCard as="section" className="p-5">
            <h2 className="mb-3 text-base text-text">{CHART_TITLES[chart.kind]}</h2>
            <Suspense fallback={<div className="h-[212px]" />}>
              <HabitChart chart={chart} theme={theme} />
            </Suspense>
          </GlassCard>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <Button onClick={() => setSheet('edit')}>Изменить</Button>
          <Button variant="ghost" onClick={() => setSheet('archive')}>
            Убрать в архив
          </Button>
        </div>
      </div>

      <Sheet open={sheet === 'edit'} onClose={() => setSheet(null)} title="Изменить привычку">
        <HabitForm
          initial={draftFromHabit(habit)}
          submitLabel="Сохранить"
          lockKind
          onCancel={() => setSheet(null)}
          onSubmit={(draft) => {
            updateHabit(habit.id, draft);
            setSheet(null);
          }}
        />
      </Sheet>

      <Sheet open={sheet === 'archive'} onClose={() => setSheet(null)} title="Убрать в архив?">
        <p className="text-base text-text">
          «{habit.name}» пропадёт из чек-ина и списка. История и статистика сохранятся.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              archiveHabit(habit.id);
              navigate(PATHS.habits);
            }}
          >
            Убрать в архив
          </Button>
          <Button variant="ghost" onClick={() => setSheet(null)}>
            Отмена
          </Button>
        </div>
      </Sheet>
    </>
  );
}
