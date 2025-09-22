import * as React from 'react';
import { PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { toIdSet } from './utils';
export function useExpandedRows(controlledExpanded, onRowToggle) {
    const controlled = typeof controlledExpanded !== 'undefined';
    const [internalExpanded, setInternalExpanded] = React.useState(toIdSet(controlledExpanded));
    React.useEffect(() => {
        if (controlled) {
            setInternalExpanded(toIdSet(controlledExpanded));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [controlled, controlledExpanded]);
    const expanded = controlled ? toIdSet(controlledExpanded) : internalExpanded;
    const toggle = React.useCallback((id) => {
        const isExpanded = expanded.has(id);
        if (!controlled) {
            setInternalExpanded(prev => {
                const next = new Set(prev);
                if (isExpanded)
                    next.delete(id);
                else
                    next.add(id);
                return next;
            });
        }
        onRowToggle === null || onRowToggle === void 0 ? void 0 : onRowToggle(id, !isExpanded);
    }, [expanded, controlled, onRowToggle]);
    return { expanded, toggle };
}
export function useValidTargets(activeId, byKey, getValidDropTargets) {
    const [validTargets, setValidTargets] = React.useState(null);
    React.useEffect(() => {
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
        void load();
        return () => { cancelled = true; };
    }, [activeId, byKey, getValidDropTargets]);
    return validTargets;
}
/** Build pointer sensors with configurable activation (delay/tolerance or distance). */
export function useDragSensors(dragActivation) {
    return useSensors(useSensor(PointerSensor, (() => {
        var _a, _b, _c;
        const a = dragActivation;
        if ((a === null || a === void 0 ? void 0 : a.mode) === 'distance') {
            return { activationConstraint: { distance: (_a = a.distance) !== null && _a !== void 0 ? _a : 3 } };
        }
        return { activationConstraint: { delay: (_b = a === null || a === void 0 ? void 0 : a.delay) !== null && _b !== void 0 ? _b : 150, tolerance: (_c = a === null || a === void 0 ? void 0 : a.tolerance) !== null && _c !== void 0 ? _c : 5 } };
    })()));
}
/** Centralize inline editing state and helpers. */
export function useInlineEditing() {
    const [editingKey, setEditingKey] = React.useState(null);
    const [editingValue, setEditingValue] = React.useState(undefined);
    const [autoClosedKeys, setAutoClosedKeys] = React.useState(new Set());
    const startEdit = React.useCallback((row, column) => {
        const key = `${String(row.id)}::${column.id}`;
        const raw = row[column.id];
        setEditingKey(key);
        setEditingValue(raw);
    }, []);
    const markAutoClosed = React.useCallback((key) => {
        setAutoClosedKeys(prev => {
            if (prev.has(key))
                return prev;
            const next = new Set(prev);
            next.add(key);
            return next;
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
    };
}
