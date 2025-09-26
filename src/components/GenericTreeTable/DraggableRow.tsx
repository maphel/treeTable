import { useDraggable, useDroppable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import {
    DragIndicator as DragIndicatorIcon,
    EditOutlined as EditOutlinedIcon
} from "@mui/icons-material"
import { Box, IconButton, TableCell, TableRow } from "@mui/material"
import React, {
    type CSSProperties,
    type Dispatch,
    type ReactNode,
    type SetStateAction,
    useCallback,
    useEffect,
    useMemo
} from "react"

import DropEdgeOverlays from "./DropEdgeOverlays.js"
import EditorCell from "./EditorCell.js"
import IndentedCell from "./IndentedCell.js"
import ViewCell from "./ViewCell.js"
import type {
    ColumnDef,
    RowModel,
    VisibleRow
} from "./genericTreeTable.types.js"


export type DraggableRowProps<T extends object> = {
    data: VisibleRow<T>
    visibleColumns: ColumnDef<T>[]
    size: "small" | "medium"
    readOnly: boolean
    getRowCanDrag?: (row: RowModel<T>) => boolean
    getRowCanDrop?: (
        source: RowModel<T>,
        target: RowModel<T>,
        position: "inside" | "before" | "after"
    ) => boolean
    validTargets: Set<string> | null
    overId: string | null
    activeId: string | null
    byKey: Map<string, RowModel<T>>
    toggle: (id: string) => void
    viewMode: string | undefined
    getRowActions?: (row: RowModel<T>) => ReactNode
    // inline edit state
    editingKey: string | null
    editingValue: any
    setEditingKey: Dispatch<SetStateAction<string | null>>
    setEditingValue: Dispatch<SetStateAction<any>>
    autoClosedKeys: Set<string>
    markAutoClosed: (key: string) => void
    startEdit: (row: RowModel<T>, column: ColumnDef<T>) => void
    onEditCommit?: (
        row: RowModel<T>,
        column: ColumnDef<T>,
        next: unknown
    ) => Promise<void> | void
}

export default function DraggableRow<T extends object>(
    props: DraggableRowProps<T>
) {
    const {
        data,
        visibleColumns,
        size,
        readOnly,
        getRowCanDrag,
        getRowCanDrop,
        validTargets,
        overId,
        activeId,
        byKey,
        toggle,
        viewMode,
        getRowActions,
        editingKey,
        editingValue,
        setEditingKey,
        setEditingValue,
        autoClosedKeys,
        markAutoClosed,
        startEdit,
        onEditCommit
    } = props

    const { row, level, hasChildren, expanded: isExpanded } = data
    const draggableId = String(row.id)
    const { attributes, listeners, setNodeRef, transform, isDragging } =
        useDraggable({ id: draggableId })
    const canDrag = readOnly ? false : getRowCanDrag ? getRowCanDrag(row) : true

    // inside droppable (for moving into a folder)
    const insideId = useMemo(
        () => `inside:${draggableId}` as const,
        [draggableId]
    )
    const { isOver: isInsideOver, setNodeRef: setInsideRef } = useDroppable({
        id: insideId
    })

    const style: CSSProperties = {
        transform: isDragging ? undefined : CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1 : undefined,
        position: "relative"
    }

    const insideAllowed = useMemo(() => {
        if (!activeId) return false
        const source = byKey.get(activeId)
        if (!source) return false
        const allowedByProps = getRowCanDrop
            ? getRowCanDrop(source, row, "inside")
            : true
        const allowedByValidList = validTargets
            ? validTargets.has(row.id)
            : true
        return allowedByProps && allowedByValidList
    }, [activeId, byKey, getRowCanDrop, row, validTargets])

    useEffect(() => {
        let t: any
        if (isInsideOver && insideAllowed && hasChildren && !isExpanded) {
            t = setTimeout(() => {
                toggle(row.id)
            }, 500)
        }
        return () => {
            if (t) clearTimeout(t)
        }
    }, [isInsideOver, insideAllowed, hasChildren, isExpanded, row.id, toggle])

    const beforeAllowed = useMemo(() => {
        if (!activeId) return false
        const source = byKey.get(activeId)
        if (!source) return false
        const byProps = getRowCanDrop
            ? getRowCanDrop(source, row, "before")
            : true
        const byValid = validTargets ? validTargets.has(row.id) : true
        return byProps && byValid
    }, [activeId, byKey, getRowCanDrop, row, validTargets])

    const afterAllowed = useMemo(() => {
        if (!activeId) return false
        const source = byKey.get(activeId)
        if (!source) return false
        const byProps = getRowCanDrop
            ? getRowCanDrop(source, row, "after")
            : true
        const byValid = validTargets ? validTargets.has(row.id) : true
        return byProps && byValid
    }, [activeId, byKey, getRowCanDrop, row, validTargets])

    const isEditable = useCallback(
        (col: ColumnDef<T>) => {
            if (readOnly) return false
            if (typeof col.getIsEditable === "function")
                return col.getIsEditable(row)
            return !!col.editor
        },
        [row, readOnly]
    )

    const resolveEditMode = useCallback(
        (col: ColumnDef<T>): "locked" | "unlocked" | "off" => {
            const modeRaw =
                typeof col.editMode === "function"
                    ? (col.editMode as any)(row)
                    : col.editMode
            if (modeRaw === "locked") return "locked"
            if (modeRaw === "unlocked") return "unlocked"
            const globalEdit = viewMode === "edit" && isEditable(col)
            if (globalEdit) return "locked"
            return "off"
        },
        [row, viewMode, isEditable]
    )

    const dragAttrs = {
        ...(attributes as any),
        tabIndex: -1
    } as typeof attributes & { tabIndex: number }

    const handleRowKeyDown = (e: React.KeyboardEvent) => {
        if (e.target !== e.currentTarget) return // ignore when inside inputs
        if (e.key === "ArrowLeft") {
            if (hasChildren && isExpanded) {
                e.preventDefault()
                toggle(row.id)
            }
        } else if (e.key === "ArrowRight") {
            if (hasChildren && !isExpanded) {
                e.preventDefault()
                toggle(row.id)
            }
        }
    }

    return (
        <TableRow
            key={String(row.id)}
            hover
            ref={setNodeRef}
            style={style}
            tabIndex={0}
            aria-level={level + 1}
            aria-expanded={hasChildren ? isExpanded : undefined}
            onKeyDown={handleRowKeyDown}
            sx={(theme) => {
                const color = theme.palette.primary.light
                const isBeforeOverRow =
                    !!activeId &&
                    beforeAllowed &&
                    overId === `before:${draggableId}`
                const isAfterOverRow =
                    !!activeId &&
                    afterAllowed &&
                    overId === `after:${draggableId}`
                const isInsideOverRow =
                    !!activeId &&
                    insideAllowed &&
                    overId === `inside:${draggableId}`
                const base: any = {
                    position: "relative",
                    transition: "background-color 120ms, background-image 120ms"
                }
                if (isInsideOverRow) {
                    base.backgroundColor = color
                    base.backgroundImage = "none"
                } else if (isBeforeOverRow) {
                    base.background = `linear-gradient(to bottom, ${color} 0%, ${color} 20%, transparent 20%, transparent 100%)`
                } else if (isAfterOverRow) {
                    base.backgroundImage = `linear-gradient(to bottom, transparent 0%, transparent 80%, ${color} 80%, ${color} 100%)`
                }
                return base
            }}
        >
            {visibleColumns.map((col, idx) => {
                const key = `${String(row.id)}::${col.id}`
                const editable = isEditable(col)
                const mode = editable ? resolveEditMode(col) : "off"
                const initiallyUnlockedActive =
                    mode === "unlocked" && !autoClosedKeys.has(key)
                const always = mode === "locked"
                const isActive =
                    always || editingKey === key || initiallyUnlockedActive
                const content = isActive ? (
                    <EditorCell
                        row={row}
                        col={col}
                        mode={mode}
                        cellKey={key}
                        editingKey={editingKey}
                        editingValue={editingValue}
                        setEditingKey={setEditingKey}
                        setEditingValue={setEditingValue}
                        markAutoClosed={markAutoClosed}
                        onEditCommit={onEditCommit}
                    />
                ) : (
                    <ViewCell row={row} col={col} level={level} />
                )

                return (
                    <TableCell
                        key={col.id}
                        align={col.align}
                        style={{ width: col.width, position: "relative"  }}
                        sx={
                            !!col.editor && editable && !always && !isActive
                                ? {
                                      "&:hover .cell-edit-btn": { opacity: 1 }
                                  }
                                : undefined
                        }
                        onDoubleClick={() => {
                            if (!always && editable) startEdit(row, col)
                        }}
                    >
                        {IndentedCell(
                            row,
                            col,
                            level,
                            idx === 0,
                            hasChildren,
                            isExpanded,
                            hasChildren ? () => toggle(row.id) : undefined,
                            idx === 0 && canDrag ? (
                                <IconButton
                                    size={size === "small" ? "small" : "medium"}
                                    disableRipple
                                    disableFocusRipple
                                    sx={{
                                        mr: 0.5,
                                        cursor: "grab",
                                        touchAction: "none",
                                        "&:focus,&:focus-visible": {
                                            outline: "none"
                                        }
                                    }}
                                    {...dragAttrs}
                                    {...listeners}
                                >
                                    <DragIndicatorIcon
                                        fontSize={
                                            size === "small"
                                                ? "small"
                                                : "medium"
                                        }
                                    />
                                </IconButton>
                            ) : undefined,
                            size,
                            content
                        )}
                        {!!col.editor && editable && !always && !isActive && (
                            <IconButton
                                size="small"
                                className="cell-edit-btn"
                                aria-label="Edit"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    startEdit(row, col)
                                }}
                                sx={{
                                    position: "absolute",
                                    right: 6,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    opacity: 0,
                                    transition: "opacity 120ms"
                                }}
                            >
                                <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                        )}
                    </TableCell>
                )
            })}
            {getRowActions && (
                <TableCell key="__actions" align="right">
                    {getRowActions(row)}
                </TableCell>
            )}

            {!readOnly && (
                <>
                    <Box
                        ref={setInsideRef}
                        sx={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            top: "33.333%",
                            bottom: "33.333%",
                            pointerEvents: activeId ? "auto" : "none",
                            display: insideAllowed ? "block" : "none"
                        }}
                    />
                    <DropEdgeOverlays
                        rowId={draggableId}
                        allowedBefore={!!activeId && beforeAllowed}
                        allowedAfter={!!activeId && afterAllowed}
                        isActiveDrag={!!activeId}
                    />
                </>
            )}
        </TableRow>
    )
}
