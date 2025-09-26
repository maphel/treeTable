import { TextField } from "@mui/material"
import { useEffect, useState } from "react"
import { useCommitCancelHandlers, useSelectOnAutoFocus } from "./shared.js"


export type NumberEditorProps = {
    value: unknown
    onChange: (next: number | undefined) => void
    onCommit?: () => void
    onCancel?: () => void
    autoFocus?: boolean
    step?: number
    min?: number
    max?: number
}

export default function NumberEditor({
    value,
    onChange,
    onCommit,
    onCancel,
    autoFocus,
    step,
    min,
    max
}: NumberEditorProps) {
    const [text, setText] = useState(value == null ? "" : String(value))
    useEffect(() => {
        setText(value == null ? "" : String(value))
    }, [value])
    const ref = useSelectOnAutoFocus<HTMLInputElement>(autoFocus)
    const { onKeyDown, onBlur } = useCommitCancelHandlers(onCommit, onCancel)
    const parse = (s: string): number | undefined => {
        const n = parseFloat(s.replace(",", "."))
        return Number.isFinite(n) ? n : undefined
    }
    return (
        <TextField
            variant="standard"
            size="small"
            value={text}
            inputRef={ref}
            onChange={(e) => {
                setText(e.target.value)
                onChange(parse(e.target.value))
            }}
            onKeyDown={onKeyDown}
            onBlur={onBlur}
            autoFocus={autoFocus}
            inputProps={{ inputMode: "decimal", step, min, max }}
            fullWidth
        />
    )
}
