import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { ColumnDef, RowModel, TreeTableProps } from './types';
import DraggableRow from './internal/DraggableRow';
import { buildRowIndexMap, buildVisibleRows, getVisibleColumns } from './internal/utils';
import { useExpandedRows, useValidTargets, useDragSensors, useInlineEditing } from './internal/hooks';
import type { VisibleRow } from './internal/types';
import { createCollisionDetector } from './internal/collision';
import DragOverlayContent from './internal/DragOverlayContent';

export function TreeTable<T extends object = {}>(props: TreeTableProps<T>) {
  const {
    rows,
    columns,
    size = 'medium',
    expandedRowIds,
    onRowToggle,
    getRowActions,
    getRowCanDrag,
    getRowCanDrop,
    onDrop,
    getValidDropTargets,
    viewMode,
    actionsHeader,
  } = props;
  // Normalize optionals to strict booleans for child props/ARIA
  const readOnly = !!props.readOnly;
  const showActionsColumn = props.showActionsColumn !== false;

  const { expanded, toggle } = useExpandedRows(expandedRowIds, onRowToggle);

  const visible: VisibleRow<T>[] = React.useMemo(() => {
    const out: VisibleRow<T>[] = [];
    buildVisibleRows(rows || [], 0, expanded, out);
    return out;
  }, [rows, expanded]);
  // Apply column visibility if provided
  const visibleColumns: ColumnDef<T>[] = React.useMemo(() => getVisibleColumns(columns as ColumnDef<T>[], viewMode), [columns, viewMode]);

  const byKey = React.useMemo(() => buildRowIndexMap(rows), [rows]);


  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [overId, setOverId] = React.useState<string | null>(null);
  const validTargets = useValidTargets<T>(activeId, byKey, getValidDropTargets);
  const sensors = useDragSensors(props.dragActivation);
  const { editingKey, setEditingKey, editingValue, setEditingValue, autoClosedKeys, markAutoClosed, startEdit } = useInlineEditing<T>();


  // Prefer edge (before/after) zones over inside, and filter out disallowed targets.
  const collisionDetection = React.useMemo(() => createCollisionDetector<T>({ activeId, byKey, getRowCanDrop, validTargets }), [activeId, byKey, getRowCanDrop, validTargets]);

  const handleDragStart = React.useCallback((ev: DragStartEvent) => {
    const id = String(ev.active.id);
    setActiveId(id);
  }, []);

  const handleDragEnd = React.useCallback((ev: DragEndEvent) => {
    const activeKey = String(ev.active.id);
    const overKey = ev.over ? String(ev.over.id) : null;
    setOverId(null);
    setActiveId(null);
    if (!overKey) return;
    const parts = overKey.includes(':') ? (overKey.split(':') as [string, string]) : (null as any);
    let position: string | null = parts ? parts[0] : null;
    let targetKey: string | null = parts ? parts[1] : null;
    if (!position || !targetKey) return;
    const sourceRow = byKey.get(activeKey);
    const targetRow = byKey.get(targetKey);
    if (!sourceRow || !targetRow) return;

    // position can now only be: inside | before | after

    // validate
    const canDrop = getRowCanDrop ? getRowCanDrop(sourceRow, targetRow, position as any) : true;
    const validTargetByList = validTargets ? validTargets.has(targetRow.id) : true;
    if (!canDrop || !validTargetByList) return;
    onDrop?.(sourceRow.id, targetRow.id, position as any);
  }, [byKey, getRowCanDrop, onDrop, validTargets]);

  const handleDragOver = React.useCallback((ev: any) => {
    setOverId(ev.over ? String(ev.over.id) : null);
  }, []);

  return (
    <TableContainer>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <Table size={size} role="treegrid" aria-readonly={readOnly || undefined}>
          <TableHead>
            <TableRow>
              {visibleColumns.map((col) => (
                <TableCell key={col.id} align={col.align} style={{ width: col.width }}>{col.header}</TableCell>
              ))}
              {getRowActions && showActionsColumn && (
                <TableCell key="__actions" align="right">{actionsHeader ?? 'Actions'}</TableCell>
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
                showActionsColumn={showActionsColumn}
                getRowCanDrag={getRowCanDrag}
                getRowCanDrop={getRowCanDrop}
                validTargets={validTargets}
                overId={overId}
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
                startEdit={startEdit}
                onEditCommit={props.onEditCommit}
              />
            ))}
          </TableBody>
        </Table>
        <DragOverlay>
          <DragOverlayContent
            activeId={activeId}
            byKey={byKey}
            visible={visible}
            firstColumn={visibleColumns[0]}
            size={size}
          />
        </DragOverlay>
      </DndContext>
    </TableContainer>
  );
}

export default TreeTable;
