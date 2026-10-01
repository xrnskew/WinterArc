import { Button } from '../design/ui/Button';
import { GlassCard } from '../design/ui/GlassCard';
import { useAppStore, type StorageNotice as Notice } from '../store/useAppStore';

const MESSAGES: Record<Exclude<Notice['kind'], 'none' | 'newer'>, string> = {
  migrated: 'Данные обновлены под новую версию приложения. Копия старых сохранена в браузере.',
  corrupt:
    'Сохранённые данные не прочитались. Их копия отложена в браузере, приложение начато заново.',
  saveFailed:
    'Не получилось сохранить: в браузере закончилось место. Последние изменения могут пропасть.',
  noStorage:
    'Браузер запрещает сохранять данные, поэтому всё пропадёт после закрытия вкладки. Разреши сохранение данных для этого сайта в настройках браузера.',
};

/** Сообщение о хранилище над экраном. Закрывается кнопкой «Понятно». */
export function StorageNotice() {
  const notice = useAppStore((state) => state.notice);
  const dismiss = useAppStore((state) => state.dismissNotice);
  if (notice.kind === 'none' || notice.kind === 'newer') return null;

  return (
    <GlassCard role="status" className="mb-6 flex items-start gap-4 p-4">
      <p className="flex-1 text-sm text-text">{MESSAGES[notice.kind]}</p>
      <Button variant="ghost" className="-my-2 -mr-2 shrink-0" onClick={dismiss}>
        Понятно
      </Button>
    </GlassCard>
  );
}

/**
 * Данные сохранила более новая версия приложения. Ничего не показываем
 * и не сохраняем, чтобы случайно не затереть их старой версией.
 */
export function NewerDataScreen({ version }: { version: number }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-4">
      <h1 className="screen-title on-snow text-3xl text-number">Нужно обновление</h1>
      <p className="on-snow mt-3 text-base text-text">
        Твои данные сохранила более новая версия Winter Arc (формат v{version}). Эта версия их не
        понимает, поэтому ничего не меняет и не сохраняет.
      </p>
      <p className="on-snow mt-2 text-base text-muted">
        Перезагрузи страницу: обычно новая версия уже скачалась.
      </p>
      <Button
        variant="primary"
        size="lg"
        className="mt-8 self-start"
        onClick={() => location.reload()}
      >
        Перезагрузить
      </Button>
    </div>
  );
}
