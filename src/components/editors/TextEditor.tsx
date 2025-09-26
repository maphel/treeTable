import { TextField } from "@mui/material"
import { useCommitCancelHandlers, useSelectOnAutoFocus } from "./shared.js"


export type TextEditorProps = {
    value: unknown
    onChange: (next: string) => void
    onCommit?: () => void
    onCancel?: () => void
    autoFocus?: boolean
}

export default function TextEditor({
    value,
    onChange,
    onCommit,
    onCancel,
    autoFocus
}: TextEditorProps) {
    const ref = useSelectOnAutoFocus<HTMLInputElement>(autoFocus)
    const { onKeyDown, onBlur } = useCommitCancelHandlers(onCommit, onCancel)

    return (
        <TextField
            variant="standard"
            size="small"
            value={typeof value === "string" ? value : value ?? ""}
            inputRef={ref}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={onBlur}
            autoFocus={autoFocus}
            fullWidth
        />
    )
}
