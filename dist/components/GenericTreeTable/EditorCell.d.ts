import { type Dispatch, type SetStateAction } from "react";
import type { ColumnDef, RowModel } from "./genericTreeTable.types.js";
export type EditorCellProps<T extends object> = {
    row: RowModel<T>;
    col: ColumnDef<T>;
    mode: "locked" | "unlocked" | "off";
    cellKey: string;
    editingKey: string | null;
    editingValue: any;
    setEditingKey: Dispatch<SetStateAction<string | null>>;
    setEditingValue: Dispatch<SetStateAction<any>>;
    markAutoClosed: (key: string) => void;
    onEditCommit?: (row: RowModel<T>, column: ColumnDef<T>, next: unknown) => Promise<void> | void;
};
export default function EditorCell<T extends object>({ row, col, mode, cellKey, editingKey, editingValue, setEditingKey, setEditingValue, markAutoClosed, onEditCommit }: EditorCellProps<T>): import("react/jsx-runtime").JSX.Element | null;
