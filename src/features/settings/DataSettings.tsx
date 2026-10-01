import { Check } from 'lucide-react';
import { useState } from 'react';
import { formatDayMonth, todayKey } from '../../domain/dates';
import { Button } from '../../design/ui/Button';
import { GlassCard } from '../../design/ui/GlassCard';
import { Sheet } from '../../design/ui/Sheet';
import { downloadFile } from '../../lib/downloadFile';
import { backupFileName, serializeBackup } from '../../storage/backup';
import { useAppStore } from '../../store/useAppStore';
import { ImportFromFile } from './ImportFromFile';

/** Когда последний раз сохраняли копию — помнит только это устройство. */
const LAST_EXPORT_KEY = 'winterarc:last-export';

function readLastExport(): string | null {
  try {
    return localStorage.getItem(LAST_EXPORT_KEY);
  } catch {
    return null;
  }
}

/** Данные: копия в файл, загрузка из файла, возврат прошлых данных, удаление всего. */
export function DataSettings() {
  const data = useAppStore((state) => state.data);
  const resetAllData = useAppStore((state) => state.resetAllData);
  const hasPreviousCopy = useAppStore((state) => state.hasPreviousCopy);
  const restorePreviousCopy = useAppStore((state) => state.restorePreviousCopy);
  const [lastExport, setLastExport] = useState(readLastExport);
  const [status, setStatus] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const exportData = () => {
    const today = todayKey();
    downloadFile(backupFileName(today), serializeBackup(data));
    try {
      localStorage.setItem(LAST_EXPORT_KEY, today);
    } catch {
      // Не запомнили дату — не страшно, сама копия уже скачана.
    }
    setLastExport(today);
    setStatus('Копия сохранена');
  };

  return (
    <GlassCard as="section" aria-labelledby="settings-data" className="p-5">
      <h2 id="settings-data" className="text-base text-text">
        Данные
      </h2>
      <p className="mt-1 text-sm text-muted">
        Всё хранится только на этом устройстве. Раз в пару недель сохраняй копию в файл — так
        история переживёт смену телефона.
      </p>
      <p className="mt-2 text-sm text-muted">
        {lastExport
          ? `Последняя копия — ${formatDayMonth(lastExport)}.`
          : 'Копию ещё не сохраняли.'}
      </p>

      <div className="mt-4 flex flex-col gap-2">
        <Button variant="primary" onClick={exportData}>
          Сохранить копию
        </Button>
        <ImportFromFile replacing onImported={() => setStatus('Данные загружены')} />
      </div>

      <p aria-live="polite" className="mt-3 flex items-center gap-1.5 text-sm text-text">
        {status && (
          <>
            <Check size={16} strokeWidth={2} aria-hidden="true" />
            {status}
          </>
        )}
      </p>

      <div className="mt-4 flex flex-col gap-2 border-t border-gray-800 pt-4">
        {hasPreviousCopy && (
          <Button
            variant="ghost"
            onClick={() => setStatus(restorePreviousCopy() ? 'Прошлые данные возвращены' : null)}
          >
            Вернуть данные до последней загрузки или удаления
          </Button>
        )}
        <Button variant="ghost" onClick={() => setConfirmReset(true)}>
          Удалить все данные
        </Button>
      </div>

      <Sheet open={confirmReset} onClose={() => setConfirmReset(false)} title="Удалить все данные?">
        <p className="text-base text-text">
          Привычки, отметки, оценки, цели, задачи, обзоры и жетоны удалятся. Начнёшь с новой арки.
        </p>
        <p className="mt-2 text-sm text-muted">
          Копия останется на устройстве, но надёжнее сначала сохранить её в файл.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={exportData}>Сохранить копию</Button>
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              setConfirmReset(false);
              resetAllData();
            }}
          >
            Удалить всё
          </Button>
          <Button variant="ghost" onClick={() => setConfirmReset(false)}>
            Отмена
          </Button>
        </div>
      </Sheet>
    </GlassCard>
  );
}
