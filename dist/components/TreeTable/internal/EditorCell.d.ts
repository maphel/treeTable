import * as React from 'react';
import type { ColumnDef, RowModel } from '../types';
export type EditorCellProps<T extends object> = {
    row: RowModel<T>;
    col: ColumnDef<T>;
    mode: 'locked' | 'unlocked' | 'off';
    cellKey: string;
    editingKey: string | null;
    editingValue: any;
    setEditingKey: React.Dispatch<React.SetStateAction<string | null>>;
    setEditingValue: React.Dispatch<React.SetStateAction<any>>;
    markAutoClosed: (key: string) => void;
    onEditCommit?: (row: RowModel<T>, column: ColumnDef<T>, next: unknown) => Promise<void> | void;
};
export default function EditorCell<T extends object = {}>({ row, col, mode, cellKey, editingKey, editingValue, setEditingKey, setEditingValue, markAutoClosed, onEditCommit, }: EditorCellProps<T>): import("react/jsx-runtime").JSX.Element | null;
