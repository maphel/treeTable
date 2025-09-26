import { jsx as _jsx } from "react/jsx-runtime";
import { TextField } from "@mui/material";
import { useEffect, useRef } from "react";
export default function TextEditor({ value, onChange, onCommit, onCancel, autoFocus }) {
    const ref = useRef(null);
    useEffect(() => {
        if (autoFocus && ref.current) {
            try {
                ref.current.select();
            }
            catch { }
        }
    }, [autoFocus]);
    return (_jsx(TextField, { variant: "standard", size: "small", value: typeof value === "string" ? value : value !== null && value !== void 0 ? value : "", inputRef: ref, onChange: (e) => onChange(e.target.value), onKeyDown: (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                onCommit === null || onCommit === void 0 ? void 0 : onCommit();
            }
            if (e.key === "Escape") {
                e.preventDefault();
                onCancel === null || onCancel === void 0 ? void 0 : onCancel();
            }
        }, onBlur: () => onCommit === null || onCommit === void 0 ? void 0 : onCommit(), autoFocus: autoFocus, fullWidth: true }));
}
