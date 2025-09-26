import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core"
import { DndContext, DragOverlay } from "@dnd-kit/core"
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow
} from "@mui/material"
import { useCallback, useMemo, useState } from "react"

import { DragOverlayContent } from "./DragOverlayContent.js"
import DraggableRow from "./DraggableRow.js"
import type {
    ColumnDef,
    TreeTableProps,
    VisibleRow
} from "./genericTreeTable.types.js"
import {
    buildRowIndexMap,
    buildVisibleRows,
    getVisibleColumns,
    collectExpandableRowIds
} from "./genericTreeTable.utils.js"
import {
    useDragSensors,
    useExpandedRows,
    useInlineEditing,
    useValidTargets
} from "./hooks.js"
import { createCollisionDetector } from "./genericTable.collision.js"


export function GenericTreeTable<T extends object>(props: TreeTableProps<T>) {
    const {
        rows,
        columns,
        size = "medium",
        expandedRowIds,
        onRowToggle,
        getRowActions,
        getTableRowChildren,
        getRowCanDrag,
        getRowCanDrop,
        onDrop,
        getValidDropTargets,
        viewMode,
        actionsHeader,
        onRowAllEditorsClosed
    } = props
    const readOnly = !!props.readOnly

    const expandableRowIds = useMemo(() => collectExpandableRowIds(rows || []), [rows])
    const { expanded, toggle } = useExpandedRows(expandedRowIds, onRowToggle, expandableRowIds)

    const visible: VisibleRow<T>[] = useMemo(() => {
        const out: VisibleRow<T>[] = []
        buildVisibleRows(rows || [], 0, expanded, out)
        return out
    }, [rows, expanded])
    const visibleColumns: ColumnDef<T>[] = useMemo(
        () => getVisibleColumns(columns as ColumnDef<T>[], viewMode),
        [columns, viewMode]
    )
    const byKey = useMemo(() => buildRowIndexMap(rows), [rows])

    const [activeId, setActiveId] = useState<string | null>(null)
    const validTargets = useValidTargets<T>(
        activeId,
        byKey,
        getValidDropTargets
    )
    const sensors = useDragSensors(props.dragActivation)
    const {
        editingKey,
        setEditingKey,
        editingValue,
        setEditingValue,
        autoClosedKeys,
        markAutoClosed,
        clearAutoClosedForRow,
        startEdit
    } = useInlineEditing<T>()

    const collisionDetection = useMemo(
        () =>
            createCollisionDetector<T>({
                activeId,
                byKey,
                getRowCanDrop,
                validTargets
            }),
        [activeId, byKey, getRowCanDrop, validTargets]
    )

    const handleDragStart = useCallback((ev: DragStartEvent) => {
        const id = String(ev.active.id)
        setActiveId(id)
    }, [])

    const handleDragEnd = useCallback(
        (ev: DragEndEvent) => {
            const activeKey = String(ev.active.id)
            const overKey = ev.over ? String(ev.over.id) : null
            setActiveId(null)
            if (!overKey) return
            const parts = overKey.includes(":")
                ? (overKey.split(":") as [string, string])
                : (null as any)
            const position: string | null = parts ? parts[0] : null
            const targetKey: string | null = parts ? parts[1] : null
            if (!position || !targetKey) return
            const sourceRow = byKey.get(activeKey)
            const targetRow = byKey.get(targetKey)
            if (!sourceRow || !targetRow) return

            const canDrop = getRowCanDrop
                ? getRowCanDrop(sourceRow, targetRow, position as any)
                : true
            const validTargetByList = validTargets
                ? validTargets.has(targetRow.id)
                : true
            if (!canDrop || !validTargetByList) return
            onDrop?.(sourceRow.id, targetRow.id, position as any)
        },
        [byKey, getRowCanDrop, onDrop, validTargets]
    )
    return (
        <TableContainer>
            <DndContext
                sensors={sensors}
                collisionDetection={collisionDetection}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <Table
                    size={size}
                    role="treegrid"
                    aria-readonly={readOnly || undefined}
                >
                    <TableHead>
                        <TableRow>
                            {visibleColumns.map((col) => (
                                <TableCell
                                    key={col.id}
                                    align={col.align}
                                    style={{ width: col.width }}
                                >
                                    {col.header}
                                </TableCell>
                            ))}
                            {getRowActions && (
                                <TableCell key="__actions" align="right">
                                    {actionsHeader ?? ""}
                                </TableCell>
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {visible.map((vr) => (
                            <DraggableRow
                                key={String(vr.row.id)}
                                data={vr}
                                visibleColumns={visibleColumns}
                                size={size}
                                readOnly={readOnly}
                                getRowCanDrag={getRowCanDrag}
                                getRowCanDrop={getRowCanDrop}
                                validTargets={validTargets}
                                activeId={activeId}
                                byKey={byKey}
                                toggle={toggle}
                                viewMode={viewMode}
                                getRowActions={getRowActions}
                                editingKey={editingKey}
                                editingValue={editingValue}
                                setEditingKey={setEditingKey}
                                setEditingValue={setEditingValue}
                                autoClosedKeys={autoClosedKeys}
                                markAutoClosed={markAutoClosed}
                                clearAutoClosedForRow={clearAutoClosedForRow}
                                startEdit={startEdit}
                                onEditCommit={props.onEditCommit}
                                onRowAllEditorsClosed={onRowAllEditorsClosed}
                            />
                        ))}
                        {getTableRowChildren && getTableRowChildren(rows, viewMode)}
                    </TableBody>
                </Table>
                <DragOverlay>
                    <DragOverlayContent
                        activeId={activeId}
                        byKey={byKey}
                        visible={visible}
                        columns={visibleColumns}
                        size={size}
                    />
                </DragOverlay>
            </DndContext>
        </TableContainer>
    )
}
