import type { ColumnDef, RowId, RowModel, ViewMode } from '../types';
import type { VisibleRow } from './types';
export declare function toIdSet(ids?: Set<RowId> | RowId[]): Set<RowId>;
export declare function buildVisibleRows<T extends object>(nodes: ReadonlyArray<RowModel<T>>, level: number, expandedIds: Set<RowId>, out: VisibleRow<T>[]): void;
export declare function buildRowIndexMap<T extends object>(rows?: ReadonlyArray<RowModel<T>>): Map<string, RowModel<T>>;
export declare function getVisibleColumns<T extends object>(columns: ColumnDef<T>[], viewMode: ViewMode | undefined): ColumnDef<T>[];
