import type { ReactNode } from 'react';

export interface StatTile {
  key: string;
  /** Крупное число (BigNumber) или прочерк. */
  value: ReactNode;
  label: string;
}

/**
 * Плитки статистики в одной стеклянной карточке, разделённые тонкими линиями.
 * Телефон — две колонки, десктоп — все плитки в ряд.
 * Линии рисует каждая плитка сверху и слева; внешние прячутся за краем карточки.
 */
export function StatTiles({ tiles, label }: { tiles: StatTile[]; label: string }) {
  return (
    // Не GlassCard: у неё внутренний отступ, а линиям между плитками нужен край карточки.
    <section aria-label={label} className="glass overflow-hidden rounded-lg">
      <div className="-mt-px -ml-px grid grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.key} className="min-w-0 border-t border-l border-gray-800 p-4">
            {tile.value}
            <p className="mt-1 text-sm text-muted">{tile.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
