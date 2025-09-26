import { useCallback, useEffect, useRef } from "react"
import type { SxProps, Theme } from "@mui/material/styles"

export function useCommitCancelHandlers(
  onCommit?: () => void,
  onCancel?: () => void
) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        onCommit?.()
      }
      if (e.key === "Escape") {
        e.preventDefault()
        onCancel?.()
      }
    },
    [onCommit, onCancel]
  )

  const handleBlur = useCallback(() => onCommit?.(), [onCommit])

  return { onKeyDown: handleKeyDown, onBlur: handleBlur }
}

export function useSelectOnAutoFocus<T extends HTMLInputElement>(
  autoFocus?: boolean
) {
  const ref = useRef<T | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!autoFocus || !el) return

    let rafId: number | null = null
    let ran = false
    const selectAll = () => {
      try {
        el.select()
      } catch {}
    }

    const onFocus = () => {
      if (ran) return
      ran = true
      // Defer selection to the next frame to avoid being overridden
      rafId = requestAnimationFrame(() => {
        selectAll()
      })
    }

    el.addEventListener('focus', onFocus)

    // If already focused (rare), still defer selection to next frame
    if (document.activeElement === el) {
      ran = true
      rafId = requestAnimationFrame(() => {
        selectAll()
      })
    }

    return () => {
      el.removeEventListener('focus', onFocus)
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [autoFocus])
  return ref
}

export const getOtherDecimal = (dec: string) => (dec === "." ? "," : ".")

export function countUnitsBeforeCaret(
  s: string,
  caretPos: number,
  dec: string,
  otherDec?: string
) {
  let units = 0
  let seenDec = false
  const limit = Math.min(caretPos, s.length)
  for (let i = 0; i < limit; i++) {
    const ch = s[i]
    if (/\d/.test(ch)) units++
    else if (!seenDec && (ch === dec || (otherDec && ch === otherDec))) {
      units++
      seenDec = true
    }
  }
  return units
}

// Compact TextField styles for dense table cells
export const compactTextFieldSx: SxProps<Theme> = {
  '& .MuiInputBase-root': {
    fontSize: 15,
    lineHeight: 1.2,
    minHeight: 0,
  },
    '& .MuiInputBase-input': {
    padding: 0, 
    margin: 0,
  },
  '& .MuiInput-underline:before': {
    borderBottomWidth: 1,
  },
  '& .MuiInput-underline:after': {
    borderBottomWidth: 1,
  },
  '& .MuiInputAdornment-root': {
    '& .MuiTypography-root': {
      padding: "0 5px",
      fontSize: 14,
      lineHeight: 1,
      color: "black"
    },
  },
}

export function restoreCaretByUnits(
  input: HTMLInputElement,
  unitsLeft: number,
  dec: string,
  includeOtherDecimal = false
) {
  let newPos = 0
  let units = 0
  const v = input.value
  for (let i = 0; i < v.length; i++) {
    const ch = v[i]
    if (/\d/.test(ch)) units++
    else if (ch === dec || (includeOtherDecimal && (ch === "." || ch === ","))) units++
    if (units >= unitsLeft) {
      newPos = i + 1
      break
    }
    newPos = i + 1
  }
  try {
    input.setSelectionRange(newPos, newPos)
  } catch {}
}
