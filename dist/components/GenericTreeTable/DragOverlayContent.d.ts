import type { ColumnDef, RowModel, VisibleRow } from "./genericTreeTable.types.js";
export declare function DragOverlayContent<T extends object>({ activeId, byKey, visible, columns, size }: {
    activeId: string | null;
    byKey: Map<string, RowModel<T>>;
    visible: ReadonlyArray<VisibleRow<T>>;
    columns: ColumnDef<T>[] | undefined;
    size: "small" | "medium";
}): import("react/jsx-runtime").JSX.Element | null;
