import type { ColumnDef, RowId, RowModel } from '../types';
import type { VisibleRow } from './types';

export function toIdSet(ids?: Set<RowId> | RowId[]): Set<RowId> {
  if (!ids) return new Set<RowId>();
  return ids instanceof Set ? ids : new Set<RowId>(ids);
}

export function buildVisibleRows<T extends object>(
  nodes: ReadonlyArray<RowModel<T>>,
  level: number,
  expandedIds: Set<RowId>,
  out: VisibleRow<T>[]
) {
  for (const n of nodes) {
    const hasChildren = !!(n.children && n.children.length > 0);
    const expanded = hasChildren && expandedIds.has(n.id);
    out.push({ row: n, level, hasChildren, expanded });
    if (hasChildren && expanded) {
      buildVisibleRows(n.children!, level + 1, expandedIds, out);
    }
  }
}

export function buildRowIndexMap<T extends object>(rows?: ReadonlyArray<RowModel<T>>) {
  const m = new Map<string, RowModel<T>>();
  const add = (nodes?: ReadonlyArray<RowModel<T>>) => {
    nodes?.forEach(n => {
      m.set(String(n.id), n);
      if (n.children) add(n.children);
    });
  };
  add(rows);
  return m;
}

export function getVisibleColumns<T extends object>(columns: ColumnDef<T>[], viewContext: unknown) {
  return (columns || []).filter((c) => (typeof c.getIsVisible === 'function' ? c.getIsVisible(viewContext) : true));
}
