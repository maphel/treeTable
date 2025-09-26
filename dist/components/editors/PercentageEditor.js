import { jsx as _jsx } from "react/jsx-runtime";
import { TextField, InputAdornment } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { formatPercentLive, formatPercentValue, getLocaleSeparators, parsePercent } from "../formatters/percentage.js";
import { useCommitCancelHandlers, useSelectOnAutoFocus, countUnitsBeforeCaret, restoreCaretByUnits, getOtherDecimal, compactTextFieldSx } from "./shared.js";
function formatValue(value, locale) {
    if (value === undefined)
        return "";
    return formatPercentValue(value, locale);
}
export default function PercentageEditor({ value, onChange, onCommit, onCancel, autoFocus, min, max, step, locale = "de-DE" }) {
    const inputRef = useSelectOnAutoFocus(autoFocus);
    const [text, setText] = useState(formatValue(value, locale));
    const separators = useMemo(() => getLocaleSeparators(locale), [locale]);
    useEffect(() => {
        setText(formatValue(value, locale));
    }, [value, locale]);
    const { onKeyDown, onBlur } = useCommitCancelHandlers(onCommit, onCancel);
    const handleChange = (e) => {
        var _a;
        const input = e.target;
        const prev = input.value;
        const sel = (_a = input.selectionStart) !== null && _a !== void 0 ? _a : prev.length;
        const dec = separators.decimal;
        const otherDec = getOtherDecimal(dec);
        const unitsLeft = countUnitsBeforeCaret(prev, sel, dec, otherDec);
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
            restoreCaretByUnits(el, unitsLeft, dec, true);
        });
    };
    return (_jsx(TextField, { variant: "standard", size: "small", margin: "dense", value: text, onChange: handleChange, onKeyDown: onKeyDown, onBlur: onBlur, autoFocus: autoFocus, inputRef: inputRef, fullWidth: true, InputProps: {
            endAdornment: (_jsx(InputAdornment, { position: "end", sx: { m: 0 }, children: "%" }))
        }, inputProps: {
            inputMode: "decimal",
            min,
            max,
            step,
            style: { textAlign: 'right' }
        }, sx: compactTextFieldSx }));
}
