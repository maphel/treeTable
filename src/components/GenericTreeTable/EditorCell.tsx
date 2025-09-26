import { Box } from "@mui/material"
import React, {
    type Dispatch,
    type SetStateAction,
    useCallback,
    useEffect,
    useRef,
    useState
} from "react"

import type { ColumnDef, RowModel } from "./genericTreeTable.types.js"
import { getNestedValue } from "./genericTreeTable.utils.js"


export type EditorCellProps<T extends object> = {
    row: RowModel<T>
    col: ColumnDef<T>
    mode: "locked" | "unlocked" | "off"
    cellKey: string
    editingKey: string | null
    editingValue: any
    setEditingKey: Dispatch<SetStateAction<string | null>>
    setEditingValue: Dispatch<SetStateAction<any>>
    markAutoClosed: (key: string) => void
    onEditCommit?: (
        row: RowModel<T>,
        column: ColumnDef<T>,
        next: unknown
    ) => Promise<void> | void
}

export default function EditorCell<T extends object>({
    row,
    col,
    mode,
    cellKey,
    editingKey,
    editingValue,
    setEditingKey,
    setEditingValue,
    markAutoClosed,
    onEditCommit
}: EditorCellProps<T>) {
    const key = cellKey
    const raw = getNestedValue(row, col.id)
    const always = mode === "locked"
    const active = always || editingKey === key
    const [val, setVal] = useState<any>(
        active ? (always ? raw : editingValue) : raw
    )

    useEffect(() => {
        if (always) {
            setVal(raw)
        } else if (editingKey === key) {
            setVal(editingValue)
        } else {
            setVal(raw)
        }
    }, [raw, editingKey, editingValue, key, always])

    const commitWithValue = useCallback(
        async (v: any) => {
            const parsed = col.valueParser ? col.valueParser(v, row) : v
            try {
                await onEditCommit?.(row, col, parsed)
                if (!always) {
                    // Only clear editing state if this cell is still the active one.
                    setEditingKey((prev: string | null) => {
                        const shouldClear = prev === key
                        if (shouldClear) setEditingValue(undefined)
                        return shouldClear ? null : prev
                    })
                }
                if (mode === "unlocked") {
                    markAutoClosed(key)
                }
            } catch (e) {
                console.warn("Commit failed", e)
            }
        },
        [
            col,
            row,
            always,
            mode,
            key,
            onEditCommit,
            setEditingKey,
            setEditingValue,
            markAutoClosed
        ]
    )

    const commit = useCallback(async () => {
        await commitWithValue(val)
    }, [commitWithValue, val])

    const cancel = useCallback(() => {
        if (!always) {
            // Only clear if we are still the active editor
            setEditingKey((prev: string | null) => {
                const shouldClear = prev === key
                if (shouldClear) setEditingValue(undefined)
                return shouldClear ? null : prev
            })
        } else {
            setVal(raw)
        }
        if (mode === "unlocked") {
            markAutoClosed(key)
        }
    }, [always, raw, mode, key, setEditingKey, setEditingValue, markAutoClosed])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault()
            e.stopPropagation()
            commit().then()
        } else if (e.key === "Escape") {
            e.preventDefault()
            e.stopPropagation()
            cancel()
        }
    }

    if (!col.editor) return null

    const autoCommit =
        typeof col.autoCommitOnChange === "function"
            ? (col.autoCommitOnChange as any)(row)
            : col.autoCommitOnChange
    const commitOnceRef = useRef(false)

    const handleChange = useCallback(
        (next: any) => {
            setVal(next)
            if (autoCommit && !always && !commitOnceRef.current) {
                commitOnceRef.current = true
                commitWithValue(next).then()
            }
        },
        [autoCommit, always, commitWithValue]
    )

    return (
        <Box onKeyDown={handleKeyDown} sx={{ width: "100%" }}>
            {col.editor({
                row,
                value: val,
                onChange: handleChange,
                commit: () => void commit(),
                cancel,
                autoFocus: !always && editingKey === key
            })}
        </Box>
    )
}
