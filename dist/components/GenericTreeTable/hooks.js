import { PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useCallback, useEffect, useState } from "react";
import { toIdSet } from "./genericTreeTable.utils.js";
export function useExpandedRows(controlledExpanded, onRowToggle, allExpandableIds) {
    const controlled = typeof controlledExpanded !== "undefined";
    const [internalExpanded, setInternalExpanded] = useState(toIdSet(controlledExpanded));
    const [hasInteracted, setHasInteracted] = useState(false);
    useEffect(() => {
        if (controlled) {
            setInternalExpanded(toIdSet(controlledExpanded));
        }
    }, [controlled, controlledExpanded]);
    const expanded = controlled ? toIdSet(controlledExpanded) : internalExpanded;
    const toggle = useCallback((id) => {
        // Determine current expansion state as rendered, accounting for the
        // initial "expand all when empty" behavior.
        const currentlyExpanded = (() => {
            // When no interactions yet and the set is empty, the table renders
            // as "expanded" for all expandable ids.
            if (!hasInteracted && (!expanded || expanded.size === 0)) {
                return allExpandableIds ? allExpandableIds.has(id) : false;
            }
            return expanded.has(id);
        })();
        if (!controlled) {
            setInternalExpanded((prev) => {
                if (!hasInteracted && prev.size === 0 && allExpandableIds) {
                    setHasInteracted(true);
                    const next = new Set(allExpandableIds);
                    if (currentlyExpanded || allExpandableIds.has(id)) {
                        next.delete(id);
                    }
                    else {
                        next.add(id);
                    }
                    return next;
                }
                setHasInteracted(true);
                const next = new Set(prev);
                if (currentlyExpanded) {
                    next.delete(id);
                }
                else {
                    next.add(id);
                }
                return next;
            });
        }
        // Reflect the actual next state in the callback
        onRowToggle === null || onRowToggle === void 0 ? void 0 : onRowToggle(id, !currentlyExpanded);
    }, [expanded, controlled, onRowToggle, allExpandableIds, hasInteracted]);
    return { expanded, toggle };
}
export function useValidTargets(activeId, byKey, getValidDropTargets) {
    const [validTargets, setValidTargets] = useState(null);
    useEffect(() => {
        let cancelled = false;
        async function load() {
            if (!activeId || !getValidDropTargets) {
                setValidTargets(null);
                return;
            }
            const src = byKey.get(activeId);
            if (!src)
                return;
            const res = await getValidDropTargets(src);
            if (cancelled)
                return;
            const setVal = res instanceof Set ? res : new Set(res);
            setValidTargets(setVal);
        }
        // eslint-disable-next-line no-void
        void load();
        return () => {
            cancelled = true;
        };
    }, [activeId, byKey, getValidDropTargets]);
    return validTargets;
}
export function useDragSensors(dragActivation) {
    return useSensors(useSensor(PointerSensor, (() => {
        var _a, _b, _c;
        const a = dragActivation;
        if ((a === null || a === void 0 ? void 0 : a.mode) === "distance") {
            return {
                activationConstraint: { distance: (_a = a.distance) !== null && _a !== void 0 ? _a : 3 }
            };
        }
        return {
            activationConstraint: {
                delay: (_b = a === null || a === void 0 ? void 0 : a.delay) !== null && _b !== void 0 ? _b : 150,
                tolerance: (_c = a === null || a === void 0 ? void 0 : a.tolerance) !== null && _c !== void 0 ? _c : 5
            }
        };
    })()));
}
export function useInlineEditing() {
    const [editingKey, setEditingKey] = useState(null);
    const [editingValue, setEditingValue] = useState(undefined);
    const [autoClosedKeys, setAutoClosedKeys] = useState(new Set());
    const startEdit = useCallback((row, column) => {
        const key = `${String(row.id)}::${column.id}`;
        const raw = row[column.id];
        setEditingKey(key);
        setEditingValue(raw);
    }, []);
    const markAutoClosed = useCallback((key) => {
        setAutoClosedKeys((prev) => {
            if (prev.has(key))
                return prev;
            const next = new Set(prev);
            next.add(key);
            return next;
        });
    }, []);
    const clearAutoClosedForRow = useCallback((rowId) => {
        setAutoClosedKeys((prev) => {
            if (prev.size === 0)
                return prev;
            const prefix = `${String(rowId)}::`;
            let changed = false;
            const next = new Set();
            for (const k of prev) {
                if (k.startsWith(prefix)) {
                    changed = true;
                    continue;
                }
                next.add(k);
            }
            return changed ? next : prev;
        });
    }, []);
    return {
        editingKey,
        setEditingKey,
        editingValue,
        setEditingValue,
        autoClosedKeys,
        startEdit,
        markAutoClosed,
        clearAutoClosedForRow
    };
}
