import * as React from 'react';
import { PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragActivationOptions, RowId, RowModel, ColumnDef } from '../types';
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

/** Build pointer sensors with configurable activation (delay/tolerance or distance). */
export function useDragSensors(dragActivation?: DragActivationOptions) {
  return useSensors(
    useSensor(
      PointerSensor,
      ((): any => {
        const a = dragActivation;
        if (a?.mode === 'distance') {
          return { activationConstraint: { distance: a.distance ?? 3 } };
        }
        return { activationConstraint: { delay: a?.delay ?? 150, tolerance: a?.tolerance ?? 5 } };
      })()
    )
  );
}

/** Centralize inline editing state and helpers. */
export function useInlineEditing<T extends object = {}>() {
  const [editingKey, setEditingKey] = React.useState<string | null>(null);
  const [editingValue, setEditingValue] = React.useState<any>(undefined);
  const [autoClosedKeys, setAutoClosedKeys] = React.useState<Set<string>>(new Set());

  const startEdit = React.useCallback((row: RowModel<T>, column: ColumnDef<T>) => {
    const key = `${String(row.id)}::${column.id}`;
    const raw = (row as any)[column.id];
    setEditingKey(key);
    setEditingValue(raw);
  }, []);

  const markAutoClosed = React.useCallback((key: string) => {
    setAutoClosedKeys(prev => {
      if (prev.has(key)) return prev;
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
  } as const;
}
