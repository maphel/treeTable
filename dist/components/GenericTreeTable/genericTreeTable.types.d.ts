import type React from "react";
/**
 * Generic row model used by TreeTable.
 * - Includes required fields for identity, type, and depth
 * - Carries optional children of the same RowModel shape
 */
export type RowModel<T extends object> = T & {
    id: string;
    type: string;
    depth: number;
    children?: RowModel<T>[];
};
/**
 * ViewMode controls global edit lock and provides a free-form context for visibility.
 * - 'view' | 'edit': global edit lock. When 'edit', editable cells default to locked editors.
 * - any other string: treated as an app-defined context passed to `getIsVisible(viewMode)`.
 */
export type ViewMode = "view" | "edit" | string;
/**
 * Drop intent:
 * - 'inside': drop as a child of the target
 * - 'before': drop as a sibling before the target
 * - 'after' : drop as a sibling after the target
 */
export type DropPosition = "inside" | "before" | "after";
/**
 * Column definition for TreeTable.
 * The `id` must match a property in your row data (T) that you want to display/edit.
 */
export type ColumnDef<T extends object> = {
    id: string;
    header: React.ReactNode;
    width?: number | string;
    align?: "left" | "right" | "center";
    /** Read renderer for the cell. Receives resolved `value` (after valueFormatter). */
    cell?: (ctx: {
        row: RowModel<T>;
        value: unknown;
        level: number;
        column: ColumnDef<T>;
    }) => React.ReactNode;
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
    /** Predicate for column editability; overrides legacy 'editable' when provided. */
    getIsEditable?: (row: RowModel<T>) => boolean;
    /** Predicate controlling column visibility; receives your `viewMode` context. */
    getIsVisible?: (viewContext: unknown) => boolean;
    /**
     * Controls initial edit behavior per cell.
     * - 'locked': editor is always shown and does not close on commit (unless you programmatically change the row).
     * - 'unlocked': editor starts open but closes after first commit/cancel.
     * - undefined: defaults to closed; user can open via pencil/double-click if editable.
     */
    editMode?: "locked" | "unlocked" | ((row: RowModel<T>) => "locked" | "unlocked" | undefined);
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
export type TreeTableProps<T extends object> = {
    rows: ReadonlyArray<RowModel<T>>;
    columns: ReadonlyArray<ColumnDef<T>>;
    /** Visual density; maps to MUI Table size. Defaults to 'medium'. */
    size?: "small" | "medium";
    /** When true, disables editing and dragging UI; table is marked aria-readonly. */
    readOnly?: boolean;
    /**
     * Configure how dragging is activated.
     * - mode 'delay': press-and-hold with optional tolerance (default).
     * - mode 'distance': start dragging after moving a few pixels.
     */
    dragActivation?: DragActivationOptions;
    expandedRowIds?: Set<string> | string[];
    onRowToggle?: (id: string, expanded: boolean) => void;
    getRowCanDrag?: (row: RowModel<T>) => boolean;
    getRowCanDrop?: (source: RowModel<T>, target: RowModel<T>, position: DropPosition) => boolean;
    /** Optional live validation of allowed targets for a given source row */
    getValidDropTargets?: (source: RowModel<T>) => Promise<Set<string> | string[]> | Set<string> | string[];
    /** Persist the move. Called after validation on drop. Can be async. */
    onDrop?: (sourceId: string, targetId: string, position: DropPosition) => Promise<void> | void;
    /** Renders a additional cell at the end to provide some kind of actions */
    getRowActions?: (row: RowModel<T>) => React.ReactNode;
    /** Can be used to render additional children at the bottom of the table */
    getTableRowChildren?: (row: ReadonlyArray<RowModel<T>>, viewMode?: ViewMode) => React.ReactNode;
    /** Header label for the actions column when getRowActions is provided. Default: 'Actions'. */
    actionsHeader?: React.ReactNode;
    viewMode?: ViewMode;
    /**
     * Called when a cell edit is committed.
     * - Resolve to close the editor; throw/reject to keep it open and surface error.
     */
    onEditCommit?: (row: RowModel<T>, column: ColumnDef<T>, nextValue: unknown) => Promise<void> | void;
    /**
     * Optional: called when a row that is in 'unlocked' edit mode has all its
     * editable cells closed (committed or cancelled). Useful to auto-exit
     * row-level edit mode in your app state.
     */
    onRowAllEditorsClosed?: (row: RowModel<T>) => void;
};
/** Options to configure pointer drag activation behavior. */
export type DragActivationOptions = {
    mode?: "delay" | "distance";
    delay?: number;
    tolerance?: number;
    distance?: number;
};
export type VisibleRow<T extends object> = {
    row: RowModel<T>;
    level: number;
    hasChildren: boolean;
    expanded: boolean;
};
