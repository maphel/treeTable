import { TextField, InputAdornment } from "@mui/material"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { formatPercentLive, formatPercentValue, getLocaleSeparators, parsePercent } from "../formatters/percentage.js"


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
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [text, setText] = useState(formatValue(value, locale))

    const separators = useMemo(() => getLocaleSeparators(locale), [locale])
    useEffect(() => {
        setText(formatValue(value, locale))
    }, [value, locale])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target
        const prev = input.value
        const sel = input.selectionStart ?? prev.length
        const dec = separators.decimal
        const otherDec = dec === "." ? "," : "."
        const leftStr = prev.slice(0, sel)
        const countUnits = (s: string) => {
            let units = 0
            let seenDec = false
            for (let i = 0; i < s.length; i++) {
                const ch = s[i]
                if (/\d/.test(ch)) units++
                else if (!seenDec && (ch === dec || ch === otherDec)) {
                    units++
                    seenDec = true
                }
            }
            return units
        }
        const unitsLeft = countUnits(leftStr)

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
            let newPos = 0
            let units = 0
            const v = el.value
            for (let i = 0; i < v.length; i++) {
                const ch = v[i]
                if (/\d/.test(ch)) units++
                else if (ch === dec || ch === otherDec) units++
                if (units >= unitsLeft) { newPos = i + 1; break }
                newPos = i + 1
            }
            try {
                el.setSelectionRange(newPos, newPos)
            } catch {}
        })
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault()
            onCommit?.()
        }
        if (e.key === "Escape") {
            e.preventDefault()
            onCancel?.()
        }
    }

    const handleBlur = () => onCommit?.()

    return (
        <TextField
            variant="standard"
            size="small"
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            autoFocus={autoFocus}
            inputRef={inputRef}
            fullWidth
            InputProps={{
                endAdornment: (
                    <InputAdornment position="end">%</InputAdornment>
                )
            }}
            inputProps={{
                inputMode: "decimal",
                min,
                max,
                step
            }}
        />
    )
}
