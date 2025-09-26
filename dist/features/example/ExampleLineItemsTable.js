import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from 'react';
import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { buildColumns } from './buildColumns';
import RowActions from './components/RowActions';
import { useDeleteLineItemsMutation, useDuplicateLineItemsMutation, useGetLineItemsQuery, useMoveLineItemsMutation, useUpdateLineItemMutation, } from './api';
import { GenericTreeTable } from '../../components/GenericTreeTable/GenericTreeTable';
function toRows(items, depth = 0) {
    if (!items)
        return [];
    return items.map((i) => ({
        id: i.lineItemId,
        type: i.type,
        depth,
        name: i.name,
        qty: i.quantity,
        unitPrice: i.unitPrice,
        discount: i.discount,
        draggable: i.draggable,
        children: toRows(i.children, depth + 1),
    }));
}
function useViewMode() {
    const readInitial = React.useCallback(() => {
        try {
            const sp = new URLSearchParams(window.location.search);
            const v = sp.get('view');
            return v === 'customer' ? 'customer' : 'pro';
        }
        catch {
            return 'pro';
        }
    }, []);
    const [view, setView] = React.useState(readInitial);
    React.useEffect(() => {
        try {
            const url = new URL(window.location.href);
            if (view === 'pro')
                url.searchParams.delete('view');
            else
                url.searchParams.set('view', view);
            window.history.replaceState({}, '', url.toString());
        }
        catch { }
    }, [view]);
    return [view, setView];
}
function buildMoveIndex(nodes) {
    const parentOf = new Map();
    const childrenOf = new Map();
    const walk = (list, parent) => {
        childrenOf.set(parent, list.map((n) => n.id));
        for (const n of list) {
            parentOf.set(n.id, parent);
            walk(n.children || [], n.id);
        }
    };
    walk(nodes, null);
    return { parentOf, childrenOf };
}
export function ExampleLineItemsTable() {
    const { data } = useGetLineItemsQuery(undefined);
    const rows = React.useMemo(() => toRows(data), [data]);
    const [moveLineItems] = useMoveLineItemsMutation();
    const [updateLineItem] = useUpdateLineItemMutation();
    const [deleteLineItems, { isLoading: isDeleting }] = useDeleteLineItemsMutation();
    const [duplicateLineItems, { isLoading: isDuplicating }] = useDuplicateLineItemsMutation();
    const [view, setView] = useViewMode();
    const isCustomer = view === 'customer';
    // Row-level edit toggle: when set to a row id, all editable cells in that row are unlocked
    const [editingRowId, setEditingRowId] = React.useState(null);
    const columns = React.useMemo(() => buildColumns(editingRowId, setEditingRowId, { includeTotals: true, language: 'de-DE', currency: 'EUR' }), [editingRowId]);
    const getRowCanDrag = React.useCallback((row) => {
        if (row.draggable === false)
            return false;
        return row.type !== 'subproduct';
    }, []);
    const getRowCanDrop = React.useCallback((source, target, position) => {
        if (String(source.id) === String(target.id))
            return false;
        if (position === 'inside' && target.type !== 'folder')
            return false;
        return true;
    }, []);
    const handleDrop = React.useCallback(async (sourceId, targetId, position) => {
        var _a;
        const { parentOf, childrenOf } = buildMoveIndex(rows);
        let parentLineItemId = null;
        let previousLineItem = 'LAST';
        if (position === 'inside') {
            parentLineItemId = targetId;
            previousLineItem = 'LAST';
        }
        else {
            const parent = (_a = parentOf.get(targetId)) !== null && _a !== void 0 ? _a : null;
            parentLineItemId = parent;
            const siblings = (childrenOf.get(parent) || []).filter((id) => id !== sourceId);
            const idx = siblings.indexOf(targetId);
            if (position === 'before') {
                previousLineItem = idx <= 0 ? 'FIRST' : { lineItemId: siblings[idx - 1] };
            }
            else {
                previousLineItem = { lineItemId: targetId };
            }
        }
        await moveLineItems({ selectedLineItemIds: [sourceId], parentLineItemId, previousLineItem });
    }, [rows, moveLineItems]);
    const COLUMN_PROP_MAP = React.useMemo(() => ({ qty: 'quantity', name: 'name', unitPrice: 'unitPrice', discount: 'discount' }), []);
    return (_jsxs(_Fragment, { children: [_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }, children: [_jsx(Box, { sx: { fontWeight: 600, color: 'text.secondary' }, children: "Ansicht" }), _jsxs(ToggleButtonGroup, { exclusive: true, size: "small", value: view, onChange: (_, next) => { if (next)
                            setView(next); }, "aria-label": "Ansicht w\u00E4hlen", children: [_jsx(ToggleButton, { value: "pro", "aria-label": "Pro-Ansicht", children: "Pro" }), _jsx(ToggleButton, { value: "customer", "aria-label": "Kundenansicht", children: "Kunde" })] })] }), _jsx(GenericTreeTable, { dragActivation: { mode: 'distance', distance: 3 }, rows: rows, columns: columns, viewMode: view, actionsHeader: "Aktionen", onEditCommit: async (row, column, next) => {
                    var _a;
                    const lineItemId = row.id;
                    const prop = (_a = COLUMN_PROP_MAP[column.id]) !== null && _a !== void 0 ? _a : column.id;
                    await updateLineItem({ lineItemId, properties: { [prop]: next } });
                }, onRowAllEditorsClosed: (row) => {
                    setEditingRowId((curr) => (curr === row.id ? null : curr));
                }, getRowActions: !isCustomer ? ((row) => (_jsx(RowActions, { row: row, isEditing: editingRowId === row.id, isDuplicating: isDuplicating, isDeleting: isDeleting, confirmDelete: true, onEdit: () => setEditingRowId((curr) => (curr === row.id ? null : row.id)), onDuplicate: async () => { await duplicateLineItems({ selectedLineItemIds: [row.id] }); }, onDelete: async () => { await deleteLineItems({ selectedLineItemIds: [row.id] }); } }))) : undefined, getRowCanDrag: !isCustomer ? getRowCanDrag : undefined, getRowCanDrop: !isCustomer ? getRowCanDrop : undefined, onDrop: !isCustomer ? handleDrop : undefined })] }));
}
export default ExampleLineItemsTable;
