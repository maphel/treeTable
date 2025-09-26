import { jsx as _jsx } from "react/jsx-runtime";
import { TextField } from "@mui/material";
import { useCommitCancelHandlers, useSelectOnAutoFocus, compactTextFieldSx } from "./shared.js";
export default function TextEditor({ value, onChange, onCommit, onCancel, autoFocus, size = "medium" }) {
    const ref = useSelectOnAutoFocus(autoFocus);
    const { onKeyDown, onBlur } = useCommitCancelHandlers(onCommit, onCancel);
    return (_jsx(TextField, { variant: "standard", size: size, margin: "dense", value: typeof value === "string" ? value : value !== null && value !== void 0 ? value : "", inputRef: ref, onChange: (e) => onChange(e.target.value), onKeyDown: onKeyDown, onBlur: onBlur, autoFocus: autoFocus, fullWidth: true, sx: compactTextFieldSx }));
}
