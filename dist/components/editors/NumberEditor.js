import { jsx as _jsx } from "react/jsx-runtime";
import { TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { useCommitCancelHandlers, useSelectOnAutoFocus, compactTextFieldSx } from "./shared.js";
export default function NumberEditor({ value, onChange, onCommit, onCancel, autoFocus, step, min, max, size = "medium" }) {
    const [text, setText] = useState(value == null ? "" : String(value));
    useEffect(() => {
        setText(value == null ? "" : String(value));
    }, [value]);
    const ref = useSelectOnAutoFocus(autoFocus);
    const { onKeyDown, onBlur } = useCommitCancelHandlers(onCommit, onCancel);
    const parse = (s) => {
        const n = parseFloat(s.replace(",", "."));
        return Number.isFinite(n) ? n : undefined;
    };
    return (_jsx(TextField, { variant: "standard", size: size, margin: "dense", value: text, inputRef: ref, onChange: (e) => {
            setText(e.target.value);
            onChange(parse(e.target.value));
        }, onKeyDown: onKeyDown, onBlur: onBlur, autoFocus: autoFocus, inputProps: { inputMode: "decimal", step, min, max, style: { textAlign: 'right' } }, fullWidth: true, sx: compactTextFieldSx }));
}
