import { Check } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { blend, contrastRatio, parseColor } from '../../design/color';
import { winterTheme } from '../../design/themes/winter';
import { BigNumber } from '../../design/ui/BigNumber';
import { Button } from '../../design/ui/Button';
import { GlassCard } from '../../design/ui/GlassCard';
import { ProgressBar } from '../../design/ui/ProgressBar';
import { ScreenHeader } from '../../design/ui/ScreenHeader';
import { Segmented } from '../../design/ui/Segmented';
import { Tally } from '../../design/ui/tally/Tally';
import { cx } from '../../lib/cx';
import { plural } from '../../lib/plural';
import { makeDemoArc } from './demoArc';

/**
 * Витрина дизайн-системы: все примитивы на одном экране.
 * Только для разработки — в собранном приложении ссылки на неё нет.
 */
export function KitScreen() {
  return (
    <>
      <ScreenHeader title="Витрина" description="Дизайн-система на примерах. Данные выдуманы." />
      <div className="flex flex-col gap-10">
        <HeroExample />
        <Typography />
        <Colors />
        <Controls />
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="on-snow mb-3 text-lg text-text">{title}</h2>
      {children}
    </section>
  );
}

/** Как будет выглядеть верх командного центра (этап «г»). */
function HeroExample() {
  const days = useMemo(() => makeDemoArc(), []);
  const todayIndex = days.findIndex((d) => d.status === 'today');
  const left = days.length - todayIndex - 1;

  return (
    <Section title="Верх командного центра">
      <div className="on-snow">
        <BigNumber value={left} size="xl" fromZero />
        <p className="mt-1 text-sm text-muted">
          {plural(left, 'день', 'дня', 'дней')} до конца арки
        </p>
      </div>
      <div className="mt-6">
        <Tally
          days={days}
          label={`Арка: день ${todayIndex + 1} из ${days.length}`}
          todayCaption={`День ${todayIndex + 1} из ${days.length}`}
        />
      </div>
    </Section>
  );
}

function Typography() {
  return (
    <Section title="Шрифты">
      <GlassCard className="flex flex-col gap-4 p-5">
        <div>
          <p className="screen-title text-3xl text-number">Обзор недели</p>
          <p className="mt-1 text-xs text-muted">
            Oswald 500, заглавные — только заголовки экранов
          </p>
        </div>
        <div>
          <p className="text-base text-text">
            Каждый день считается чистым, пока ты не отметишь срыв. Тягу, которую ты пережил,
            приложение тоже запоминает.
          </p>
          <p className="mt-1 text-xs text-muted">Golos Text 400 — основной текст</p>
        </div>
        <div>
          <p className="numeric text-4xl text-number">1 234 567,89</p>
          <p className="mt-1 text-xs text-muted">JetBrains Mono — только цифры</p>
        </div>
      </GlassCard>
    </Section>
  );
}

/** Образцы цветов и их контраст с худшим фоном — стеклом над снежинкой. */
function Colors() {
  const c = winterTheme.color;
  const worstBackground = blend(c.glass, parseColor(c.gray600).rgb);
  const ratio = (color: string) =>
    contrastRatio(parseColor(color).rgb, worstBackground).toLocaleString('ru-RU', {
      maximumFractionDigits: 1,
    });

  const textSwatches = [
    { name: 'number', value: c.number },
    { name: 'text', value: c.text },
    { name: 'text-muted', value: c.textMuted },
    { name: 'danger-text', value: c.dangerText },
  ];
  const graySwatches = [c.gray800, c.gray700, c.gray600, c.gray500, c.gray400, c.gray300];

  return (
    <Section title="Цвета">
      <GlassCard className="p-5">
        <p className="mb-3 text-sm text-muted">
          Цвета текста и контраст на стекле над снегом. Минимум для мелкого текста — 4,5.
        </p>
        <ul className="grid grid-cols-2 gap-3">
          {textSwatches.map((swatch) => (
            <li key={swatch.name} className="flex items-center gap-3">
              <span
                className="size-8 shrink-0 rounded-sm border border-glass-border"
                style={{ background: swatch.value }}
              />
              <span className="text-sm" style={{ color: swatch.value }}>
                {swatch.name}
                <span className="numeric block text-xs">{ratio(swatch.value)}:1</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-5 mb-2 text-sm text-muted">Серые для рамок, черт и графиков</p>
        <div className="flex">
          {graySwatches.map((gray) => (
            <span key={gray} className="h-6 flex-1" style={{ background: gray }} />
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="h-6 w-1 bg-danger" />
          <span className="text-sm text-danger-text">Срыв или просрочка — единственный цвет</span>
        </div>
      </GlassCard>
    </Section>
  );
}

function Controls() {
  const [done, setDone] = useState(false);
  const [flashes, setFlashes] = useState(0);
  const [pushups, setPushups] = useState(40);
  const [range, setRange] = useState<'week' | 'month' | 'arc'>('week');

  const toggle = () => {
    if (!done) setFlashes((n) => n + 1);
    setDone(!done);
  };

  return (
    <Section title="Элементы">
      <div className="flex flex-col gap-4">
        <GlassCard className="flex items-center gap-4 p-4">
          <button
            type="button"
            onClick={toggle}
            aria-pressed={done}
            aria-label="Отметить: Зарядка"
            className={cx(
              'relative flex size-11 shrink-0 items-center justify-center rounded-md border',
              'transition-colors duration-(--wa-motion-fast)',
              done ? 'border-number bg-number text-night' : 'border-gray-500 text-transparent',
            )}
          >
            <Check size={22} strokeWidth={2.5} aria-hidden="true" />
            {flashes > 0 && (
              <span
                key={flashes}
                className="flash absolute inset-0 rounded-md"
                aria-hidden="true"
              />
            )}
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-base text-text">Зарядка</p>
            <p className="text-sm text-muted">Нажми — так будет выглядеть отметка привычки</p>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <BigNumber value={pushups} size="md" />
              <p className="mt-1 text-sm text-muted">отжиманий из 100</p>
            </div>
            <Button onClick={() => setPushups((n) => Math.min(n + 10, 100))}>Добавить 10</Button>
          </div>
          <ProgressBar value={pushups / 100} label="Отжимания за день" className="mt-4" />
        </GlassCard>

        <GlassCard className="flex flex-col gap-4 p-5">
          <Segmented
            label="Период"
            value={range}
            onChange={setRange}
            options={[
              { value: 'week', label: 'Неделя' },
              { value: 'month', label: 'Месяц' },
              { value: 'arc', label: 'Вся арка' },
            ]}
          />
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Сохранить</Button>
            <Button>Отмена</Button>
            <Button variant="danger">Отметить срыв</Button>
            <Button variant="ghost">Пропустить</Button>
          </div>
        </GlassCard>
      </div>
    </Section>
  );
}
