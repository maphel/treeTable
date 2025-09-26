import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import { DragOverlayContent } from "./DragOverlayContent.js";
import DraggableRow from "./DraggableRow.js";
import { buildRowIndexMap, buildVisibleRows, getVisibleColumns, collectExpandableRowIds } from "./genericTreeTable.utils.js";
import { useDragSensors, useExpandedRows, useInlineEditing, useValidTargets } from "./hooks.js";
import { createCollisionDetector } from "./genericTable.collision.js";
export function GenericTreeTable(props) {
    const { rows, columns, size = "medium", expandedRowIds, onRowToggle, getRowActions, getTableRowChildren, getRowCanDrag, getRowCanDrop, onDrop, getValidDropTargets, viewMode, actionsHeader } = props;
    const readOnly = !!props.readOnly;
    const expandableRowIds = useMemo(() => collectExpandableRowIds(rows || []), [rows]);
    const { expanded, toggle } = useExpandedRows(expandedRowIds, onRowToggle, expandableRowIds);
    const visible = useMemo(() => {
        const out = [];
        buildVisibleRows(rows || [], 0, expanded, out);
        return out;
    }, [rows, expanded]);
    const visibleColumns = useMemo(() => getVisibleColumns(columns, viewMode), [columns, viewMode]);
    const byKey = useMemo(() => buildRowIndexMap(rows), [rows]);
    const [activeId, setActiveId] = useState(null);
    const validTargets = useValidTargets(activeId, byKey, getValidDropTargets);
    const sensors = useDragSensors(props.dragActivation);
    const { editingKey, setEditingKey, editingValue, setEditingValue, autoClosedKeys, markAutoClosed, startEdit } = useInlineEditing();
    const collisionDetection = useMemo(() => createCollisionDetector({
        activeId,
        byKey,
        getRowCanDrop,
        validTargets
    }), [activeId, byKey, getRowCanDrop, validTargets]);
    const handleDragStart = useCallback((ev) => {
        const id = String(ev.active.id);
        setActiveId(id);
    }, []);
    const handleDragEnd = useCallback((ev) => {
        const activeKey = String(ev.active.id);
        const overKey = ev.over ? String(ev.over.id) : null;
        setActiveId(null);
        if (!overKey)
            return;
        const parts = overKey.includes(":")
            ? overKey.split(":")
            : null;
        const position = parts ? parts[0] : null;
        const targetKey = parts ? parts[1] : null;
        if (!position || !targetKey)
            return;
        const sourceRow = byKey.get(activeKey);
        const targetRow = byKey.get(targetKey);
        if (!sourceRow || !targetRow)
            return;
        const canDrop = getRowCanDrop
            ? getRowCanDrop(sourceRow, targetRow, position)
            : true;
        const validTargetByList = validTargets
            ? validTargets.has(targetRow.id)
            : true;
        if (!canDrop || !validTargetByList)
            return;
        onDrop === null || onDrop === void 0 ? void 0 : onDrop(sourceRow.id, targetRow.id, position);
    }, [byKey, getRowCanDrop, onDrop, validTargets]);
    return (_jsx(TableContainer, { children: _jsxs(DndContext, { sensors: sensors, collisionDetection: collisionDetection, onDragStart: handleDragStart, onDragEnd: handleDragEnd, children: [_jsxs(Table, { size: size, role: "treegrid", "aria-readonly": readOnly || undefined, children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [visibleColumns.map((col) => (_jsx(TableCell, { align: col.align, style: { width: col.width }, children: col.header }, col.id))), getRowActions && (_jsx(TableCell, { align: "right", children: actionsHeader !== null && actionsHeader !== void 0 ? actionsHeader : "" }, "__actions"))] }) }), _jsxs(TableBody, { children: [visible.map((vr) => (_jsx(DraggableRow, { data: vr, visibleColumns: visibleColumns, size: size, readOnly: readOnly, getRowCanDrag: getRowCanDrag, getRowCanDrop: getRowCanDrop, validTargets: validTargets, activeId: activeId, byKey: byKey, toggle: toggle, viewMode: viewMode, getRowActions: getRowActions, editingKey: editingKey, editingValue: editingValue, setEditingKey: setEditingKey, setEditingValue: setEditingValue, autoClosedKeys: autoClosedKeys, markAutoClosed: markAutoClosed, startEdit: startEdit, onEditCommit: props.onEditCommit }, String(vr.row.id)))), getTableRowChildren && getTableRowChildren(rows, viewMode)] })] }), _jsx(DragOverlay, { children: _jsx(DragOverlayContent, { activeId: activeId, byKey: byKey, visible: visible, columns: visibleColumns, size: size }) })] }) }));
}
