import type { RowId, RowModel } from '../types';
export declare function useExpandedRows(controlledExpanded: Set<RowId> | RowId[] | undefined, onRowToggle?: (id: RowId, expanded: boolean) => void): {
    readonly expanded: Set<RowId>;
    readonly toggle: (id: RowId) => void;
};
export declare function useValidTargets<T extends object>(activeId: string | null, byKey: Map<string, RowModel<T>>, getValidDropTargets?: (source: RowModel<T>) => Promise<Set<RowId> | RowId[]> | Set<RowId> | RowId[]): Set<RowId> | null;
