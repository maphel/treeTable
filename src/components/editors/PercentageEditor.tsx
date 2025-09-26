import { TextField, InputAdornment } from "@mui/material"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { formatPercentLive, formatPercentValue, getLocaleSeparators, parsePercent } from "../formatters/percentage.js"
import { useCommitCancelHandlers, useSelectOnAutoFocus, countUnitsBeforeCaret, restoreCaretByUnits, getOtherDecimal, compactTextFieldSx } from "./shared.js"


export type PercentageEditorProps = {
    value: number | undefined
    onChange: (next: number | undefined) => void
    onCommit?: () => void
    onCancel?: () => void
    autoFocus?: boolean
    min?: number
    max?: number
    step?: number
    locale?: string
}

function formatValue(value: number | undefined, locale: string) {
    if (value === undefined) return ""
    return formatPercentValue(value, locale)
}

export default function PercentageEditor({
    value,
    onChange,
    onCommit,
    onCancel,
    autoFocus,
    min,
    max,
    step,
    locale = "de-DE"
}: PercentageEditorProps) {
    const inputRef = useSelectOnAutoFocus<HTMLInputElement>(autoFocus)
    const [text, setText] = useState(formatValue(value, locale))

    const separators = useMemo(() => getLocaleSeparators(locale), [locale])
    useEffect(() => {
        setText(formatValue(value, locale))
    }, [value, locale])
    const { onKeyDown, onBlur } = useCommitCancelHandlers(onCommit, onCancel)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target
        const prev = input.value
        const sel = input.selectionStart ?? prev.length
        const dec = separators.decimal
        const otherDec = getOtherDecimal(dec)
        const unitsLeft = countUnitsBeforeCaret(prev, sel, dec, otherDec)

        const nextStr = formatPercentLive(prev, separators)
        setText(nextStr)

        const parsed = parsePercent(nextStr, locale)
        const finalValue = parsed === undefined ? undefined : parsed
        if (finalValue !== value) {
            onChange(finalValue)
        }

        requestAnimationFrame(() => {
            const el = inputRef.current
            if (!el) return
            restoreCaretByUnits(el, unitsLeft, dec, true)
        })
    }

    return (
        <TextField
            variant="standard"
            size="small"
            margin="dense"
            value={text}
            onChange={handleChange}
            onKeyDown={onKeyDown}
            onBlur={onBlur}
            autoFocus={autoFocus}
            inputRef={inputRef}
            fullWidth
            InputProps={{
                endAdornment: (
                    <InputAdornment position="end" sx={{ m: 0 }}>%</InputAdornment>
                )
            }}
            inputProps={{
                inputMode: "decimal",
                min,
                max,
                step,
                style: { textAlign: 'right' }
            }}
            sx={compactTextFieldSx}
        />
    )
}
