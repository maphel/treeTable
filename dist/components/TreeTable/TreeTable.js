import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import DraggableRow from './internal/DraggableRow';
import { buildRowIndexMap, buildVisibleRows, getVisibleColumns } from './internal/utils';
import { useExpandedRows, useValidTargets, useDragSensors, useInlineEditing } from './internal/hooks';
import { createCollisionDetector } from './internal/collision';
import DragOverlayContent from './internal/DragOverlayContent';
export function TreeTable(props) {
    const { rows, columns, size = 'medium', expandedRowIds, onRowToggle, getRowActions, getRowCanDrag, getRowCanDrop, onDrop, getValidDropTargets, viewMode, actionsHeader, } = props;
    // Normalize optionals to strict booleans for child props/ARIA
    const readOnly = !!props.readOnly;
    const showActionsColumn = props.showActionsColumn !== false;
    const { expanded, toggle } = useExpandedRows(expandedRowIds, onRowToggle);
    const visible = React.useMemo(() => {
        const out = [];
        buildVisibleRows(rows || [], 0, expanded, out);
        return out;
    }, [rows, expanded]);
    // Apply column visibility if provided
    const visibleColumns = React.useMemo(() => getVisibleColumns(columns, viewMode), [columns, viewMode]);
    const byKey = React.useMemo(() => buildRowIndexMap(rows), [rows]);
    const [activeId, setActiveId] = React.useState(null);
    const [overId, setOverId] = React.useState(null);
    const validTargets = useValidTargets(activeId, byKey, getValidDropTargets);
    const sensors = useDragSensors(props.dragActivation);
    const { editingKey, setEditingKey, editingValue, setEditingValue, autoClosedKeys, markAutoClosed, startEdit } = useInlineEditing();
    // Prefer edge (before/after) zones over inside, and filter out disallowed targets.
    const collisionDetection = React.useMemo(() => createCollisionDetector({ activeId, byKey, getRowCanDrop, validTargets }), [activeId, byKey, getRowCanDrop, validTargets]);
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
    return (_jsx(TableContainer, { children: _jsxs(DndContext, { sensors: sensors, collisionDetection: collisionDetection, onDragStart: handleDragStart, onDragEnd: handleDragEnd, onDragOver: handleDragOver, children: [_jsxs(Table, { size: size, role: "treegrid", "aria-readonly": readOnly || undefined, children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [visibleColumns.map((col) => (_jsx(TableCell, { align: col.align, style: { width: col.width }, children: col.header }, col.id))), getRowActions && showActionsColumn && (_jsx(TableCell, { align: "right", children: actionsHeader !== null && actionsHeader !== void 0 ? actionsHeader : 'Actions' }, "__actions"))] }) }), _jsx(TableBody, { children: visible.map((vr) => (_jsx(DraggableRow, { data: vr, visibleColumns: visibleColumns, size: size, readOnly: readOnly, showActionsColumn: showActionsColumn, getRowCanDrag: getRowCanDrag, getRowCanDrop: getRowCanDrop, validTargets: validTargets, overId: overId, activeId: activeId, byKey: byKey, toggle: toggle, viewMode: viewMode, getRowActions: getRowActions, editingKey: editingKey, editingValue: editingValue, setEditingKey: setEditingKey, setEditingValue: setEditingValue, autoClosedKeys: autoClosedKeys, markAutoClosed: markAutoClosed, startEdit: startEdit, onEditCommit: props.onEditCommit }, String(vr.row.id)))) })] }), _jsx(DragOverlay, { children: _jsx(DragOverlayContent, { activeId: activeId, byKey: byKey, visible: visible, firstColumn: visibleColumns[0], size: size }) })] }) }));
}
export default TreeTable;
