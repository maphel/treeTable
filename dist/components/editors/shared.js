import { useCallback, useEffect, useRef } from "react";
export function useCommitCancelHandlers(onCommit, onCancel) {
    const handleKeyDown = useCallback((e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            onCommit === null || onCommit === void 0 ? void 0 : onCommit();
        }
        if (e.key === "Escape") {
            e.preventDefault();
            onCancel === null || onCancel === void 0 ? void 0 : onCancel();
        }
    }, [onCommit, onCancel]);
    const handleBlur = useCallback(() => onCommit === null || onCommit === void 0 ? void 0 : onCommit(), [onCommit]);
    return { onKeyDown: handleKeyDown, onBlur: handleBlur };
}
export function useSelectOnAutoFocus(autoFocus) {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        if (!autoFocus || !el)
            return;
        let rafId = null;
        let ran = false;
        const selectAll = () => {
            try {
                el.select();
            }
            catch { }
        };
        const onFocus = () => {
            if (ran)
                return;
            ran = true;
            // Defer selection to the next frame to avoid being overridden
            rafId = requestAnimationFrame(() => {
                selectAll();
            });
        };
        el.addEventListener('focus', onFocus);
        // If already focused (rare), still defer selection to next frame
        if (document.activeElement === el) {
            ran = true;
            rafId = requestAnimationFrame(() => {
                selectAll();
            });
        }
        return () => {
            el.removeEventListener('focus', onFocus);
            if (rafId !== null)
                cancelAnimationFrame(rafId);
        };
    }, [autoFocus]);
    return ref;
}
export const getOtherDecimal = (dec) => (dec === "." ? "," : ".");
export function countUnitsBeforeCaret(s, caretPos, dec, otherDec) {
    let units = 0;
    let seenDec = false;
    const limit = Math.min(caretPos, s.length);
    for (let i = 0; i < limit; i++) {
        const ch = s[i];
        if (/\d/.test(ch))
            units++;
        else if (!seenDec && (ch === dec || (otherDec && ch === otherDec))) {
            units++;
            seenDec = true;
        }
    }
    return units;
}
// Compact TextField styles for dense table cells
export const compactTextFieldSx = {
    '& .MuiInputBase-root': {
        fontSize: 13,
        lineHeight: 1.2,
        minHeight: 0,
    },
    '& .MuiInputBase-input': {
        paddingTop: 2,
        paddingBottom: 2,
    },
    '& .MuiInputAdornment-root': {
        margin: 0,
        '& .MuiTypography-root': {
            fontSize: 12,
            lineHeight: 1.2,
        },
    },
};
export function restoreCaretByUnits(input, unitsLeft, dec, includeOtherDecimal = false) {
    let newPos = 0;
    let units = 0;
    const v = input.value;
    for (let i = 0; i < v.length; i++) {
        const ch = v[i];
        if (/\d/.test(ch))
            units++;
        else if (ch === dec || (includeOtherDecimal && (ch === "." || ch === ",")))
            units++;
        if (units >= unitsLeft) {
            newPos = i + 1;
            break;
        }
        newPos = i + 1;
    }
    try {
        input.setSelectionRange(newPos, newPos);
    }
    catch { }
}
