import * as React from 'react';
import type { ColumnDef, RowId } from '../../components/TreeTable/types';
export type RowData = {
    name: string;
    qty?: number;
    unitPrice?: number;
    draggable?: boolean;
    permission?: boolean;
    configurationPermission?: boolean;
    propertyPermissions?: Partial<Record<'name' | 'quantity' | 'unitPrice', boolean>>;
};
export declare function TypeIcon({ type }: {
    type: string;
}): import("react/jsx-runtime").JSX.Element;
export declare function buildColumns(editingNameRowId: RowId | null, setEditingNameRowId: React.Dispatch<React.SetStateAction<RowId | null>>, options?: {
    includeTotals?: boolean;
}): ColumnDef<RowData>[];
