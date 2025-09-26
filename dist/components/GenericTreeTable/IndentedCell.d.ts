import type { ReactNode } from "react";
import type { ColumnDef, RowModel } from "./genericTreeTable.types.js";
export default function IndentedCell<T extends object>(row: RowModel<T>, column: ColumnDef<T>, level: number, isFirst: boolean, hasChildren: boolean, expanded: boolean, onToggle?: () => void, dragHandle?: ReactNode, size?: "small" | "medium", overrideContent?: ReactNode): string | number | boolean | Iterable<ReactNode> | import("react/jsx-runtime").JSX.Element | null | undefined;
