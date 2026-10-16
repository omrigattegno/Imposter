import type { CSSProperties } from 'react';
import { RANDOM_CATEGORY, type WordPack } from '../../game/types';
import { useT } from '../../i18n';
import { haptic, playSfx } from '../../lib/sfx';
import { IconShuffle } from './icons';

export interface CategoryPickerProps {
  packs: WordPack[];
  selectedId: string;
  onSelect: (id: string) => void;
}

/** Chip grid: Random first (with a shuffle icon), then every pack of the current language (custom packs marked). */
export function CategoryPicker({ packs, selectedId, onSelect }: CategoryPickerProps) {
  const t = useT();
  const items = [
    { id: RANDOM_CATEGORY, name: t('common.random'), custom: false },
    ...packs.map((p) => ({ id: p.id, name: p.name, custom: p.id.startsWith('custom-') })),
  ];
  return (
    <div className="chips stagger" role="radiogroup" aria-label={t('setup.category')} style={{ '--stagger-step': '25ms' } as CSSProperties}>
      {items.map((it, i) => {
        const selected = it.id === selectedId;
        return (
          <button
            type="button"
            key={it.id}
            role="radio"
            aria-checked={selected}
            className={`chip chip--button anim-pop-in ${selected ? 'is-selected' : ''}`.trim()}
            style={{ '--i': i } as CSSProperties}
            onClick={() => {
              if (!selected) {
                playSfx('pop');
                haptic('light');
              }
              onSelect(it.id);
            }}
          >
            {it.id === RANDOM_CATEGORY && <IconShuffle size={18} />}
            {it.name}
            {it.custom && <span className="chip__badge">{t('setup.customBadge')}</span>}
          </button>
        );
      })}
    </div>
  );
}
