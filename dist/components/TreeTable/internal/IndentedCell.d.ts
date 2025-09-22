import * as React from 'react';
import type { ColumnDef, RowModel } from '../types';
export default function IndentedCell<T extends object>(row: RowModel<T>, column: ColumnDef<T>, level: number, isFirst: boolean, hasChildren: boolean, expanded: boolean, onToggle?: () => void, dragHandle?: React.ReactNode, size?: 'small' | 'medium', overrideContent?: React.ReactNode): string | number | boolean | Iterable<React.ReactNode> | import("react/jsx-runtime").JSX.Element | null | undefined;
