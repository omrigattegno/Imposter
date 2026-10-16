import { Button } from '../Button';
import { useT } from '../../i18n';
import { IconBack } from './icons';

/** Round "coin" back button for TopBar's leading slot; leaving a screen plays the whoosh. */
export function BackButton({ onClick, testId }: { onClick: () => void; testId?: string }) {
  const t = useT();
  return (
    <Button variant="ghost" sfx="whoosh" aria-label={t('common.back')} onClick={onClick} data-testid={testId}>
      <IconBack />
    </Button>
  );
}
