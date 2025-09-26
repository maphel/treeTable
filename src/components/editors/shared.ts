import { useCallback, useEffect, useRef } from "react"

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
    if (autoFocus && ref.current) {
      try {
        ref.current.select()
      } catch {}
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

