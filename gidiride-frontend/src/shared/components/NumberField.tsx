import { useState } from 'react';

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
}

/**
 * A controlled number input that never silently forces an empty field to "0" while typing
 * (that's what caused the "0234" leading-zero bug — coercing "" to 0 mid-edit, then losing
 * track of cursor position). This keeps the raw typed text as its own state and only reports
 * a parsed number upward once it's actually valid, showing a real inline error otherwise.
 */
export function NumberField({ label, value, onChange, min, max, step = 1, prefix, placeholder, required, helpText }: NumberFieldProps) {
  const [raw, setRaw] = useState(value ? String(value) : '');
  const [touched, setTouched] = useState(false);

  function handleChange(next: string) {
    setRaw(next);
    if (next.trim() === '') {
      if (!required) onChange(0);
      return;
    }
    const parsed = Number(next);
    if (!Number.isNaN(parsed)) onChange(parsed);
  }

  const numeric = raw.trim() === '' ? null : Number(raw);
  let error = '';
  if (touched) {
    if (raw.trim() === '' && required) error = `Enter ${label.toLowerCase()}.`;
    else if (numeric !== null && Number.isNaN(numeric)) error = 'Numbers only.';
    else if (numeric !== null && min !== undefined && numeric < min) error = `Must be at least ${min.toLocaleString()}.`;
    else if (numeric !== null && max !== undefined && numeric > max) error = `Must be ${max.toLocaleString()} or less.`;
  }

  return (
    <label className="number-field">
      <span>{label}</span>
      <div className={prefix ? 'prefix-input' : undefined}>
        {prefix && <span>{prefix}</span>}
        <input
          type="text"
          inputMode="numeric"
          value={raw}
          placeholder={placeholder}
          onChange={(event) => handleChange(event.target.value.replace(/[^\d.]/g, ''))}
          onBlur={() => setTouched(true)}
          aria-invalid={!!error}
        />
      </div>
      {error && <small className="field-error">{error}</small>}
      {!error && helpText && <small className="field-help">{helpText}</small>}
    </label>
  );
}
