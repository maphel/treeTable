import { jsx as _jsx } from "react/jsx-runtime";
import { TextField, InputAdornment } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatPercentLive, formatPercentValue, getLocaleSeparators, parsePercent } from "../formatters/percentage.js";
function formatValue(value, locale) {
    if (value === undefined)
        return "";
    return formatPercentValue(value, locale);
}
export default function PercentageEditor({ value, onChange, onCommit, onCancel, autoFocus, min, max, step, locale = "de-DE" }) {
    const inputRef = useRef(null);
    const [text, setText] = useState(formatValue(value, locale));
    const separators = useMemo(() => getLocaleSeparators(locale), [locale]);
    useEffect(() => {
        setText(formatValue(value, locale));
    }, [value, locale]);
    const handleChange = (e) => {
        var _a;
        const input = e.target;
        const prev = input.value;
        const sel = (_a = input.selectionStart) !== null && _a !== void 0 ? _a : prev.length;
        const dec = separators.decimal;
        const otherDec = dec === "." ? "," : ".";
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
        const nextStr = formatPercentLive(prev, separators);
        setText(nextStr);
        const parsed = parsePercent(nextStr, locale);
        const finalValue = parsed === undefined ? undefined : parsed;
        if (finalValue !== value) {
            onChange(finalValue);
        }
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
                else if (ch === dec || ch === otherDec)
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
        if (e.key === "Enter") {
            e.preventDefault();
            onCommit === null || onCommit === void 0 ? void 0 : onCommit();
        }
        if (e.key === "Escape") {
            e.preventDefault();
            onCancel === null || onCancel === void 0 ? void 0 : onCancel();
        }
    };
    const handleBlur = () => onCommit === null || onCommit === void 0 ? void 0 : onCommit();
    return (_jsx(TextField, { variant: "standard", size: "small", value: text, onChange: handleChange, onKeyDown: handleKeyDown, onBlur: handleBlur, 
        // No need to mutate text on focus; we render the % symbol in value
        autoFocus: autoFocus, inputRef: inputRef, fullWidth: true, InputProps: {
            endAdornment: (_jsx(InputAdornment, { position: "end", children: "%" }))
        }, inputProps: {
            inputMode: "decimal",
            min,
            max,
            step
        } }));
}
