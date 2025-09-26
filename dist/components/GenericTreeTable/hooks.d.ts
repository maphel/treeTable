import type { ColumnDef, DragActivationOptions, RowModel } from "./genericTreeTable.types.js";
export declare function useExpandedRows(controlledExpanded: Set<string> | string[] | undefined, onRowToggle?: (id: string, expanded: boolean) => void, allExpandableIds?: Set<string>): {
    readonly expanded: Set<string>;
    readonly toggle: (id: string) => void;
};
export declare function useValidTargets<T extends object>(activeId: string | null, byKey: Map<string, RowModel<T>>, getValidDropTargets?: (source: RowModel<T>) => Promise<Set<string> | string[]> | Set<string> | string[]): Set<string> | null;
export declare function useDragSensors(dragActivation?: DragActivationOptions): import("@dnd-kit/core").SensorDescriptor<import("@dnd-kit/core").SensorOptions>[];
export declare function useInlineEditing<T extends object>(): {
    readonly editingKey: string | null;
    readonly setEditingKey: import("react").Dispatch<import("react").SetStateAction<string | null>>;
    readonly editingValue: any;
    readonly setEditingValue: import("react").Dispatch<any>;
    readonly autoClosedKeys: Set<string>;
    readonly startEdit: (row: RowModel<T>, column: ColumnDef<T>) => void;
    readonly markAutoClosed: (key: string) => void;
};
