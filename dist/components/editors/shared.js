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
        if (autoFocus && ref.current) {
            try {
                ref.current.select();
            }
            catch { }
        }
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
