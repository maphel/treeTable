import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from 'react';
import TreeTable from '../../components/TreeTable/TreeTable';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import FolderIcon from '@mui/icons-material/Folder';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ExtensionIcon from '@mui/icons-material/Extension';
import DescriptionIcon from '@mui/icons-material/Description';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useGetLineItemsQuery, useMoveLineItemsMutation, useUpdateLineItemMutation, useDeleteLineItemsMutation, useDuplicateLineItemsMutation } from './api';
import { TextEditor, CurrencyInput } from '../../components/editors';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import { formatCurrency, parseCurrency } from '../../components/formatters';
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
        draggable: i.draggable,
        children: toRows(i.children, depth + 1),
    }));
}
export function ExampleLineItemsTable() {
    const { data } = useGetLineItemsQuery(undefined);
    const rows = React.useMemo(() => toRows(data), [data]);
    const [moveLineItems] = useMoveLineItemsMutation();
    const [updateLineItem] = useUpdateLineItemMutation();
    const [deleteLineItems, { isLoading: isDeleting }] = useDeleteLineItemsMutation();
    const [duplicateLineItems, { isLoading: isDuplicating }] = useDuplicateLineItemsMutation();
    // View mode: 'pro' (default) vs 'customer'
    const getInitialView = () => {
        try {
            const sp = new URLSearchParams(window.location.search);
            const v = sp.get('view');
            return v === 'customer' ? 'customer' : 'pro';
        }
        catch {
            return 'pro';
        }
    };
    const [view, setView] = React.useState(getInitialView);
    const isCustomer = view === 'customer';
    // Keep URL query param in sync
    React.useEffect(() => {
        try {
            const url = new URL(window.location.href);
            if (view === 'pro') {
                url.searchParams.delete('view');
            }
            else {
                url.searchParams.set('view', view);
            }
            window.history.replaceState({}, '', url.toString());
        }
        catch { }
    }, [view]);
    // Controls inline name edit when pressing the Edit action
    const [editingNameRowId, setEditingNameRowId] = React.useState(null);
    const CurrencyEditor = ({ value, onChange, commit, cancel, autoFocus }) => (_jsx(CurrencyInput, { value: value, onChange: (s) => onChange(s), onCommit: commit, onCancel: cancel, autoFocus: autoFocus, locale: "de-DE", currency: "EUR" }));
    const columns = [
        {
            id: 'name',
            header: 'Name',
            width: '40%',
            getIsEditable: (row) => { var _a, _b; return row.type === 'custom' && ((_b = (_a = row.propertyPermissions) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : true); },
            // When a row is marked for editing via the Edit action, start editor unlocked
            editMode: (row) => (row.id === editingNameRowId ? 'unlocked' : undefined),
            autoCommitOnChange: (row) => row.id === editingNameRowId,
            editor: (p) => (_jsx(TextEditor, { ...p, onCommit: () => {
                    p.commit();
                    setEditingNameRowId((curr) => (curr === p.row.id ? null : curr));
                }, onCancel: () => {
                    p.cancel();
                    setEditingNameRowId((curr) => (curr === p.row.id ? null : curr));
                } })),
            cell: ({ row, value }) => (_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 1 }, children: [row.type === 'folder' && _jsx(FolderIcon, { fontSize: "small", color: "action" }), row.type === 'product' && _jsx(Inventory2Icon, { fontSize: "small", color: "action" }), row.type === 'subproduct' && _jsx(ExtensionIcon, { fontSize: "small", color: "action" }), row.type === 'custom' && _jsx(DescriptionIcon, { fontSize: "small", color: "action" }), _jsx(Box, { component: "span", sx: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, children: String(value !== null && value !== void 0 ? value : '') })] })),
        },
        {
            id: 'qty',
            header: 'Menge',
            align: 'right',
            width: 120,
            getIsEditable: (row) => { var _a, _b; return row.type !== 'folder' && ((_b = (_a = row.propertyPermissions) === null || _a === void 0 ? void 0 : _a.quantity) !== null && _b !== void 0 ? _b : true); },
            editor: ({ value, onChange, commit, cancel, autoFocus }) => (_jsx(TextEditor, { value: typeof value === 'number' ? String(value) : (value !== null && value !== void 0 ? value : ''), onChange: (next) => onChange(parseFloat(String(next))), onCommit: commit, onCancel: cancel, autoFocus: autoFocus })),
            valueFormatter: (v) => (typeof v === 'number' ? String(v) : ''),
        },
        {
            id: 'unitPrice',
            header: 'Preis',
            align: 'right',
            width: 140,
            getIsEditable: (row) => { var _a, _b; return row.type !== 'folder' && ((_b = (_a = row.propertyPermissions) === null || _a === void 0 ? void 0 : _a.unitPrice) !== null && _b !== void 0 ? _b : true); },
            getIsVisible: (vm) => vm !== 'customer',
            editor: CurrencyEditor,
            valueParser: parseCurrency,
            valueFormatter: (v) => formatCurrency(typeof v === 'number' ? v : undefined),
        },
    ];
    function getRowCanDrag(row) {
        if (row.draggable === false)
            return false;
        return row.type !== 'subproduct';
    }
    function getRowCanDrop(source, target, position) {
        if (String(source.id) === String(target.id))
            return false;
        if (position === 'inside' && target.type !== 'folder')
            return false;
        return true;
    }
    function indexTree(nodes) {
        const parentOf = new Map();
        const childrenOf = new Map();
        function walk(list, parent) {
            childrenOf.set(parent, list.map(n => n.id));
            for (const n of list) {
                parentOf.set(n.id, parent);
                walk(n.children || [], n.id);
            }
        }
        walk(nodes, null);
        return { parentOf, childrenOf };
    }
    const handleDrop = async (sourceId, targetId, position) => {
        var _a;
        const { parentOf, childrenOf } = indexTree(rows);
        let parentLineItemId = null;
        let previousLineItem = 'LAST';
        if (position === 'inside') {
            parentLineItemId = targetId;
            previousLineItem = 'LAST';
        }
        else {
            const parent = (_a = parentOf.get(targetId)) !== null && _a !== void 0 ? _a : null;
            parentLineItemId = parent;
            const siblings = (childrenOf.get(parent) || []).filter(id => id !== sourceId);
            const idx = siblings.indexOf(targetId);
            if (position === 'before') {
                if (idx <= 0)
                    previousLineItem = 'FIRST';
                else
                    previousLineItem = { lineItemId: siblings[idx - 1] };
            }
            else {
                // After target -> place before its next sibling by using target as previous
                previousLineItem = { lineItemId: targetId };
            }
        }
        await moveLineItems({
            selectedLineItemIds: [sourceId],
            parentLineItemId,
            previousLineItem,
        });
    };
    return (_jsxs(_Fragment, { children: [_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }, children: [_jsx(Box, { sx: { fontWeight: 600, color: 'text.secondary' }, children: "Ansicht" }), _jsxs(ToggleButtonGroup, { exclusive: true, size: "small", value: view, onChange: (_, next) => { if (next)
                            setView(next); }, "aria-label": "Ansicht w\u00E4hlen", children: [_jsx(ToggleButton, { value: "pro", "aria-label": "Pro-Ansicht", children: "Pro" }), _jsx(ToggleButton, { value: "customer", "aria-label": "Kundenansicht", children: "Kunde" })] })] }), _jsx(TreeTable, { dragActivation: { mode: 'distance', distance: 3 }, rows: rows, columns: columns, viewMode: view, onEditCommit: async (row, column, next) => {
                    const lineItemId = row.id;
                    const prop = column.id === 'qty' ? 'quantity' : column.id;
                    await updateLineItem({ lineItemId, properties: { [prop]: next } });
                    // Close forced name editor after commit
                    setEditingNameRowId((curr) => (curr === row.id ? null : curr));
                }, getRowActions: !isCustomer ? ((row) => {
                    var _a, _b, _c, _d;
                    const hasPermission = (_a = row.permission) !== null && _a !== void 0 ? _a : true;
                    const hasConfigPermission = (_b = row.configurationPermission) !== null && _b !== void 0 ? _b : true;
                    if (!hasPermission || row.type === 'subproduct')
                        return null;
                    const canEditName = row.type === 'custom' && ((_d = (_c = row.propertyPermissions) === null || _c === void 0 ? void 0 : _c.name) !== null && _d !== void 0 ? _d : true);
                    const showEdit = row.type === 'custom' || row.type === 'product';
                    const editDisabled = row.type !== 'custom' || !canEditName;
                    const showDuplicate = row.type === 'product' || row.type === 'custom';
                    const duplicateDisabled = !hasConfigPermission;
                    const showDelete = row.type === 'folder' || row.type === 'product' || row.type === 'custom';
                    const deleteDisabled = !hasConfigPermission;
                    return (_jsxs(Box, { sx: { display: 'flex', justifyContent: 'flex-end', gap: 0.5 }, children: [showEdit && (_jsx(Tooltip, { title: editDisabled ? 'Bearbeiten nicht möglich' : 'Bearbeiten', children: _jsx("span", { children: _jsx(IconButton, { size: "small", disabled: editDisabled, onClick: (e) => {
                                            e.stopPropagation();
                                            if (!editDisabled)
                                                setEditingNameRowId(row.id);
                                        }, children: _jsx(EditIcon, { fontSize: "small" }) }) }) })), showDuplicate && (_jsx(Tooltip, { title: duplicateDisabled ? 'Duplizieren nicht erlaubt' : 'Duplizieren', children: _jsx("span", { children: _jsx(IconButton, { size: "small", disabled: duplicateDisabled || isDuplicating, onClick: async (e) => {
                                            e.stopPropagation();
                                            await duplicateLineItems({ selectedLineItemIds: [row.id] });
                                        }, children: _jsx(ContentCopyIcon, { fontSize: "small" }) }) }) })), showDelete && (_jsx(Tooltip, { title: deleteDisabled ? 'Löschen nicht erlaubt' : 'Löschen', children: _jsx("span", { children: _jsx(IconButton, { size: "small", disabled: deleteDisabled || isDeleting, onClick: async (e) => {
                                            e.stopPropagation();
                                            await deleteLineItems({ selectedLineItemIds: [row.id] });
                                        }, children: _jsx(DeleteIcon, { fontSize: "small" }) }) }) }))] }));
                }) : undefined, getRowCanDrag: !isCustomer ? getRowCanDrag : undefined, getRowCanDrop: !isCustomer ? getRowCanDrop : undefined, onDrop: !isCustomer ? handleDrop : undefined })] }));
}
export default ExampleLineItemsTable;
