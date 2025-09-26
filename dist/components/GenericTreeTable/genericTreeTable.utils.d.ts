import type { ColumnDef, RowModel, VisibleRow } from "./genericTreeTable.types.js";
export declare function toIdSet(ids?: Set<string> | string[]): Set<string>;
export declare function buildVisibleRows<T extends object>(nodes: ReadonlyArray<RowModel<T>>, level: number, expandedIds: Set<string>, out: VisibleRow<T>[]): void;
export declare function buildRowIndexMap<T extends object>(rows?: ReadonlyArray<RowModel<T>>): Map<string, RowModel<T>>;
export declare function getVisibleColumns<T extends object>(columns: ColumnDef<T>[], viewContext: unknown): ColumnDef<T>[];
export declare function getNestedValue(obj: any, path: string): any;
export declare function collectExpandableRowIds<T extends object>(nodes: ReadonlyArray<RowModel<T>>, out?: Set<string>): Set<string>;
