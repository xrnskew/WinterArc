import { useState } from 'react';
import { getActiveArc, getArchivedArcs, validateArcDraft, type ArcDraft } from '../../domain/arc';
import { formatRange } from '../../domain/dates';
import type { Arc } from '../../domain/types';
import { Button } from '../../design/ui/Button';
import { GlassCard } from '../../design/ui/GlassCard';
import { Sheet } from '../../design/ui/Sheet';
import { hasErrors } from '../../lib/hasErrors';
import { useAppStore } from '../../store/useAppStore';
import { ArcFields } from '../arc/ArcFields';

/** Раздел «Арка» в настройках: изменить текущую, завершить, посмотреть прошлые. */
export function ArcSettings() {
  const data = useAppStore((state) => state.data);
  const updateArc = useAppStore((state) => state.updateArc);
  const archiveArc = useAppStore((state) => state.archiveArc);
  const [sheet, setSheet] = useState<'edit' | 'archive' | null>(null);

  const arc = getActiveArc(data);
  const pastArcs = getArchivedArcs(data);
  if (!arc) return null;

  return (
    <>
      <GlassCard as="section" className="p-5">
        <h2 className="text-base text-text">Арка</h2>
        <p className="mt-3 text-lg text-number">{arc.name}</p>
        <p className="text-sm text-muted">{formatRange(arc.startDate, arc.endDate)}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={() => setSheet('edit')}>Изменить</Button>
          <Button variant="ghost" onClick={() => setSheet('archive')}>
            Завершить арку
          </Button>
        </div>

        {pastArcs.length > 0 && (
          <div className="mt-6 border-t border-gray-800 pt-4">
            <h3 className="text-sm text-muted">Прошлые арки</h3>
            <ul className="mt-2 flex flex-col gap-2">
              {pastArcs.map((past) => (
                <li key={past.id} className="flex justify-between gap-4 text-sm">
                  <span className="text-text">{past.name}</span>
                  <span className="text-muted">{formatRange(past.startDate, past.endDate)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </GlassCard>

      <Sheet open={sheet === 'edit'} onClose={() => setSheet(null)} title="Изменить арку">
        <EditArcForm
          arc={arc}
          onCancel={() => setSheet(null)}
          onSave={(draft) => {
            updateArc(arc.id, draft);
            setSheet(null);
          }}
        />
      </Sheet>

      <Sheet open={sheet === 'archive'} onClose={() => setSheet(null)} title="Завершить арку?">
        <p className="text-base text-text">
          «{arc.name}» уйдёт в историю вместе со всей статистикой. Привычки останутся: их можно
          взять в новую арку.
        </p>
        <p className="mt-2 text-sm text-muted">Сразу после этого начнём новую арку.</p>
        <div className="mt-6 flex flex-col gap-2">
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              setSheet(null);
              archiveArc();
            }}
          >
            Завершить арку
          </Button>
          <Button variant="ghost" onClick={() => setSheet(null)}>
            Отмена
          </Button>
        </div>
      </Sheet>
    </>
  );
}

function EditArcForm({
  arc,
  onSave,
  onCancel,
}: {
  arc: Arc;
  onSave: (draft: ArcDraft) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<ArcDraft>({
    name: arc.name,
    startDate: arc.startDate,
    endDate: arc.endDate,
    why: arc.why,
  });
  const [submitted, setSubmitted] = useState(false);
  const errors = validateArcDraft(draft);

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
        if (!hasErrors(errors)) onSave(draft);
      }}
      className="flex flex-col gap-6"
    >
      <ArcFields
        draft={draft}
        onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
        errors={submitted ? errors : {}}
        withWhy
      />
      <div className="flex flex-col gap-2">
        <Button type="submit" variant="primary" size="lg">
          Сохранить
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
