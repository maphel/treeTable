import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, pointerWithin } from '@dnd-kit/core';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import IndentedCell from './internal/IndentedCell';
import DraggableRow from './internal/DraggableRow';
import { buildRowIndexMap, buildVisibleRows, getVisibleColumns } from './internal/utils';
import { useExpandedRows, useValidTargets } from './internal/hooks';
export function TreeTable(props) {
    var _a, _b;
    const { rows, columns, size = 'medium', expandedRowIds, onRowToggle, getRowActions, getRowCanDrag, getRowCanDrop, onDrop, getValidDropTargets, viewMode, actionsHeader, } = props;
    // Back-compat: treat 'customer' as read-only + hide actions by default; otherwise use provided overrides
    const inferredCustomer = viewMode === 'customer';
    const readOnly = (_a = props.readOnly) !== null && _a !== void 0 ? _a : (inferredCustomer ? true : false);
    const showActionsColumn = (_b = props.showActionsColumn) !== null && _b !== void 0 ? _b : (inferredCustomer ? false : true);
    const { expanded, toggle } = useExpandedRows(expandedRowIds, onRowToggle);
    const visible = React.useMemo(() => {
        const out = [];
        buildVisibleRows(rows || [], 0, expanded, out);
        return out;
    }, [rows, expanded]);
    // Apply column visibility if provided
    const visibleColumns = React.useMemo(() => getVisibleColumns(columns, viewMode), [columns, viewMode]);
    const byKey = React.useMemo(() => buildRowIndexMap(rows), [rows]);
    // (Removed boundary-hiding of before/after to allow first/last placement via edges)
    const [activeId, setActiveId] = React.useState(null);
    const [overId, setOverId] = React.useState(null);
    const validTargets = useValidTargets(activeId, byKey, getValidDropTargets);
    // Inline editing state (for non-locked cells)
    const [editingKey, setEditingKey] = React.useState(null);
    const [editingValue, setEditingValue] = React.useState(undefined);
    // Tracks auto-opened 'unlocked' cells that were committed/canceled, so they don't reopen.
    const [autoClosedKeys, setAutoClosedKeys] = React.useState(new Set());
    const startEdit = React.useCallback((row, column) => {
        const key = `${String(row.id)}::${column.id}`;
        const raw = row[column.id];
        setEditingKey(key);
        setEditingValue(raw);
    }, []);
    const markAutoClosed = React.useCallback((key) => {
        setAutoClosedKeys(prev => {
            if (prev.has(key))
                return prev;
            const next = new Set(prev);
            next.add(key);
            return next;
        });
    }, []);
    // validTargets now handled by useValidTargets
    const sensors = useSensors(
    // Configurable activation: delay/tolerance (default) or distance
    useSensor(PointerSensor, 
    // dnd-kit types accept either Delay or Distance constraints; keep it flexible.
    (() => {
        var _a, _b, _c;
        const a = props.dragActivation;
        if ((a === null || a === void 0 ? void 0 : a.mode) === 'distance') {
            return { activationConstraint: { distance: (_a = a.distance) !== null && _a !== void 0 ? _a : 3 } };
        }
        return { activationConstraint: { delay: (_b = a === null || a === void 0 ? void 0 : a.delay) !== null && _b !== void 0 ? _b : 150, tolerance: (_c = a === null || a === void 0 ? void 0 : a.tolerance) !== null && _c !== void 0 ? _c : 5 } };
    })()));
    // Prefer edge (before/after) zones over inside, and filter out disallowed targets.
    // Do NOT fallback when the pointer isn't over any droppable: no hover anywhere.
    const collisionDetection = React.useCallback((args) => {
        const hits = pointerWithin(args) || [];
        const score = (id) => {
            const s = String(id);
            if (s.startsWith('before:') || s.startsWith('after:'))
                return 0; // highest priority
            if (s.startsWith('inside:'))
                return 1; // fallback if not over edge zones
            return 2; // anything else
        };
        const isAllowed = (id) => {
            if (!activeId)
                return true;
            const parts = id.includes(':') ? id.split(':') : ['', ''];
            let pos = parts[0];
            const targetKey = parts[1];
            if (!pos || !targetKey)
                return true;
            const source = byKey.get(activeId);
            const target = byKey.get(targetKey);
            if (!source || !target)
                return false;
            if (source.id === target.id)
                return false; // can't drop onto itself
            const byProps = getRowCanDrop ? getRowCanDrop(source, target, pos) : true;
            const byList = validTargets ? validTargets.has(target.id) : true;
            return byProps && byList;
        };
        const filtered = hits.filter((h) => isAllowed(String(h.id)));
        // If nothing valid under the pointer, show nothing (no sticky hover)
        if (filtered.length === 0)
            return [];
        filtered.sort((a, b) => {
            const sa = score(a.id);
            const sb = score(b.id);
            if (sa !== sb)
                return sa - sb;
            // For identical scores, preserve higher confidence first
            const va = (a.data && typeof a.data.value === 'number') ? a.data.value : 0;
            const vb = (b.data && typeof b.data.value === 'number') ? b.data.value : 0;
            return vb - va;
        });
        return filtered;
    }, [activeId, byKey, getRowCanDrop, validTargets]);
    const handleDragStart = React.useCallback((ev) => {
        const id = String(ev.active.id);
        setActiveId(id);
    }, []);
    const handleDragEnd = React.useCallback((ev) => {
        const activeKey = String(ev.active.id);
        const overKey = ev.over ? String(ev.over.id) : null;
        setOverId(null);
        setActiveId(null);
        if (!overKey)
            return;
        const parts = overKey.includes(':') ? overKey.split(':') : null;
        let position = parts ? parts[0] : null;
        let targetKey = parts ? parts[1] : null;
        if (!position || !targetKey)
            return;
        const sourceRow = byKey.get(activeKey);
        const targetRow = byKey.get(targetKey);
        if (!sourceRow || !targetRow)
            return;
        // position can now only be: inside | before | after
        // validate
        const canDrop = getRowCanDrop ? getRowCanDrop(sourceRow, targetRow, position) : true;
        const validTargetByList = validTargets ? validTargets.has(targetRow.id) : true;
        if (!canDrop || !validTargetByList)
            return;
        onDrop === null || onDrop === void 0 ? void 0 : onDrop(sourceRow.id, targetRow.id, position);
    }, [byKey, getRowCanDrop, onDrop, validTargets]);
    const handleDragOver = React.useCallback((ev) => {
        setOverId(ev.over ? String(ev.over.id) : null);
    }, []);
    // Row rendering is extracted into internal/DraggableRow
    return (_jsx(TableContainer, { children: _jsxs(DndContext, { sensors: sensors, collisionDetection: collisionDetection, onDragStart: handleDragStart, onDragEnd: handleDragEnd, onDragOver: handleDragOver, children: [_jsxs(Table, { size: size, role: "treegrid", "aria-readonly": readOnly || undefined, children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [visibleColumns.map((col) => (_jsx(TableCell, { align: col.align, style: { width: col.width }, children: col.header }, col.id))), getRowActions && showActionsColumn && (_jsx(TableCell, { align: "right", children: actionsHeader !== null && actionsHeader !== void 0 ? actionsHeader : 'Actions' }, "__actions"))] }) }), _jsx(TableBody, { children: visible.map((vr) => (_jsx(DraggableRow, { data: vr, visibleColumns: visibleColumns, size: size, readOnly: readOnly, showActionsColumn: showActionsColumn, getRowCanDrag: getRowCanDrag, getRowCanDrop: getRowCanDrop, validTargets: validTargets, overId: overId, activeId: activeId, byKey: byKey, toggle: toggle, viewMode: viewMode, getRowActions: getRowActions, editingKey: editingKey, editingValue: editingValue, setEditingKey: setEditingKey, setEditingValue: setEditingValue, autoClosedKeys: autoClosedKeys, markAutoClosed: markAutoClosed, startEdit: startEdit, onEditCommit: props.onEditCommit }, String(vr.row.id)))) })] }), _jsx(DragOverlay, { children: activeId ? (() => {
                        var _a, _b, _c;
                        const activeRow = byKey.get(activeId);
                        if (!activeRow)
                            return null;
                        const meta = visible.find(v => String(v.row.id) === activeId);
                        const level = (_a = meta === null || meta === void 0 ? void 0 : meta.level) !== null && _a !== void 0 ? _a : 0;
                        const hasChildren = (_b = meta === null || meta === void 0 ? void 0 : meta.hasChildren) !== null && _b !== void 0 ? _b : false;
                        const isExpanded = (_c = meta === null || meta === void 0 ? void 0 : meta.expanded) !== null && _c !== void 0 ? _c : false;
                        return (_jsx(Box, { sx: { px: 1.5, py: 1, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, boxShadow: 6, minWidth: 240 }, children: IndentedCell(activeRow, visibleColumns[0], level, true, hasChildren, isExpanded, undefined, (_jsx(IconButton, { size: size === 'small' ? 'small' : 'medium', disableRipple: true, disableFocusRipple: true, sx: { mr: 1, cursor: 'grabbing', '&:focus,&:focus-visible': { outline: 'none' } }, children: _jsx(DragIndicatorIcon, { fontSize: size === 'small' ? 'small' : 'medium' }) })), size) }));
                    })() : null })] }) }));
}
export default TreeTable;
