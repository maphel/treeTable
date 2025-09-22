import * as React from 'react';

/**
 * TreeTable type contracts (quick guide)
 *
 * Overview
 * - Provide your domain rows as a tree of RowModel<T> with an id, type, depth and optional children.
 * - Define ColumnDef<T>[] describing how to render and edit each column.
 * - Drop TreeTable into your UI with rows + columns; optionally wire DnD and editing callbacks.
 *
 * Minimal usage
 *   type Data = { name: string; qty?: number };
 *   type Row = RowModel<Data>;
 *   const rows: Row[] = [ { id: 1, type: 'item', depth: 0, name: 'Root', children: [] } ];
 *   const columns: ColumnDef<Data>[] = [
 *     { id: 'name', header: 'Name' },
 *     { id: 'qty', header: 'Qty', align: 'right' },
 *   ];
 *   <TreeTable rows={rows} columns={columns} />
 *
 * Editing (column-level)
 * - Provide `editor(ctx)` and optional `getIsEditable(row)`.
 * - Optionally `valueParser` to convert editor output to your data type.
 * - Handle persistence in `onEditCommit(row, column, next)`.
 *
 * Drag and drop
 * - Enable by supplying `getRowCanDrag`, `getRowCanDrop`, and `onDrop`.
 * - For async/conditional target filtering, provide `getValidDropTargets(source)` returning ids.
 *
 * View modes
 * - `viewMode` can be 'view' | 'edit' | 'customer' | 'pro'.
 *   - 'edit' forces editable cells to render their editor (locked).
 *   - 'customer' typically hides actions or sensitive columns via `getIsVisible(viewMode)`.
 */

export type RowId = string | number;

/**
 * Generic row model used by TreeTable.
 * - Includes required fields for identity, type, and depth
 * - Carries optional children of the same RowModel shape
 */
export type RowModel<T extends object = {}> = T & {
  id: RowId;
  type: string;
  depth: number;
  children?: RowModel<T>[];
};

// ViewMode now supports two independent concerns:
// - legacy 'view' | 'edit' to control global edit lock behavior
// - new 'customer' | 'pro' to control audience-facing capabilities (DnD, actions, sensitive fields)
/**
 * Controls default editing behavior and audience-specific visibility.
 * - 'view' | 'edit': global edit lock. When 'edit', editable cells default to locked editors.
 * - 'customer' | 'pro': audience hint for `getIsVisible(viewMode)` and to disable actions/drag in customer view.
 */
export type ViewMode = 'view' | 'edit' | 'customer' | 'pro';

// Normalized drop intent across the API
/**
 * Drop intent:
 * - 'inside': drop as a child of the target
 * - 'before': drop as a sibling before the target
 * - 'after' : drop as a sibling after the target
 */
export type DropPosition = 'inside' | 'before' | 'after';

/**
 * Column definition for TreeTable.
 * The `id` must match a property in your row data (T) that you want to display/edit.
 */
export type ColumnDef<T extends object = {}> = {
  id: string;
  header: React.ReactNode;
  width?: number | string;
  align?: 'left' | 'right' | 'center';
  /** Read renderer for the cell. Receives resolved `value` (after valueFormatter). */
  cell?: (ctx: { row: RowModel<T>; value: unknown; level: number; column: ColumnDef<T> }) => React.ReactNode;
  /**
   * Edit renderer. Implement keyboard + blur handling or delegate to provided editors.
   * - ctx.commit(): persist and close (TreeTable will call onEditCommit)
   * - ctx.cancel(): discard and close
   */
  editor?: (ctx: {
    row: RowModel<T>;
    value: unknown;
    onChange: (next: unknown) => void;
    commit: () => void;
    cancel: () => void;
    autoFocus?: boolean;
  }) => React.ReactNode;
  /** New: predicate for column editability; overrides legacy 'editable' when provided. */
  getIsEditable?: (row: RowModel<T>) => boolean;
  /** New: predicate controlling column visibility per view mode. */
  getIsVisible?: (viewMode: ViewMode | undefined) => boolean;
  /**
   * Controls initial edit behavior per cell.
   * - 'locked': editor is always shown and does not close on commit (unless you programmatically change the row).
   * - 'unlocked': editor starts open but closes after first commit/cancel.
   * - undefined: defaults to closed; user can open via pencil/double-click if editable.
   */
  editMode?: 'locked' | 'unlocked' | ((row: RowModel<T>) => 'locked' | 'unlocked' | undefined);
  /** If true, commits immediately on first change and exits edit (only when not locked). */
  autoCommitOnChange?: boolean | ((row: RowModel<T>) => boolean);
  /**
   * Format raw row value for display.
   * Example: (v) => formatCurrency(v as number)
   */
  valueFormatter?: (value: unknown, row: RowModel<T>) => React.ReactNode;
  /**
   * Convert editor output back to your data type before onEditCommit.
   * Example: (input) => parseFloat(String(input))
   */
  valueParser?: (input: unknown, row: RowModel<T>) => unknown;
};

export type TreeTableProps<T extends object = {}> = {
  rows: ReadonlyArray<RowModel<T>>;
  columns: ReadonlyArray<ColumnDef<T>>;
  /** Visual density; maps to MUI Table size. Defaults to 'medium'. */
  size?: 'small' | 'medium';
  /**
   * Configure how dragging is activated.
   * - mode 'delay': press-and-hold with optional tolerance (default).
   * - mode 'distance': start dragging after moving a few pixels.
   */
  dragActivation?: {
    mode?: 'delay' | 'distance';
    delay?: number; // ms for hold
    tolerance?: number; // px movement allowed during hold
    distance?: number; // px to move to start
  };
  expandedRowIds?: Set<RowId> | RowId[];
  onRowToggle?: (id: RowId, expanded: boolean) => void;
  getRowCanDrag?: (row: RowModel<T>) => boolean;
  getRowCanDrop?: (source: RowModel<T>, target: RowModel<T>, position: DropPosition) => boolean;
  /** Optional live validation of allowed targets for a given source row */
  getValidDropTargets?: (source: RowModel<T>) => Promise<Set<RowId> | RowId[]> | Set<RowId> | RowId[];
  /** Persist the move. Called after validation on drop. Can be async. */
  onDrop?: (sourceId: RowId, targetId: RowId, position: DropPosition) => Promise<void> | void;
  getRowActions?: (row: RowModel<T>) => React.ReactNode;
  /** Header label for the actions column when getRowActions is provided. Default: 'Actions'. */
  actionsHeader?: React.ReactNode;
  viewMode?: ViewMode;
  /**
   * Called when a cell edit is committed.
   * - Resolve to close the editor; throw/reject to keep it open and surface error.
   */
  onEditCommit?: (row: RowModel<T>, column: ColumnDef<T>, nextValue: unknown) => Promise<void> | void;
};
