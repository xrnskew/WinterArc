import { getActiveArc } from '../../domain/arc';
import { useToday } from '../../hooks/useToday';
import { useAppStore } from '../../store/useAppStore';
import { StagePlaceholder } from '../StagePlaceholder';
import { ArcHero } from './ArcHero';

export function CommandCenterScreen() {
  const today = useToday();
  const arc = useAppStore((state) => getActiveArc(state.data));

  // AppShell показывает экраны только при текущей арке, но TypeScript об этом не знает.
  if (!arc) return null;

  return (
    <div className="flex flex-col gap-10">
      <ArcHero arc={arc} today={today} />

      {arc.why && (
        <blockquote className="on-snow border-l-2 border-gray-500 pl-4">
          <p className="text-base whitespace-pre-line text-text">{arc.why}</p>
          <footer className="mt-1 text-sm text-muted">Зачем я это делаю</footer>
        </blockquote>
      )}

      <StagePlaceholder stage="г">
        Индекс дисциплины недели и виджеты, которые ты выберешь и расставишь сам.
      </StagePlaceholder>
    </div>
  );
}
