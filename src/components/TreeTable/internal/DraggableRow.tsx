import * as React from 'react';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

import type { ColumnDef, RowId, RowModel, ViewMode } from '../types';
import type { VisibleRow } from './types';
import DropEdgeOverlays from './DropEdgeOverlays';
import IndentedCell from './IndentedCell';
import EditorCell from './EditorCell';
import ViewCell from './ViewCell';

export type DraggableRowProps<T extends object> = {
  data: VisibleRow<T>;
  visibleColumns: ColumnDef<T>[];
  size: 'small' | 'medium';
  readOnly: boolean;
  showActionsColumn: boolean;
  getRowCanDrag?: (row: RowModel<T>) => boolean;
  getRowCanDrop?: (source: RowModel<T>, target: RowModel<T>, position: 'inside' | 'before' | 'after') => boolean;
  validTargets: Set<RowId> | null;
  overId: string | null;
  activeId: string | null;
  byKey: Map<string, RowModel<T>>;
  toggle: (id: RowId) => void;
  viewMode: ViewMode | undefined;
  getRowActions?: (row: RowModel<T>) => React.ReactNode;
  // inline edit state
  editingKey: string | null;
  editingValue: any;
  setEditingKey: React.Dispatch<React.SetStateAction<string | null>>;
  setEditingValue: React.Dispatch<React.SetStateAction<any>>;
  autoClosedKeys: Set<string>;
  markAutoClosed: (key: string) => void;
  startEdit: (row: RowModel<T>, column: ColumnDef<T>) => void;
  onEditCommit?: (row: RowModel<T>, column: ColumnDef<T>, next: unknown) => Promise<void> | void;
};

export default function DraggableRow<T extends object = {}>(props: DraggableRowProps<T>) {
  const {
    data,
    visibleColumns,
    size,
    readOnly,
    showActionsColumn,
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
    onEditCommit,
  } = props;

  const { row, level, hasChildren, expanded: isExpanded } = data;
  const draggableId = String(row.id);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: draggableId });
  const canDrag = readOnly ? false : (getRowCanDrag ? getRowCanDrag(row) : true);

  // inside droppable (for moving into a folder)
  const insideId = React.useMemo(() => `inside:${draggableId}` as const, [draggableId]);
  const { isOver: isInsideOver, setNodeRef: setInsideRef } = useDroppable({ id: insideId });

  const style: React.CSSProperties = {
    transform: isDragging ? undefined : CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : undefined,
    position: 'relative',
  };

  const insideAllowed = React.useMemo(() => {
    if (!activeId) return false;
    const source = byKey.get(activeId);
    if (!source) return false;
    const allowedByProps = getRowCanDrop ? getRowCanDrop(source, row, 'inside') : true;
    const allowedByValidList = validTargets ? validTargets.has(row.id) : true;
    return allowedByProps && allowedByValidList;
  }, [activeId, byKey, getRowCanDrop, row, validTargets]);

  React.useEffect(() => {
    let t: any;
    if (isInsideOver && insideAllowed && hasChildren && !isExpanded) {
      t = setTimeout(() => { toggle(row.id); }, 500);
    }
    return () => { if (t) clearTimeout(t); };
  }, [isInsideOver, insideAllowed, hasChildren, isExpanded, row.id, toggle]);

  const beforeAllowed = React.useMemo(() => {
    if (!activeId) return false;
    const source = byKey.get(activeId);
    if (!source) return false;
    const byProps = getRowCanDrop ? getRowCanDrop(source, row, 'before') : true;
    const byValid = validTargets ? validTargets.has(row.id) : true;
    return byProps && byValid;
  }, [activeId, byKey, getRowCanDrop, row, validTargets]);

  const afterAllowed = React.useMemo(() => {
    if (!activeId) return false;
    const source = byKey.get(activeId);
    if (!source) return false;
    const byProps = getRowCanDrop ? getRowCanDrop(source, row, 'after') : true;
    const byValid = validTargets ? validTargets.has(row.id) : true;
    return byProps && byValid;
  }, [activeId, byKey, getRowCanDrop, row, validTargets]);

  const isEditable = React.useCallback((col: ColumnDef<T>) => {
    if (readOnly) return false;
    if (typeof col.getIsEditable === 'function') return !!col.getIsEditable(row);
    return !!col.editor;
  }, [row, readOnly]);

  const resolveEditMode = React.useCallback((col: ColumnDef<T>): 'locked' | 'unlocked' | 'off' => {
    const modeRaw = typeof col.editMode === 'function' ? (col.editMode as any)(row) : col.editMode;
    if (modeRaw === 'locked') return 'locked';
    if (modeRaw === 'unlocked') return 'unlocked';
    const globalEdit = viewMode === 'edit' && isEditable(col);
    if (globalEdit) return 'locked';
    return 'off';
  }, [row, viewMode, isEditable]);

  

  const dragAttrs = { ...(attributes as any), tabIndex: -1 } as typeof attributes & { tabIndex: number };

  const handleRowKeyDown = (e: React.KeyboardEvent) => {
    if (e.target !== e.currentTarget) return; // ignore when inside inputs
    if (e.key === 'ArrowLeft') {
      if (hasChildren && isExpanded) {
        e.preventDefault();
        toggle(row.id);
      }
    } else if (e.key === 'ArrowRight') {
      if (hasChildren && !isExpanded) {
        e.preventDefault();
        toggle(row.id);
      }
    }
  };

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
        const color = theme.palette.primary.light;
        const isBeforeOverRow = !!activeId && beforeAllowed && overId === `before:${draggableId}`;
        const isAfterOverRow = !!activeId && afterAllowed && overId === `after:${draggableId}`;
        const isInsideOverRow = !!activeId && insideAllowed && overId === `inside:${draggableId}`;
        const base: any = { position: 'relative', transition: 'background-color 120ms, background-image 120ms' };
        if (isInsideOverRow) {
          base.backgroundColor = color;
          base.backgroundImage = 'none';
        } else if (isBeforeOverRow) {
          base.backgroundImage = `linear-gradient(to bottom, ${color} 0%, ${color} 33.333%, transparent 33.333%, transparent 100%)`;
        } else if (isAfterOverRow) {
          base.backgroundImage = `linear-gradient(to bottom, transparent 0%, transparent 66.666%, ${color} 66.666%, ${color} 100%)`;
        }
        return base;
      }}
    >
      {visibleColumns.map((col, idx) => {
        const key = `${String(row.id)}::${col.id}`;
        const editable = isEditable(col);
        const mode = editable ? resolveEditMode(col) : 'off';
        const initiallyUnlockedActive = mode === 'unlocked' && !autoClosedKeys.has(key);
        const always = mode === 'locked';
        const isActive = always || editingKey === key || initiallyUnlockedActive;
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
        );

        return (
          <TableCell
            key={col.id}
            align={col.align}
            style={{ width: col.width, position: 'relative' }}
            sx={!!col.editor && editable && !always && !isActive ? { pr: 5, '&:hover .cell-edit-btn': { opacity: 1 } } : undefined}
            onDoubleClick={() => { if (!always && editable) startEdit(row, col); }}
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
                  size={size === 'small' ? 'small' : 'medium'}
                  disableRipple
                  disableFocusRipple
                  sx={{ mr: 1, cursor: 'grab', touchAction: 'none', '&:focus,&:focus-visible': { outline: 'none' } }}
                  {...dragAttrs}
                  {...listeners}
                >
                  <DragIndicatorIcon fontSize={size === 'small' ? 'small' : 'medium'} />
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
                onClick={(e) => { e.stopPropagation(); startEdit(row, col); }}
                sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', opacity: 0, transition: 'opacity 120ms' }}
              >
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            )}
          </TableCell>
        );
      })}
      {getRowActions && showActionsColumn && (
        <TableCell key="__actions" align="right">{getRowActions(row)}</TableCell>
      )}

      {!readOnly && (
        <>
          <Box
            ref={setInsideRef}
            sx={{ position: 'absolute', left: 0, right: 0, top: '33.333%', bottom: '33.333%', pointerEvents: activeId ? 'auto' : 'none', display: insideAllowed ? 'block' : 'none' }}
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
  );
}
