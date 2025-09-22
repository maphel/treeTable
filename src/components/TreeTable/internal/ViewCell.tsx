import * as React from 'react';
import type { ColumnDef, RowModel } from '../types';

export type ViewCellProps<T extends object> = {
  row: RowModel<T>;
  col: ColumnDef<T>;
  level: number;
};

export default function ViewCell<T extends object = {}>({ row, col, level }: ViewCellProps<T>) {
  const raw = (row as any)[col.id];
  const value = col.valueFormatter ? col.valueFormatter(raw, row) : raw;
  const content = col.cell ? col.cell({ row, value, level, column: col }) : (value as React.ReactNode);
  return <>{content}</>;
}

