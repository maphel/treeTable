import * as React from 'react';
import type { ColumnDef } from '../../components/GenericTreeTable/genericTreeTable.types';
export type RowData = {
    name: string;
    qty?: number;
    unitPrice?: number;
    discount?: number;
    draggable?: boolean;
    permission?: boolean;
    configurationPermission?: boolean;
    propertyPermissions?: Partial<Record<'name' | 'quantity' | 'unitPrice', boolean>>;
};
export declare function TypeIcon({ type }: {
    type: string;
}): import("react/jsx-runtime").JSX.Element;
export declare function buildColumns(editingNameRowId: string | null, setEditingNameRowId: React.Dispatch<React.SetStateAction<string | null>>, options?: {
    includeTotals?: boolean;
    language?: string;
    currency?: string;
}): ColumnDef<RowData>[];
