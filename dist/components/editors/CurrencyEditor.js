import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import { formatCurrencyLive, formatCurrencyValue, getLocaleSeparators, } from '../formatters/currency.js';
import { useCommitCancelHandlers, useSelectOnAutoFocus, countUnitsBeforeCaret, restoreCaretByUnits, getOtherDecimal } from './shared.js';
export default function CurrencyEditor({ value, onChange, onCommit, onCancel, autoFocus, locale = 'de-DE', currency = 'EUR', }) {
    const inputRef = useSelectOnAutoFocus(autoFocus);
    const separators = React.useMemo(() => getLocaleSeparators(locale, currency), [locale, currency]);
    const dec = separators.decimal;
    const otherDec = getOtherDecimal(dec);
    const currencyPlacement = React.useMemo(() => {
        const parts = new Intl.NumberFormat(locale, { style: 'currency', currency, currencyDisplay: 'narrowSymbol' }).formatToParts(1234.56);
        const ci = parts.findIndex(p => p.type === 'currency');
        const ii = parts.findIndex(p => p.type === 'integer');
        return ci >= 0 && ii >= 0 && ci < ii ? 'start' : 'end';
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
    const handleChange = (e) => {
        var _a;
        const input = e.target;
        const prev = input.value;
        const sel = (_a = input.selectionStart) !== null && _a !== void 0 ? _a : prev.length;
        const unitsLeft = countUnitsBeforeCaret(prev, sel, dec, otherDec);
        const nextStr = formatCurrencyLive(prev, separators);
        onChange(nextStr);
        requestAnimationFrame(() => {
            const el = inputRef.current;
            if (!el)
                return;
            restoreCaretByUnits(el, unitsLeft, dec);
        });
    };
    const { onKeyDown, onBlur } = useCommitCancelHandlers(onCommit, onCancel);
    return (_jsx(TextField, { variant: "standard", size: "small", value: displayValue, onChange: handleChange, onKeyDown: onKeyDown, onBlur: onBlur, autoFocus: autoFocus, inputRef: inputRef, fullWidth: true, InputProps: {
            ...(currencyPlacement === 'start'
                ? { startAdornment: (_jsx(InputAdornment, { position: "start", children: separators.currencySym })) }
                : { endAdornment: (_jsx(InputAdornment, { position: "end", children: separators.currencySym })) }),
        }, inputProps: { inputMode: 'decimal' } }));
}
