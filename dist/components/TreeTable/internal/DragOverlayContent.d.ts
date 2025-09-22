import type { ColumnDef, RowModel } from '../types';
import type { VisibleRow } from './types';
export default function DragOverlayContent<T extends object = {}>({ activeId, byKey, visible, firstColumn, size, }: {
    activeId: string | null;
    byKey: Map<string, RowModel<T>>;
    visible: ReadonlyArray<VisibleRow<T>>;
    firstColumn: ColumnDef<T> | undefined;
    size: 'small' | 'medium';
}): import("react/jsx-runtime").JSX.Element | null;
