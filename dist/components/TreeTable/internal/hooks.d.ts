import * as React from 'react';
import type { DragActivationOptions, RowId, RowModel, ColumnDef } from '../types';
export declare function useExpandedRows(controlledExpanded: Set<RowId> | RowId[] | undefined, onRowToggle?: (id: RowId, expanded: boolean) => void): {
    readonly expanded: Set<RowId>;
    readonly toggle: (id: RowId) => void;
};
export declare function useValidTargets<T extends object>(activeId: string | null, byKey: Map<string, RowModel<T>>, getValidDropTargets?: (source: RowModel<T>) => Promise<Set<RowId> | RowId[]> | Set<RowId> | RowId[]): Set<RowId> | null;
/** Build pointer sensors with configurable activation (delay/tolerance or distance). */
export declare function useDragSensors(dragActivation?: DragActivationOptions): import("@dnd-kit/core").SensorDescriptor<import("@dnd-kit/core").SensorOptions>[];
/** Centralize inline editing state and helpers. */
export declare function useInlineEditing<T extends object = {}>(): {
    readonly editingKey: string | null;
    readonly setEditingKey: React.Dispatch<React.SetStateAction<string | null>>;
    readonly editingValue: any;
    readonly setEditingValue: React.Dispatch<any>;
    readonly autoClosedKeys: Set<string>;
    readonly startEdit: (row: RowModel<T>, column: ColumnDef<T>) => void;
    readonly markAutoClosed: (key: string) => void;
};
