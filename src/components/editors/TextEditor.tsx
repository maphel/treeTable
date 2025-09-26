import { TextField } from "@mui/material"
import { useEffect, useRef } from "react"


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
    const ref = useRef<HTMLInputElement | null>(null)
    useEffect(() => {
        if (autoFocus && ref.current) {
            try {
                ref.current.select()
            } catch {}
        }
    }, [autoFocus])

    return (
        <TextField
            variant="standard"
            size="small"
            value={typeof value === "string" ? value : value ?? ""}
            inputRef={ref}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    e.preventDefault()
                    onCommit?.()
                }
                if (e.key === "Escape") {
                    e.preventDefault()
                    onCancel?.()
                }
            }}
            onBlur={() => onCommit?.()}
            autoFocus={autoFocus}
            fullWidth
        />
    )
}
