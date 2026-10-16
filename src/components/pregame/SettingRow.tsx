import type { ReactNode } from 'react';
import { Segmented } from '../Segmented';
import { useT } from '../../i18n';
import './SettingRow.css';

export interface SettingRowProps {
  label: string;
  hint?: string;
  /** Extra line under the control (e.g. sensor status). */
  status?: string;
  className?: string;
  children: ReactNode;
}

/**
 * One labelled settings row drawn as a soft card: title, optional hint, the control, optional status
 * line with a small dot. Layout rules shared with pregame.css (.srow) are repeated in SettingRow.css
 * with identical values, so the cascade order between the two files does not matter.
 */
export function SettingRow({ label, hint, status, className = '', children }: SettingRowProps) {
  return (
    <div className={`srow ${className}`.trim()}>
      <div className="srow__head">
        <span className="srow__label">{label}</span>
        {hint && <span className="srow__hint">{hint}</span>}
      </div>
      <div className="srow__control">{children}</div>
      {status && (
        <p className="srow__status">
          <span className="srow__status-dot" aria-hidden="true" />
          {status}
        </p>
      )}
    </div>
  );
}

type OnOff = 'on' | 'off';

/** Boolean setting rendered as an On / Off segmented control (the pill turns green when on). */
export function OnOffSwitch({
  value,
  onChange,
  testId,
  'aria-label': ariaLabel,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
  /** When set, the options get data-testid="{testId}-off" / "{testId}-on". */
  testId?: string;
  'aria-label'?: string;
}) {
  const t = useT();
  return (
    <Segmented<OnOff>
      aria-label={ariaLabel}
      testId={testId}
      className="segmented--switch"
      value={value ? 'on' : 'off'}
      options={[
        { value: 'off', label: t('common.off') },
        { value: 'on', label: t('common.on') },
      ]}
      onChange={(v) => onChange(v === 'on')}
    />
  );
}
