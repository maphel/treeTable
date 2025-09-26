import { jsx as _jsx } from "react/jsx-runtime";
import { TextField } from "@mui/material";
import { useEffect, useState } from "react";
export default function NumberEditor({ value, onChange, onCommit, onCancel, autoFocus, step, min, max }) {
    const [text, setText] = useState(value == null ? "" : String(value));
    useEffect(() => {
        setText(value == null ? "" : String(value));
    }, [value]);
    const parse = (s) => {
        const n = parseFloat(s.replace(",", "."));
        return Number.isFinite(n) ? n : undefined;
    };
    return (_jsx(TextField, { variant: "standard", size: "small", value: text, onChange: (e) => {
            setText(e.target.value);
            onChange(parse(e.target.value));
        }, onKeyDown: (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                onCommit === null || onCommit === void 0 ? void 0 : onCommit();
            }
            if (e.key === "Escape") {
                e.preventDefault();
                onCancel === null || onCancel === void 0 ? void 0 : onCancel();
            }
        }, onBlur: () => onCommit === null || onCommit === void 0 ? void 0 : onCommit(), autoFocus: autoFocus, inputProps: { inputMode: "decimal", step, min, max }, fullWidth: true }));
}
