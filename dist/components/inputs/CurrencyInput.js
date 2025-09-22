import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import TextField from '@mui/material/TextField';
/**
 * Lightweight currency input with de-DE style live formatting
 * - Thousands separator while typing
 * - Decimal comma (",")
 * - Preserves caret around reformatting
 */
export default function CurrencyInput({ value, onChange, onCommit, onCancel, autoFocus, locale = 'de-DE', currency = 'EUR', }) {
    const inputRef = React.useRef(null);
    const formatNumber = React.useMemo(() => new Intl.NumberFormat(locale, {
        style: 'currency', currency, currencyDisplay: 'narrowSymbol',
        minimumFractionDigits: 2, maximumFractionDigits: 2,
    }), [locale, currency]);
    // Identify locale separators from a known number
    const separators = React.useMemo(() => {
        var _a, _b, _c;
        const ex = formatNumber.formatToParts(1234.56);
        const group = ((_a = ex.find(p => p.type === 'group')) === null || _a === void 0 ? void 0 : _a.value) || '.';
        const decimal = ((_b = ex.find(p => p.type === 'decimal')) === null || _b === void 0 ? void 0 : _b.value) || ',';
        const currencySym = ((_c = ex.find(p => p.type === 'currency')) === null || _c === void 0 ? void 0 : _c.value) || '€';
        return { group, decimal, currencySym };
    }, [formatNumber]);
    function sanitize(raw) {
        // Remove currency symbols and spaces
        let s = raw.replace(/\s/g, '').replace(/[A-Za-z€$¥£₣₤₽₹₺₩₫₪฿₴₦₱₡₲₵₸₭]/g, '');
        // Allow only digits and separators
        const allowed = new RegExp(`[^0-9\\${separators.group}\\${separators.decimal}-]`, 'g');
        s = s.replace(allowed, '');
        return s;
    }
    function formatLive(raw) {
        if (!raw)
            return '';
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
        if (fracPart.length > 2)
            fracPart = fracPart.slice(0, 2);
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
    const handleChange = (e) => {
        var _a;
        const input = e.target;
        const prev = input.value;
        const sel = (_a = input.selectionStart) !== null && _a !== void 0 ? _a : prev.length;
        const digitsLeft = prev.slice(0, sel).replace(/\D/g, '').length;
        const nextStr = formatLive(prev);
        onChange(nextStr);
        // Restore caret approx by digits-left heuristic
        requestAnimationFrame(() => {
            const el = inputRef.current;
            if (!el)
                return;
            let newPos = 0;
            let count = 0;
            const v = el.value;
            for (let i = 0; i < v.length; i++) {
                if (/\d/.test(v[i]))
                    count++;
                if (count >= digitsLeft) {
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
    return (_jsx(TextField, { variant: "standard", size: "small", value: displayValue, onChange: handleChange, onKeyDown: handleKeyDown, onBlur: handleBlur, autoFocus: autoFocus, inputRef: inputRef, fullWidth: true, inputProps: { inputMode: 'decimal' } }));
}
