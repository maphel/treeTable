import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useDroppable, useSensor, useSensors, pointerWithin, closestCenter } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useDraggable } from '@dnd-kit/core';
import { ColumnDef, RowId, RowModel, TreeTableProps } from './types';

type VisibleRow<T extends object> = {
  row: RowModel<T>;
  level: number;
  hasChildren: boolean;
  expanded: boolean;
};

function toIdSet(ids?: Set<RowId> | RowId[]): Set<RowId> {
  if (!ids) return new Set<RowId>();
  return ids instanceof Set ? ids : new Set<RowId>(ids);
}

function buildVisibleRows<T extends object>(
  nodes: RowModel<T>[],
  level: number,
  expandedIds: Set<RowId>,
  out: VisibleRow<T>[]
) {
  for (const n of nodes) {
    const hasChildren = !!(n.children && n.children.length > 0);
    const expanded = hasChildren && expandedIds.has(n.id);
    out.push({ row: n, level, hasChildren, expanded });
    if (hasChildren && expanded) {
      buildVisibleRows(n.children!, level + 1, expandedIds, out);
    }
  }
}

function DefaultCell<T extends object>(
  row: RowModel<T>,
  column: ColumnDef<T>,
  level: number,
  isFirst: boolean,
  hasChildren: boolean,
  expanded: boolean,
  onToggle?: () => void,
  dragHandle?: React.ReactNode,
  size: 'small' | 'medium' = 'medium',
  overrideContent?: React.ReactNode
) {
  const raw = (row as any)[column.id];
  const value = column.valueFormatter ? column.valueFormatter(raw, row) : raw;
  const content = typeof overrideContent !== 'undefined'
    ? overrideContent
    : (column.cell ? column.cell({ row, value, level, column }) : value);

  if (!isFirst) return content as React.ReactNode;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', pl: level * 2, position: 'relative' }}>
      {hasChildren ? (
        <IconButton size={size === 'small' ? 'small' : 'medium'} onClick={onToggle} sx={{ mr: 1 }}>
          {expanded
            ? <ExpandMoreIcon fontSize={size === 'small' ? 'small' : 'medium'} />
            : <ChevronRightIcon fontSize={size === 'small' ? 'small' : 'medium'} />}
        </IconButton>
      ) : (
        <Box sx={{ width: size === 'small' ? 32 : 40, mr: 1 }} />
      )}
      {dragHandle}
      <Box sx={{ minWidth: 0, flex: 1 }}>{content as React.ReactNode}</Box>
    </Box>
  );
}

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
    findValidTargetsForMove,
    viewMode,
  } = props;

  const isCustomerView = viewMode === 'customer';

  const controlled = typeof expandedRowIds !== 'undefined';
  const [internalExpanded, setInternalExpanded] = React.useState<Set<RowId>>(toIdSet(expandedRowIds));

  React.useEffect(() => {
    if (controlled) {
      setInternalExpanded(toIdSet(expandedRowIds));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlled, expandedRowIds]);

  const expanded = controlled ? toIdSet(expandedRowIds) : internalExpanded;

  const toggle = React.useCallback(
    (id: RowId) => {
      const isExpanded = expanded.has(id);
      if (!controlled) {
        setInternalExpanded(prev => {
          const next = new Set(prev);
          if (isExpanded) next.delete(id); else next.add(id);
          return next;
        });
      }
      onRowToggle?.(id, !isExpanded);
    },
    [expanded, controlled, onRowToggle]
  );

  const visible: VisibleRow<T>[] = React.useMemo(() => {
    const out: VisibleRow<T>[] = [];
    buildVisibleRows(rows || [], 0, expanded, out);
    return out;
  }, [rows, expanded]);

  const keyOf = React.useCallback((id: RowId) => String(id), []);
  // Apply column visibility if provided
  const visibleColumns: ColumnDef<T>[] = React.useMemo(() => {
    return (columns || []).filter((c) => (typeof c.getIsVisible === 'function' ? c.getIsVisible(viewMode) : true));
  }, [columns, viewMode]);

  const colSpan = React.useMemo(() => visibleColumns.length + (getRowActions && !isCustomerView ? 1 : 0), [visibleColumns.length, getRowActions, isCustomerView]);

  const byKey = React.useMemo(() => {
    const m = new Map<string, RowModel<T>>();
    const add = (nodes?: RowModel<T>[]) => {
      nodes?.forEach(n => {
        m.set(keyOf(n.id), n);
        if (n.children) add(n.children);
      });
    };
    add(rows);
    return m;
  }, [rows, keyOf]);

  // (Removed boundary-hiding of before/after to allow first/last placement via edges)

  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [overId, setOverId] = React.useState<string | null>(null);
  const [validTargets, setValidTargets] = React.useState<Set<RowId> | null>(null);

  // Inline editing state (for non-locked cells)
  const [editingKey, setEditingKey] = React.useState<string | null>(null);
  const [editingValue, setEditingValue] = React.useState<any>(undefined);
  // Tracks auto-opened 'unlocked' cells that were committed/canceled, so they don't reopen.
  const [autoClosedKeys, setAutoClosedKeys] = React.useState<Set<string>>(new Set());

  const makeKey = React.useCallback((rowId: RowId, colId: string) => `${String(rowId)}::${colId}`, []);

  const startEdit = React.useCallback((row: RowModel<T>, column: ColumnDef<T>) => {
    const key = makeKey(row.id, column.id);
    const raw = (row as any)[column.id];
    setEditingKey(key);
    setEditingValue(raw);
  }, [makeKey]);

  const markAutoClosed = React.useCallback((key: string) => {
    setAutoClosedKeys(prev => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!activeId || !findValidTargetsForMove) {
        setValidTargets(null);
        return;
      }
      const src = byKey.get(activeId);
      if (!src) return;
      const res = await findValidTargetsForMove(src);
      if (cancelled) return;
      const setVal = res instanceof Set ? res : new Set<RowId>(res as RowId[]);
      setValidTargets(setVal);
    }
    load();
    return () => { cancelled = true; };
  }, [activeId, byKey, findValidTargetsForMove]);

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

  // Prefer edge (before/after) zones over inside, and filter out disallowed targets
  const collisionDetection = React.useCallback((args: any) => {
    // Start from pointerWithin for intuitive pointer-driven behavior; fall back to closestCenter
    let hits: any[] = pointerWithin(args);
    if (!hits || hits.length === 0) {
      hits = closestCenter(args);
    }

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
    if (filtered.length === 0) return hits; // fall back to raw if all got filtered

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

  // Inline, absolute-positioned drop zones to avoid layout shifts while dragging.
  // We only render overlays inside the first cell of each row.
  function BeforeAfterOverlays({
    rowId,
    allowedBefore,
    allowedAfter,
  }: { rowId: string; allowedBefore: boolean; allowedAfter: boolean }) {
    const beforeId = React.useMemo(() => `before:${rowId}` as const, [rowId]);
    const afterId = React.useMemo(() => `after:${rowId}` as const, [rowId]);
    const { isOver: isBeforeOver, setNodeRef: setBeforeRef } = useDroppable({ id: beforeId });
    const { isOver: isAfterOver, setNodeRef: setAfterRef } = useDroppable({ id: afterId });

    const commonZoneStyles = {
      position: 'absolute' as const,
      left: 0,
      right: 0,
      pointerEvents: activeId ? 'auto' : 'none',
      zIndex: 2,
    };

    return (
      <>
        {/* BEFORE drop area (top edge) */}
        <Box
          ref={setBeforeRef}
          sx={{
            ...commonZoneStyles,
            top: 0,
            height: '33.333%',
            display: allowedBefore ? 'block' : 'none',
          }}
        />

        {/* AFTER drop area (bottom edge) */}
        <Box
          ref={setAfterRef}
          sx={{
            ...commonZoneStyles,
            bottom: 0,
            height: '33.333%',
            display: allowedAfter ? 'block' : 'none',
          }}
        />
      </>
    );
  }

  function DraggableRow({ data }: { data: VisibleRow<T> }) {
    const { row, level, hasChildren, expanded: isExpanded } = data;
    const draggableId = keyOf(row.id);
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: draggableId });
    const canDrag = isCustomerView ? false : (getRowCanDrag ? getRowCanDrag(row) : true);

    // inside droppable (for moving into a folder)
    const insideId = React.useMemo(() => `inside:${draggableId}` as const, [draggableId]);
    const { isOver: isInsideOver, setNodeRef: setInsideRef } = useDroppable({ id: insideId });

    const style: React.CSSProperties = {
      // Keep the original row in place while dragging; overlay renders the preview
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

    // Gentle auto-expand folders when hovering "inside" to make grouping smooth
    React.useEffect(() => {
      let t: any;
      if (isInsideOver && insideAllowed && hasChildren && !isExpanded) {
        t = setTimeout(() => {
          toggle(row.id);
        }, 500);
      }
      return () => { if (t) clearTimeout(t); };
    }, [isInsideOver, insideAllowed, hasChildren, isExpanded, row.id]);

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

    // Helpers for editable cells
    const isEditable = React.useCallback((col: ColumnDef<T>) => {
      if (isCustomerView) return false;
      if (typeof col.getIsEditable === 'function') return !!col.getIsEditable(row);
      // Default: if an editor is provided, allow editing unless explicitly hidden by view mode
      return !!col.editor;
    }, [row, isCustomerView]);

    const resolveEditMode = React.useCallback((col: ColumnDef<T>): 'locked' | 'unlocked' | 'off' => {
      // Per-column/row override first
      const modeRaw = typeof col.editMode === 'function' ? (col.editMode as any)(row) : col.editMode;
      if (modeRaw === 'locked') return 'locked';
      if (modeRaw === 'unlocked') return 'unlocked';
      // Global default: if viewMode=edit and column is editable -> locked
      const globalEdit = viewMode === 'edit' && isEditable(col);
      if (globalEdit) return 'locked';
      return 'off';
    }, [row, viewMode, isEditable]);

    function EditorCell({ col, mode, cellKey }: { col: ColumnDef<T>; mode: 'locked' | 'unlocked' | 'off'; cellKey: string }) {
      const key = cellKey;
      const raw = (row as any)[col.id];
      const always = mode === 'locked';
      const active = always || editingKey === key;
      const [val, setVal] = React.useState<any>(active ? (always ? raw : editingValue) : raw);

      // Keep in sync when row value changes (e.g. after commit)
      React.useEffect(() => {
        if (always) {
          setVal(raw);
        } else if (editingKey === key) {
          setVal(editingValue);
        } else {
          setVal(raw);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [raw, editingKey, editingValue, key, always]);

      const commitWithValue = React.useCallback(async (v: any) => {
        const parsed = col.valueParser ? col.valueParser(v, row) : v;
        try {
          await props.onEditCommit?.(row, col, parsed);
          if (!always) {
            setEditingKey(null);
            setEditingValue(undefined);
          }
          if (mode === 'unlocked') {
            markAutoClosed(key);
          }
        } catch (e) {
          // keep editor open on error
          // eslint-disable-next-line no-console
          console.warn('Commit failed', e);
        }
      }, [col, row, always, mode, key]);

      const commit = React.useCallback(async () => {
        await commitWithValue(val);
      }, [commitWithValue, val]);

      const cancel = React.useCallback(() => {
        if (!always) {
          setEditingKey(null);
          setEditingValue(undefined);
        } else {
          setVal(raw);
        }
        if (mode === 'unlocked') {
          markAutoClosed(key);
        }
      }, [always, raw, mode, key]);

      const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          void commit();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          cancel();
        }
      };

      const handleBlur = () => {
        // Commit on blur; do not close if always
        void commit();
      };

      if (!col.editor) {
        return null;
      }

      const autoCommit = typeof col.autoCommitOnChange === 'function' ? (col.autoCommitOnChange as any)(row) : !!col.autoCommitOnChange;
      const commitOnceRef = React.useRef(false);

      const handleChange = React.useCallback((next: any) => {
        setVal(next);
        if (autoCommit && !always && !commitOnceRef.current) {
          commitOnceRef.current = true;
          void commitWithValue(next);
        }
      }, [autoCommit, always, mode, commitWithValue]);

      return (
        <Box onKeyDown={handleKeyDown} onBlur={handleBlur} sx={{ width: '100%' }}>
          {col.editor({
            row,
            value: val,
            onChange: handleChange,
            commit: () => void commit(),
            cancel,
            autoFocus: !always && editingKey === key,
          })}
        </Box>
      );
    }

    const renderViewContent = (col: ColumnDef<T>) => {
      const raw = (row as any)[col.id];
      const value = col.valueFormatter ? col.valueFormatter(raw, row) : raw;
      return col.cell ? col.cell({ row, value, level, column: col }) : value as React.ReactNode;
    };

    return (
      <>
        <TableRow
          key={String(row.id)}
          hover
          ref={setNodeRef}
          style={style}
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
          {visibleColumns.map((c, idx) => {
            const key = makeKey(row.id, c.id);
            const editable = isEditable(c);
            const mode = editable ? resolveEditMode(c) : 'off';
            const initiallyUnlockedActive = mode === 'unlocked' && !autoClosedKeys.has(key);
            const always = mode === 'locked';
            const isActive = always || editingKey === key || initiallyUnlockedActive;
            const content = isActive ? (
              <EditorCell col={c} mode={mode} cellKey={key} />
            ) : (
              renderViewContent(c)
            );

            const showInlineEdit = !!c.editor && editable && !always && !isActive;
            // Prevent blue focus ring on drag handle by forcing non-focusable tabIndex
            const dragAttrs = { ...(attributes as any), tabIndex: -1 } as typeof attributes & { tabIndex: number };

            return (
              <TableCell
                key={c.id}
                align={c.align}
                style={{ width: c.width, position: 'relative' }}
                sx={showInlineEdit ? { pr: 5, '&:hover .cell-edit-btn': { opacity: 1 } } : undefined}
                onDoubleClick={() => {
                  if (!always && editable) startEdit(row, c);
                }}
              >
                {DefaultCell(
                  row,
                  c,
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
                    sx={{
                      mr: 1,
                      cursor: 'grab',
                      touchAction: 'none',
                      '&:focus,&:focus-visible': { outline: 'none' },
                    }}
                    {...dragAttrs}
                    {...listeners}
                  >
                      <DragIndicatorIcon fontSize={size === 'small' ? 'small' : 'medium'} />
                    </IconButton>
                  ) : undefined,
                  size,
                  content
                )}
            {showInlineEdit && (
              <IconButton
                size="small"
                className="cell-edit-btn"
                aria-label="Bearbeiten"
                onClick={(e) => { e.stopPropagation(); startEdit(row, c); }}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  opacity: 0,
                  transition: 'opacity 120ms',
                }}
              >
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            )}
            </TableCell>
          );
        })}
          {getRowActions && !isCustomerView && (
            <TableCell key="__actions" align="right">{getRowActions(row)}</TableCell>
          )}
          {/* Row-wide droppable overlays so any column works */}
          {!isCustomerView && (
            <>
              {/* inside droppable overlay: full row */}
              <Box
                ref={setInsideRef}
                sx={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: '33.333%',
                  bottom: '33.333%',
                  pointerEvents: activeId ? 'auto' : 'none',
                  display: insideAllowed ? 'block' : 'none',
                }}
              />
              {/* before/after droppables anchored to row edges */}
              <BeforeAfterOverlays
                rowId={draggableId}
                allowedBefore={!!activeId && beforeAllowed}
                allowedAfter={!!activeId && afterAllowed}
              />
            </>
          )}
        </TableRow>
      </>
    );
  }

  return (
    <TableContainer>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <Table size={size}
        >
          <TableHead>
            <TableRow>
              {visibleColumns.map((c) => (
                <TableCell key={c.id} align={c.align} style={{ width: c.width }}>{c.header}</TableCell>
              ))}
              {getRowActions && !isCustomerView && <TableCell key="__actions" align="right">Aktionen</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.map((vr) => (
              <DraggableRow key={String(vr.row.id)} data={vr} />
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
              <Box sx={{
                px: 1.5, py: 1,
                bgcolor: 'background.paper',
                border: '1px solid', borderColor: 'divider',
                borderRadius: 1,
                boxShadow: 6,
                minWidth: 240,
              }}>
                {DefaultCell(
                  activeRow,
                  visibleColumns[0],
                  level,
                  true,
                  hasChildren,
                  isExpanded,
                  undefined,
                  (
                    <IconButton
                      size={size === 'small' ? 'small' : 'medium'}
                      disableRipple
                      disableFocusRipple
                      sx={{ mr: 1, cursor: 'grabbing', '&:focus,&:focus-visible': { outline: 'none' } }}
                    >
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
