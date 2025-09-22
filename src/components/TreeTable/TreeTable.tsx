import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, pointerWithin } from '@dnd-kit/core';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { ColumnDef, RowId, RowModel, TreeTableProps } from './types';
import IndentedCell from './internal/IndentedCell';
import DraggableRow from './internal/DraggableRow';
import { buildRowIndexMap, buildVisibleRows, getVisibleColumns, toIdSet } from './internal/utils';
import { useExpandedRows, useValidTargets } from './internal/hooks';
import type { VisibleRow } from './internal/types';

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

  const isCustomerView = viewMode === 'customer';

  const { expanded, toggle } = useExpandedRows(expandedRowIds, onRowToggle);

  const visible: VisibleRow<T>[] = React.useMemo(() => {
    const out: VisibleRow<T>[] = [];
    buildVisibleRows(rows || [], 0, expanded, out);
    return out;
  }, [rows, expanded]);
  // Apply column visibility if provided
  const visibleColumns: ColumnDef<T>[] = React.useMemo(() => getVisibleColumns(columns as ColumnDef<T>[], viewMode), [columns, viewMode]);

  const byKey = React.useMemo(() => buildRowIndexMap(rows), [rows]);

  // (Removed boundary-hiding of before/after to allow first/last placement via edges)

  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [overId, setOverId] = React.useState<string | null>(null);
  const validTargets = useValidTargets<T>(activeId, byKey, getValidDropTargets);

  // Inline editing state (for non-locked cells)
  const [editingKey, setEditingKey] = React.useState<string | null>(null);
  const [editingValue, setEditingValue] = React.useState<any>(undefined);
  // Tracks auto-opened 'unlocked' cells that were committed/canceled, so they don't reopen.
  const [autoClosedKeys, setAutoClosedKeys] = React.useState<Set<string>>(new Set());

  const startEdit = React.useCallback((row: RowModel<T>, column: ColumnDef<T>) => {
    const key = `${String(row.id)}::${column.id}`;
    const raw = (row as any)[column.id];
    setEditingKey(key);
    setEditingValue(raw);
  }, []);

  const markAutoClosed = React.useCallback((key: string) => {
    setAutoClosedKeys(prev => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);

  // validTargets now handled by useValidTargets

  const sensors = useSensors(
    // Configurable activation: delay/tolerance (default) or distance
    useSensor(
      PointerSensor,
      // dnd-kit types accept either Delay or Distance constraints; keep it flexible.
      ((): any => {
        const a = props.dragActivation;
        if (a?.mode === 'distance') {
          return { activationConstraint: { distance: a.distance ?? 3 } };
        }
        return { activationConstraint: { delay: a?.delay ?? 150, tolerance: a?.tolerance ?? 5 } };
      })()
    )
  );

  // Prefer edge (before/after) zones over inside, and filter out disallowed targets.
  // Do NOT fallback when the pointer isn't over any droppable: no hover anywhere.
  const collisionDetection = React.useCallback((args: any) => {
    const hits: any[] = pointerWithin(args) || [];

    const score = (id: unknown): number => {
      const s = String(id);
      if (s.startsWith('before:') || s.startsWith('after:')) return 0; // highest priority
      if (s.startsWith('inside:')) return 1; // fallback if not over edge zones
      return 2; // anything else
    };

    const isAllowed = (id: string): boolean => {
      if (!activeId) return true;
      const parts = id.includes(':') ? id.split(':') as [string, string] : (['', ''] as [string, string]);
      let pos = parts[0] as 'inside' | 'before' | 'after' | '';
      const targetKey = parts[1];
      if (!pos || !targetKey) return true;
      const source = byKey.get(activeId);
      const target = byKey.get(targetKey);
      if (!source || !target) return false;
      if (source.id === target.id) return false; // can't drop onto itself
      const byProps = getRowCanDrop ? getRowCanDrop(source, target, pos) : true;
      const byList = validTargets ? validTargets.has(target.id) : true;
      return byProps && byList;
    };

    const filtered = hits.filter((h) => isAllowed(String(h.id)));
    // If nothing valid under the pointer, show nothing (no sticky hover)
    if (filtered.length === 0) return [] as any[];

    filtered.sort((a, b) => {
      const sa = score(a.id);
      const sb = score(b.id);
      if (sa !== sb) return sa - sb;
      // For identical scores, preserve higher confidence first
      const va = (a.data && typeof a.data.value === 'number') ? a.data.value : 0;
      const vb = (b.data && typeof b.data.value === 'number') ? b.data.value : 0;
      return vb - va;
    });

    return filtered;
  }, [activeId, byKey, getRowCanDrop, validTargets]);

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
  // Row rendering is extracted into internal/DraggableRow

  return (
    <TableContainer>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <Table size={size} role="treegrid" aria-readonly={isCustomerView || undefined}>
          <TableHead>
            <TableRow>
              {visibleColumns.map((col) => (
                <TableCell key={col.id} align={col.align} style={{ width: col.width }}>{col.header}</TableCell>
              ))}
              {getRowActions && !isCustomerView && (
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
                isCustomerView={isCustomerView}
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
          {activeId ? (() => {
            const activeRow = byKey.get(activeId!);
            if (!activeRow) return null;
            const meta = visible.find(v => String(v.row.id) === activeId);
            const level = meta?.level ?? 0;
            const hasChildren = meta?.hasChildren ?? false;
            const isExpanded = meta?.expanded ?? false;
            return (
              <Box sx={{ px: 1.5, py: 1, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, boxShadow: 6, minWidth: 240 }}>
                {IndentedCell(
                  activeRow,
                  visibleColumns[0],
                  level,
                  true,
                  hasChildren,
                  isExpanded,
                  undefined,
                  (
                    <IconButton size={size === 'small' ? 'small' : 'medium'} disableRipple disableFocusRipple sx={{ mr: 1, cursor: 'grabbing', '&:focus,&:focus-visible': { outline: 'none' } }}>
                      <DragIndicatorIcon fontSize={size === 'small' ? 'small' : 'medium'} />
                    </IconButton>
                  ),
                  size
                )}
              </Box>
            );
          })() : null}
        </DragOverlay>
      </DndContext>
    </TableContainer>
  );
}

export default TreeTable;
