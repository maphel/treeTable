import type { ColumnDef, RowModel } from "./genericTreeTable.types.js";
export type ViewCellProps<T extends object> = {
    row: RowModel<T>;
    col: ColumnDef<T>;
    level: number;
};
export default function ViewCell<T extends object = object>({ row, col, level }: ViewCellProps<T>): import("react/jsx-runtime").JSX.Element;
