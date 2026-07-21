// src/components/ui/Toggle/Toggle.tsx
import type { ButtonHTMLAttributes } from 'react';

type ToggleSize = 'sm' | 'md';
type ToggleColor = 'emerald' | 'amber';

export interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'type' | 'onChange'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: ToggleSize;
  /** Color del track cuando está activo. Por defecto 'emerald'. */
  activeColor?: ToggleColor;
}

const trackSizes: Record<ToggleSize, string> = {
  sm: 'h-5 w-10',
  md: 'h-6 w-11'
};

const thumbSizes: Record<ToggleSize, string> = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4'
};

const thumbTranslate: Record<ToggleSize, string> = {
  sm: 'translate-x-6',
  md: 'translate-x-6'
};

const activeTrackColors: Record<ToggleColor, string> = {
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500'
};

const Toggle = ({
  checked,
  onChange,
  size = 'sm',
  activeColor = 'emerald',
  disabled = false,
  className = '',
  ...props
}: ToggleProps) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        'relative inline-flex items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
        trackSizes[size],
        checked ? activeTrackColors[activeColor] : 'bg-slate-200',
        className
      ].filter(Boolean).join(' ')}
      {...props}
    >
      <span
        className={[
          'inline-block transform rounded-full bg-white transition-transform',
          thumbSizes[size],
          checked ? thumbTranslate[size] : 'translate-x-1'
        ].filter(Boolean).join(' ')}
      />
    </button>
  );
};

export default Toggle;
