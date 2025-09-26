import type React from "react";
/**
 * TreeTable Type Definitions
 *
 * These types describe the contract between your data model and the
 * GenericTreeTable component. They cover how rows are shaped, how
 * columns render and edit values, and which props control features
 * such as drag-and-drop, visibility, and inline editing.
 */
/**
 * RowModel<T>
 *
 * Your domain data `T`, augmented with fields the table relies on. The
 * table flattens the `children` tree to render indentation and expand/collapse
 * state; it does not read `depth` at runtime.
 *
 * Notes
 * - `id`: must be unique and stable across renders. It's used as the row key
 *   and for DnD operations.
 * - `type`: app-defined discriminator (e.g. "folder", "item"). The table
 *   does not interpret it, but you can use it in `getRowCanDrop`, renderers,
 *   or business logic.
 * - `depth`: convenient metadata for your app. GenericTreeTable computes the
 *   current nesting level from the `children` structure and does not use this
 *   field. Set to `0` for roots if you don't track depth.
 * - `children`: nested rows; omit or pass an empty array for leaf nodes.
 */
export type RowModel<T extends object> = T & {
    id: string;
    type: string;
    depth: number;
    children?: RowModel<T>[];
};
/**
 * ViewMode
 *
 * Global context passed to the table and forwarded to `getIsVisible` on
 * columns. The literal string "edit" is special: when set, any editable
 * column behaves as if `editMode: "locked"` (its editor stays visible).
 * Any other string is treated as app-defined context.
 */
export type ViewMode = "view" | "edit" | string;
/**
 * DropPosition
 *
 * Normalized intent for drag-and-drop placement relative to a target row.
 * - "inside": drop as a child of the target
 * - "before": drop as a previous sibling of the target
 * - "after" : drop as a next sibling of the target
 */
export type DropPosition = "inside" | "before" | "after";
/**
 * ColumnDef<T>
 *
 * Describes how a column looks, reads, and edits a value from your row.
 * The `id` should point to a property on your row object. Dot-notation is
 * supported to access nested values (e.g. "product.name").
 */
export type ColumnDef<T extends object> = {
    /**
     * Property key or path (dot-separated) on the row to read/edit.
     * Example: "name" or "product.unitPrice".
     */
    id: string;
    /** Header content shown in the table head. */
    header: React.ReactNode;
    /** Column width (number = px, or CSS width string). */
    width?: number | string;
    /** Horizontal alignment for cell content. */
    align?: "left" | "right" | "center";
    /**
     * Read renderer. Receives the already-formatted `value` (after
     * `valueFormatter`), plus the `row`, the computed `level` (0-based
     * tree depth), and the `column` definition.
     */
    cell?: (ctx: {
        row: RowModel<T>;
        value: unknown;
        level: number;
        column: ColumnDef<T>;
    }) => React.ReactNode;
    /**
     * Edit renderer. Render an input for the column and wire it to the
     * provided handlers:
     * - `onChange(next)`: update the in-progress value
     * - `commit()`: persist (calls `onEditCommit`) and close editor
     * - `cancel()`: discard changes and close editor
     * - `autoFocus`: true when the editor should take focus
     */
    editor?: (ctx: {
        row: RowModel<T>;
        value: unknown;
        onChange: (next: unknown) => void;
        commit: () => void;
        cancel: () => void;
        autoFocus?: boolean;
        /** Inherit table density for editor inputs. */
        size: "small" | "medium";
    }) => React.ReactNode;
    /**
     * Per-row predicate to decide whether the cell is editable.
     * If omitted, cells are considered editable when an `editor` is provided.
     */
    getIsEditable?: (row: RowModel<T>) => boolean;
    /**
     * Per-column predicate to control visibility. Receives whatever you pass
     * as `viewMode` (e.g. "pro" vs "customer"). If omitted, the column is visible.
     */
    getIsVisible?: (viewContext: unknown) => boolean;
    /**
     * Controls initial editor visibility per cell:
     * - "locked": editor is always shown and stays open after commit
     * - "unlocked": editor opens initially and closes after first commit/cancel
     * - undefined: editor is closed; users can open it by interaction
     * May be a function of the row.
     */
    editMode?: "locked" | "unlocked" | ((row: RowModel<T>) => "locked" | "unlocked" | undefined);
    /**
     * When true, commits the first change immediately and exits edit
     * (only applies when the editor is not "locked"). May be a function of the row.
     */
    autoCommitOnChange?: boolean | ((row: RowModel<T>) => boolean);
    /**
     * Formats the raw row value (from `id`) for display.
     * Example: `(v) => formatCurrency(v as number)`
     */
    valueFormatter?: (value: unknown, row: RowModel<T>) => React.ReactNode;
    /**
     * Parses the editor's output back into your data type before `onEditCommit`.
     * Example: `(input) => parseFloat(String(input))`
     */
    valueParser?: (input: unknown, row: RowModel<T>) => unknown;
};
/**
 * TreeTableProps<T>
 *
 * Props for the GenericTreeTable component.
 */
export type TreeTableProps<T extends object> = {
    /** Root rows for the tree. */
    rows: ReadonlyArray<RowModel<T>>;
    /** Column configuration. Order defines rendering order. */
    columns: ReadonlyArray<ColumnDef<T>>;
    /** Visual density; maps to MUI Table size. Default: "medium". */
    size?: "small" | "medium";
    /** Disables editing and dragging UI; marks the table `aria-readonly`. */
    readOnly?: boolean;
    /**
     * Drag activation behavior:
     * - mode "delay": press-and-hold before drag starts (default)
     * - mode "distance": start drag after moving a few pixels
     */
    dragActivation?: DragActivationOptions;
    /** Controlled set of expanded row IDs. Empty = expand all by default. */
    expandedRowIds?: Set<string> | string[];
    /** Notifies when a row's expanded state toggles. */
    onRowToggle?: (id: string, expanded: boolean) => void;
    /** Whether a row can be dragged. Omit to allow all. */
    getRowCanDrag?: (row: RowModel<T>) => boolean;
    /** Whether a drop is allowed for a source/target/position. */
    getRowCanDrop?: (source: RowModel<T>, target: RowModel<T>, position: DropPosition) => boolean;
    /**
     * Optional live validation hook. Return the set of valid target IDs for
     * the currently dragged source. Can be synchronous or asynchronous.
     */
    getValidDropTargets?: (source: RowModel<T>) => Promise<Set<string> | string[]> | Set<string> | string[];
    /**
     * Persist the move after a successful drop. Called only if permitted by
     * `getRowCanDrop` and (if provided) `getValidDropTargets`.
     */
    onDrop?: (sourceId: string, targetId: string, position: DropPosition) => Promise<void> | void;
    /** Render an actions cell (rightmost) for the given row. */
    getRowActions?: (row: RowModel<T>) => React.ReactNode;
    /**
     * Render arbitrary content below the table body (e.g. totals). Receives
     * the current `rows` and `viewMode`.
     */
    getTableRowChildren?: (row: ReadonlyArray<RowModel<T>>, viewMode?: ViewMode) => React.ReactNode;
    /** Header label for the actions column when `getRowActions` is provided. */
    actionsHeader?: React.ReactNode;
    /** App-defined context for visibility/editing. See `ViewMode`. */
    viewMode?: ViewMode;
    /**
     * Called when a cell edit is committed. Resolve to close the editor.
     * Throw/reject to keep it open and surface an error.
     */
    onEditCommit?: (row: RowModel<T>, column: ColumnDef<T>, nextValue: unknown) => Promise<void> | void;
    /**
     * Called when every editor in a row that started in "unlocked" mode has
     * closed (committed or cancelled). Useful to exit row-level edit state.
     */
    onRowAllEditorsClosed?: (row: RowModel<T>) => void;
};
/**
 * DragActivationOptions
 *
 * Configure how pointer dragging is activated.
 * - mode "delay": require a press duration before the drag starts.
 *   - `delay` (ms): required press duration (default 150ms)
 *   - `tolerance` (px): allowed finger/mouse movement during the press (default 5px)
 * - mode "distance": start the drag after moving this distance (default 3px)
 */
export type DragActivationOptions = {
    mode?: "delay" | "distance";
    /** ms to press before drag starts (delay mode). */
    delay?: number;
    /** px allowed movement while pressing (delay mode). */
    tolerance?: number;
    /** px to move until drag starts (distance mode). */
    distance?: number;
};
/**
 * VisibleRow<T>
 *
 * Internal flattened representation of a row used for rendering. Exposed for
 * advanced consumers (e.g. custom overlays). Most apps won't need this type.
 */
export type VisibleRow<T extends object> = {
    row: RowModel<T>;
    /** 0-based nesting level computed from `children`. */
    level: number;
    /** Whether the row has children. */
    hasChildren: boolean;
    /** Whether the row is currently expanded. */
    expanded: boolean;
};
