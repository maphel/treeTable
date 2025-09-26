import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import { formatCurrencyLive, formatCurrencyValue, getLocaleSeparators, } from '../formatters/currency.js';
export default function CurrencyInput({ value, onChange, onCommit, onCancel, autoFocus, locale = 'de-DE', currency = 'EUR', }) {
    const inputRef = React.useRef(null);
    const separators = React.useMemo(() => getLocaleSeparators(locale, currency), [locale, currency]);
    const dec = separators.decimal;
    const otherDec = dec === '.' ? ',' : '.';
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
        const leftStr = prev.slice(0, sel);
        const countUnits = (s) => {
            let units = 0;
            let seenDec = false;
            for (let i = 0; i < s.length; i++) {
                const ch = s[i];
                if (/\d/.test(ch))
                    units++;
                else if (!seenDec && (ch === dec || ch === otherDec)) {
                    units++;
                    seenDec = true;
                }
            }
            return units;
        };
        const unitsLeft = countUnits(leftStr);
        const nextStr = formatCurrencyLive(prev, separators);
        onChange(nextStr);
        requestAnimationFrame(() => {
            const el = inputRef.current;
            if (!el)
                return;
            let newPos = 0;
            let units = 0;
            const v = el.value;
            for (let i = 0; i < v.length; i++) {
                const ch = v[i];
                if (/\d/.test(ch))
                    units++;
                else if (ch === dec)
                    units++;
                if (units >= unitsLeft) {
                    newPos = i + 1;
                    break;
                }
                newPos = i + 1;
            }
            try {
                el.setSelectionRange(newPos, newPos);
            }
            catch { }
        });
    };
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onCommit === null || onCommit === void 0 ? void 0 : onCommit();
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            onCancel === null || onCancel === void 0 ? void 0 : onCancel();
        }
    };
    const handleBlur = () => onCommit === null || onCommit === void 0 ? void 0 : onCommit();
    return (_jsx(TextField, { variant: "standard", size: "small", value: displayValue, onChange: handleChange, onKeyDown: handleKeyDown, onBlur: handleBlur, autoFocus: autoFocus, inputRef: inputRef, fullWidth: true, InputProps: {
            ...(currencyPlacement === 'start'
                ? { startAdornment: (_jsx(InputAdornment, { position: "start", children: separators.currencySym })) }
                : { endAdornment: (_jsx(InputAdornment, { position: "end", children: separators.currencySym })) }),
        }, inputProps: { inputMode: 'decimal' } }));
}
