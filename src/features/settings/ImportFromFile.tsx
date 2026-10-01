import { useRef, useState, type ChangeEvent } from 'react';
import type { AppData } from '../../domain/types';
import { Button } from '../../design/ui/Button';
import { FieldError } from '../../design/ui/inputs';
import { Sheet } from '../../design/ui/Sheet';
import { plural } from '../../lib/plural';
import { parseBackup } from '../../storage/backup';
import { useAppStore } from '../../store/useAppStore';

/** "1 арка, 4 привычки, 39 дней с оценками или заметками" — что лежит в файле. */
function describeData(data: AppData): string {
  const arcs = data.arcs.length;
  const habits = data.habits.length;
  const days = Object.keys(data.days).length;
  return [
    `${arcs} ${plural(arcs, 'арка', 'арки', 'арок')}`,
    `${habits} ${plural(habits, 'привычка', 'привычки', 'привычек')}`,
    `${days} ${plural(days, 'день', 'дня', 'дней')} с оценками или заметками`,
  ].join(', ');
}

interface ImportFromFileProps {
  /** true — сейчас есть данные, и они заменятся (настройки); false — онбординг. */
  replacing: boolean;
  /** Данные загружены. */
  onImported?: () => void;
}

/**
 * Кнопка «Загрузить из файла»: выбрать копию, проверить её и после
 * подтверждения заменить данные. Старый формат обновится сам (миграции).
 */
export function ImportFromFile({ replacing, onImported }: ImportFromFileProps) {
  const replaceData = useAppStore((state) => state.replaceData);
  const fileInput = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState<{ data: AppData; migrated: boolean } | null>(null);

  const chooseFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Сбрасываем выбор, чтобы тот же файл можно было выбрать ещё раз.
    event.target.value = '';
    if (!file) return;
    const result = parseBackup(await file.text());
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setFound({ data: result.data, migrated: result.migratedFrom !== null });
  };

  return (
    <>
      <Button onClick={() => fileInput.current?.click()}>Загрузить из файла</Button>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={chooseFile}
        aria-label="Файл с копией данных"
      />
      {error && <FieldError>{error}</FieldError>}

      <Sheet
        open={found !== null}
        onClose={() => setFound(null)}
        title={replacing ? 'Заменить данные?' : 'Загрузить копию?'}
      >
        {found && (
          <>
            <p className="text-base text-text">В файле: {describeData(found.data)}.</p>
            {found.migrated && (
              <p className="mt-2 text-sm text-muted">
                Файл из прошлой версии приложения — данные обновятся до текущей.
              </p>
            )}
            {replacing && (
              <p className="mt-2 text-sm text-muted">
                Текущие данные заменятся. Их копия останется на устройстве — вернуть можно в
                настройках, в разделе «Данные».
              </p>
            )}
            <div className="mt-6 flex flex-col gap-2">
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  replaceData(found.data);
                  setFound(null);
                  onImported?.();
                }}
              >
                {replacing ? 'Заменить данные' : 'Загрузить'}
              </Button>
              <Button variant="ghost" onClick={() => setFound(null)}>
                Отмена
              </Button>
            </div>
          </>
        )}
      </Sheet>
    </>
  );
}
