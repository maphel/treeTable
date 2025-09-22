import * as React from 'react';
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
