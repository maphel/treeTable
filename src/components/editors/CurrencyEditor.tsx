import * as React from 'react'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import {
  formatCurrencyLive,
  formatCurrencyValue,
  getLocaleSeparators,
} from '../formatters/currency.js';
import { useCommitCancelHandlers, useSelectOnAutoFocus, countUnitsBeforeCaret, restoreCaretByUnits, getOtherDecimal, compactTextFieldSx } from './shared.js'

export type CurrencyInputProps = {
  value: string | number | undefined;
  onChange: (next: string) => void;
  onCommit?: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  locale?: string;
  currency?: string;
  size?: "small" | "medium";
};

export default function CurrencyEditor({
  value,
  onChange,
  onCommit,
  onCancel,
  autoFocus,
  locale = 'de-DE',
  currency = 'EUR',
  size = 'medium',
}: CurrencyInputProps) {
  const inputRef = useSelectOnAutoFocus<HTMLInputElement>(autoFocus)
  const separators = React.useMemo(() => getLocaleSeparators(locale, currency), [locale, currency]);
  const dec = separators.decimal;
  const otherDec = getOtherDecimal(dec)

  const currencyPlacement = React.useMemo(() => {
    const parts = new Intl.NumberFormat(locale, { style: 'currency', currency, currencyDisplay: 'narrowSymbol' }).formatToParts(1234.56);
    const ci = parts.findIndex(p => p.type === 'currency');
    const ii = parts.findIndex(p => p.type === 'integer');
    return ci >= 0 && ii >= 0 && ci < ii ? 'start' as const : 'end' as const;
  }, [locale, currency]);

  const displayValue = React.useMemo(() => {
    if (typeof value === 'number') {
      return formatCurrencyValue(value, locale, currency);
    }
    if (typeof value === 'string') {
      return value;
    }
    return '';
  }, [value, locale, currency]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const prev = input.value;
    const sel = input.selectionStart ?? prev.length;
    const unitsLeft = countUnitsBeforeCaret(prev, sel, dec, otherDec)

    const nextStr = formatCurrencyLive(prev, separators);
    onChange(nextStr);

    requestAnimationFrame(() => {
      const el = inputRef.current
      if (!el) return
      restoreCaretByUnits(el, unitsLeft, dec)
    })
  };
  const { onKeyDown, onBlur } = useCommitCancelHandlers(onCommit, onCancel)

  return (
    <TextField
      variant="standard"
      size={size}
      margin="dense"
      value={displayValue}
      onChange={handleChange}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
      autoFocus={autoFocus}
      inputRef={inputRef}
      fullWidth
      InputProps={{
        ...(currencyPlacement === 'start'
          ? { startAdornment: (<InputAdornment position="start" sx={{ m: 0 }}>{separators.currencySym}</InputAdornment>) }
          : { endAdornment: (<InputAdornment position="end" sx={{ m: 0 }}>{separators.currencySym}</InputAdornment>) }),
      }}
      inputProps={{ inputMode: 'decimal', style: { textAlign: 'right' } }}
      sx={compactTextFieldSx}
    />
  );
}
