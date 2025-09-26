import { PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { useCallback, useEffect, useState } from "react"

import type {
    ColumnDef,
    DragActivationOptions,
    RowModel
} from "./genericTreeTable.types.js"
import { toIdSet } from "./genericTreeTable.utils.js"

export function useExpandedRows(
    controlledExpanded: Set<string> | string[] | undefined,
    onRowToggle?: (id: string, expanded: boolean) => void,
    allExpandableIds?: Set<string>
) {
    const controlled = typeof controlledExpanded !== "undefined"
    const [internalExpanded, setInternalExpanded] = useState<Set<string>>(
        toIdSet(controlledExpanded)
    )
    const [hasInteracted, setHasInteracted] = useState(false)

    useEffect(() => {
        if (controlled) {
            setInternalExpanded(toIdSet(controlledExpanded))
        }
    }, [controlled, controlledExpanded])

    const expanded = controlled ? toIdSet(controlledExpanded) : internalExpanded

    const toggle = useCallback(
        (id: string) => {
            // Determine current expansion state as rendered, accounting for the
            // initial "expand all when empty" behavior.
            const currentlyExpanded = (() => {
                // When no interactions yet and the set is empty, the table renders
                // as "expanded" for all expandable ids.
                if (!hasInteracted && (!expanded || expanded.size === 0)) {
                    return allExpandableIds ? allExpandableIds.has(id) : false
                }
                return expanded.has(id)
            })()
            if (!controlled) {
                setInternalExpanded((prev) => {
                    if (!hasInteracted && prev.size === 0 && allExpandableIds) {
                        setHasInteracted(true)
                        const next = new Set(allExpandableIds)
                        if (currentlyExpanded || allExpandableIds.has(id)) {
                            next.delete(id)
                        } else {
                            next.add(id)
                        }
                        return next
                    }
                    setHasInteracted(true)
                    const next = new Set(prev)
                    if (currentlyExpanded) {
                        next.delete(id)
                    } else {
                        next.add(id)
                    }
                    return next
                })
            }
            // Reflect the actual next state in the callback
            onRowToggle?.(id, !currentlyExpanded)
        },
        [expanded, controlled, onRowToggle, allExpandableIds, hasInteracted]
    )

    return { expanded, toggle } as const
}

export function useValidTargets<T extends object>(
    activeId: string | null,
    byKey: Map<string, RowModel<T>>,
    getValidDropTargets?: (
        source: RowModel<T>
    ) => Promise<Set<string> | string[]> | Set<string> | string[]
) {
    const [validTargets, setValidTargets] = useState<Set<string> | null>(null)

    useEffect(() => {
        let cancelled = false

        async function load() {
            if (!activeId || !getValidDropTargets) {
                setValidTargets(null)
                return
            }
            const src = byKey.get(activeId)
            if (!src) return
            const res = await getValidDropTargets(src)
            if (cancelled) return
            const setVal =
                res instanceof Set ? res : new Set<string>(res as string[])
            setValidTargets(setVal)
        }

        // eslint-disable-next-line no-void
        void load()
        return () => {
            cancelled = true
        }
    }, [activeId, byKey, getValidDropTargets])

    return validTargets
}

export function useDragSensors(dragActivation?: DragActivationOptions) {
    return useSensors(
        useSensor(
            PointerSensor,
            ((): any => {
                const a = dragActivation
                if (a?.mode === "distance") {
                    return {
                        activationConstraint: { distance: a.distance ?? 3 }
                    }
                }
                return {
                    activationConstraint: {
                        delay: a?.delay ?? 150,
                        tolerance: a?.tolerance ?? 5
                    }
                }
            })()
        )
    )
}

export function useInlineEditing<T extends object>() {
    const [editingKey, setEditingKey] = useState<string | null>(null)
    const [editingValue, setEditingValue] = useState<any>(undefined)
    const [autoClosedKeys, setAutoClosedKeys] = useState<Set<string>>(new Set())

    const startEdit = useCallback((row: RowModel<T>, column: ColumnDef<T>) => {
        const key = `${String(row.id)}::${column.id}`
        const raw = (row as any)[column.id]
        setEditingKey(key)
        setEditingValue(raw)
    }, [])

    const markAutoClosed = useCallback((key: string) => {
        setAutoClosedKeys((prev) => {
            if (prev.has(key)) return prev
            const next = new Set(prev)
            next.add(key)
            return next
        })
    }, [])

    const clearAutoClosedForRow = useCallback((rowId: string) => {
        setAutoClosedKeys((prev) => {
            if (prev.size === 0) return prev
            const prefix = `${String(rowId)}::`
            let changed = false
            const next = new Set<string>()
            for (const k of prev) {
                if (k.startsWith(prefix)) {
                    changed = true
                    continue
                }
                next.add(k)
            }
            return changed ? next : prev
        })
    }, [])

    return {
        editingKey,
        setEditingKey,
        editingValue,
        setEditingValue,
        autoClosedKeys,
        startEdit,
        markAutoClosed,
        clearAutoClosedForRow
    } as const
}
