import * as React from 'react';
import TextField from '@mui/material/TextField';

export type CurrencyInputProps = {
  value: string | number | undefined;
  onChange: (next: string) => void;
  onCommit?: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  locale?: string; // e.g. 'de-DE'
  currency?: string; // e.g. 'EUR'
};

/**
 * Lightweight currency input with de-DE style live formatting
 * - Thousands separator while typing
 * - Decimal comma (",")
 * - Preserves caret around reformatting
 */
export default function CurrencyInput({
  value,
  onChange,
  onCommit,
  onCancel,
  autoFocus,
  locale = 'de-DE',
  currency = 'EUR',
}: CurrencyInputProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const formatNumber = React.useMemo(() => new Intl.NumberFormat(locale, {
    style: 'currency', currency, currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }), [locale, currency]);

  // Identify locale separators from a known number
  const separators = React.useMemo(() => {
    const ex = formatNumber.formatToParts(1234.56);
    const group = ex.find(p => p.type === 'group')?.value || '.';
    const decimal = ex.find(p => p.type === 'decimal')?.value || ',';
    const currencySym = ex.find(p => p.type === 'currency')?.value || '€';
    return { group, decimal, currencySym } as const;
  }, [formatNumber]);

  function sanitize(raw: string) {
    // Remove currency symbols and spaces
    let s = raw.replace(/\s/g, '').replace(/[A-Za-z€$¥£₣₤₽₹₺₩₫₪฿₴₦₱₡₲₵₸₭]/g, '');
    // Allow only digits and separators
    const allowed = new RegExp(`[^0-9\\${separators.group}\\${separators.decimal}-]`, 'g');
    s = s.replace(allowed, '');
    return s;
  }

  function formatLive(raw: string): string {
    if (!raw) return '';
    let s = sanitize(raw);
    // Handle negative sign at start only
    const negative = s.startsWith('-');
    s = negative ? s.slice(1) : s;

    // Split at first decimal separator present in s
    const decIdx = s.indexOf(separators.decimal);
    let intPart = decIdx >= 0 ? s.slice(0, decIdx) : s;
    let fracPart = decIdx >= 0 ? s.slice(decIdx + 1) : '';

    // Remove grouping separators from int part
    const rgGroup = new RegExp(`\\${separators.group}`, 'g');
    intPart = intPart.replace(rgGroup, '');
    // Remove any non-digits from frac part
    fracPart = fracPart.replace(/[^0-9]/g, '');

    // Insert grouping into int part
    // Reverse-groups of 3 digits
    const rev = [...intPart].reverse().join('');
    const groupedRev = rev.replace(/(\d{3})(?=\d)/g, `$1${separators.group}`);
    const grouped = [...groupedRev].reverse().join('');

    // limit fraction digits to 2
    if (fracPart.length > 2) fracPart = fracPart.slice(0, 2);

    const out = fracPart ? `${grouped}${separators.decimal}${fracPart}` : grouped;
    return negative ? `-${out}` : out;
  }

  // Convert number input to formatted string for display
  const displayValue = React.useMemo(() => {
    if (typeof value === 'number') {
      // Use Intl to format and then strip currency symbol, keep grouping and decimals
      const parts = formatNumber.formatToParts(value);
      const s = parts.filter(p => p.type !== 'currency' && p.type !== 'literal').map(p => p.value).join('');
      return s.trim();
    }
    if (typeof value === 'string') {
      return formatLive(value);
    }
    return '';
  }, [value, formatNumber]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const prev = input.value;
    const sel = input.selectionStart ?? prev.length;
    const digitsLeft = prev.slice(0, sel).replace(/\D/g, '').length;

    const nextStr = formatLive(prev);
    onChange(nextStr);

    // Restore caret approx by digits-left heuristic
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      let newPos = 0;
      let count = 0;
      const v = el.value;
      for (let i = 0; i < v.length; i++) {
        if (/\d/.test(v[i])) count++;
        if (count >= digitsLeft) { newPos = i + 1; break; }
        newPos = i + 1;
      }
      try { el.setSelectionRange(newPos, newPos); } catch {}
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); onCommit?.(); }
    if (e.key === 'Escape') { e.preventDefault(); onCancel?.(); }
  };

  const handleBlur = () => onCommit?.();

  return (
    <TextField
      variant="standard"
      size="small"
      value={displayValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      autoFocus={autoFocus}
      inputRef={inputRef}
      fullWidth
      inputProps={{ inputMode: 'decimal' }}
    />
  );
}

