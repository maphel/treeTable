import * as React from 'react';
import type { RowId, RowModel } from '../types';
import { toIdSet } from './utils';

export function useExpandedRows(
  controlledExpanded: Set<RowId> | RowId[] | undefined,
  onRowToggle?: (id: RowId, expanded: boolean) => void
) {
  const controlled = typeof controlledExpanded !== 'undefined';
  const [internalExpanded, setInternalExpanded] = React.useState<Set<RowId>>(toIdSet(controlledExpanded));

  React.useEffect(() => {
    if (controlled) {
      setInternalExpanded(toIdSet(controlledExpanded));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlled, controlledExpanded]);

  const expanded = controlled ? toIdSet(controlledExpanded) : internalExpanded;

  const toggle = React.useCallback(
    (id: RowId) => {
      const isExpanded = expanded.has(id);
      if (!controlled) {
        setInternalExpanded(prev => {
          const next = new Set(prev);
          if (isExpanded) next.delete(id); else next.add(id);
          return next;
        });
      }
      onRowToggle?.(id, !isExpanded);
    },
    [expanded, controlled, onRowToggle]
  );

  return { expanded, toggle } as const;
}

export function useValidTargets<T extends object>(
  activeId: string | null,
  byKey: Map<string, RowModel<T>>,
  getValidDropTargets?: (source: RowModel<T>) => Promise<Set<RowId> | RowId[]> | Set<RowId> | RowId[]
) {
  const [validTargets, setValidTargets] = React.useState<Set<RowId> | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!activeId || !getValidDropTargets) {
        setValidTargets(null);
        return;
      }
      const src = byKey.get(activeId);
      if (!src) return;
      const res = await getValidDropTargets(src);
      if (cancelled) return;
      const setVal = res instanceof Set ? res : new Set<RowId>(res as RowId[]);
      setValidTargets(setVal);
    }
    void load();
    return () => { cancelled = true; };
  }, [activeId, byKey, getValidDropTargets]);

  return validTargets;
}
