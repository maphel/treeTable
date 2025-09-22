import type { RowModel, RowId } from '../types';

export type VisibleRow<T extends object> = {
  row: RowModel<T>;
  level: number;
  hasChildren: boolean;
  expanded: boolean;
};

export type KeyOf = (id: RowId) => string;

