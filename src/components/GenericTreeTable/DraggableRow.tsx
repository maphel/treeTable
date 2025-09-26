import { useDraggable, useDroppable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { DragIndicator as DragIndicatorIcon } from "@mui/icons-material"
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
    activeId: string | null
    byKey: Map<string, RowModel<T>>
    toggle: (id: string) => void
    viewMode: string | undefined
    getRowActions?: (row: RowModel<T>) => ReactNode
    editingKey: string | null
    editingValue: any
    setEditingKey: Dispatch<SetStateAction<string | null>>
    setEditingValue: Dispatch<SetStateAction<any>>
    autoClosedKeys: Set<string>
    markAutoClosed: (key: string) => void
    clearAutoClosedForRow: (rowId: string) => void
    startEdit: (row: RowModel<T>, column: ColumnDef<T>) => void
    onEditCommit?: (
        row: RowModel<T>,
        column: ColumnDef<T>,
        next: unknown
    ) => Promise<void> | void
    onRowAllEditorsClosed?: (row: RowModel<T>) => void
}

// No custom cursor: keep system default

function DraggableRowInner<T extends object>(
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
        clearAutoClosedForRow,
        startEdit,
        onEditCommit,
        onRowAllEditorsClosed
    } = props

    const { row, level, hasChildren, expanded: isExpanded } = data
    const draggableId = String(row.id)
    const { attributes, listeners, setNodeRef, transform, isDragging } =
        useDraggable({ id: draggableId })
    const canDrag = readOnly ? false : getRowCanDrag ? getRowCanDrag(row) : true

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
        position: "relative",
        willChange: "transform"
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

    const anyUnlocked = useMemo(
        () => visibleColumns.some((c) => isEditable(c) && resolveEditMode(c) === "unlocked"),
        [visibleColumns, isEditable, resolveEditMode]
    )
    const prevUnlockedRef = React.useRef(false)
    useEffect(() => {
        if (!prevUnlockedRef.current && anyUnlocked) {
            clearAutoClosedForRow(String(row.id))
        }
        prevUnlockedRef.current = anyUnlocked
    }, [anyUnlocked, clearAutoClosedForRow, row.id])

    const allClosedNotifiedRef = React.useRef(false)
    useEffect(() => {
        if (!anyUnlocked) {
            allClosedNotifiedRef.current = false
            return
        }
        const unlockedKeys = visibleColumns
            .filter((c) => isEditable(c) && resolveEditMode(c) === "unlocked")
            .map((c) => `${String(row.id)}::${c.id}`)
        if (unlockedKeys.length === 0) return
        const allClosed = unlockedKeys.every((k) => autoClosedKeys.has(k))
        if (allClosed && !allClosedNotifiedRef.current) {
            onRowAllEditorsClosed?.(row)
            allClosedNotifiedRef.current = true
        } else if (!allClosed) {
            allClosedNotifiedRef.current = false
        }
    }, [anyUnlocked, visibleColumns, isEditable, resolveEditMode, row, autoClosedKeys, onRowAllEditorsClosed])

    const dragAttrs = {
        ...(attributes as any),
        tabIndex: -1
    } as typeof attributes & { tabIndex: number }

    const handleRowKeyDown = (e: React.KeyboardEvent) => {
        if (e.target !== e.currentTarget) return
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
            sx={{
                position: "relative",
                transition: "background-color 120ms, background-image 120ms"
            }}
        >
            {visibleColumns.map((col, idx) => {
                const key = `${String(row.id)}::${col.id}`
                const editable = isEditable(col)
                const mode = editable ? resolveEditMode(col) : "off"
                const isUnlockTransition = !prevUnlockedRef.current && anyUnlocked
                const initiallyUnlockedActive =
                    mode === "unlocked" && (!autoClosedKeys.has(key) || isUnlockTransition)
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
                    // Wrap view content to enable click-to-edit; show pointer when editable
                    <Box
                        onMouseDown={(e) => {
                            // Start edit early in the pointer sequence to avoid blur race
                            if (!always && editable) {
                                e.preventDefault();
                                startEdit(row, col)
                            }
                        }}
                        sx={!!col.editor && editable && !always ? { '&:hover': { cursor: 'pointer' } } : undefined}
                    >
                        <ViewCell row={row} col={col} level={level} />
                    </Box>
                )

                return (
                    <TableCell
                        key={col.id}
                        align={col.align}
                        style={{ width: col.width, position: "relative"  }}
                        sx={undefined}
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
                        
                        {idx === 0 && !readOnly && (
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
                                {activeId && insideAllowed && isInsideOver && (
                                    <Box
                                        sx={(theme) => ({
                                            position: "absolute",
                                            left: 0,
                                            right: 0,
                                            top: 0,
                                            bottom: 0,
                                            pointerEvents: "none",
                                            backgroundColor: theme.palette.primary.light,
                                            zIndex: 1
                                        })}
                                    />
                                )}
                                <DropEdgeOverlays
                                    rowId={draggableId}
                                    allowedBefore={!!activeId && beforeAllowed}
                                    allowedAfter={!!activeId && afterAllowed}
                                    isActiveDrag={!!activeId}
                                />
                            </>
                        )}
                        {/* Removed pencil edit button in favor of click-to-edit */}
                    </TableCell>
                )
            })}
            {getRowActions && (
                <TableCell key="__actions" align="right">
                    {getRowActions(row)}
                </TableCell>
            )}
        </TableRow>
    )
}

const DraggableRow = React.memo(DraggableRowInner) as typeof DraggableRowInner

export default DraggableRow
