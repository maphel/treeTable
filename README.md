TreeTable — Generic, editable tree grid with drag-and-drop

TreeTable is a generic React component that renders hierarchical data as an MUI table with:

- Expand/collapse, keyboard navigation, and accessible treegrid semantics
- Optional inline editing per column with editor components
- Drag-and-drop reordering with precise drop zones (inside, before, after)
- Audience-aware views (pro vs customer) and global edit mode
- Per-column visibility, formatting and parsing
- Optional row actions column

It is designed to be small, predictable, and easy to adapt to your domain model.

Contents

- Quick Start
- Core Concepts
- API Reference
- Drag & Drop
- Editing
- Visibility & View Modes
- Examples

Quick Start

1) Shape your data as a tree of `RowModel<T>`:

```ts
type Data = { name: string; qty?: number; unitPrice?: number };
type Row = RowModel<Data>;

function toRows(items: DomainItem[] | undefined, depth = 0): Row[] {
  if (!items) return [];
  return items.map((i) => ({
    id: i.id,
    type: i.type,
    depth, // required field in RowModel; increment for children
    name: i.name,
    qty: i.quantity,
    unitPrice: i.unitPrice,
    children: toRows(i.children, depth + 1),
  }));
}
```

2) Define your columns:

```tsx
import { TextEditor, CurrencyInput } from '../../components/editors';
import { formatCurrency, parseCurrency } from '../../components/formatters';

const columns: ColumnDef<Data>[] = [
  {
    id: 'name',
    header: 'Name',
    width: '40%',
    getIsEditable: () => true,
    editor: (p) => <TextEditor {...p} />,
  },
  { id: 'qty', header: 'Qty', align: 'right', width: 80 },
  {
    id: 'unitPrice',
    header: 'Price',
    align: 'right',
    width: 120,
    getIsVisible: (view) => view !== 'customer',
    editor: (p) => <CurrencyInput {...p} locale="de-DE" currency="EUR" />,
    valueParser: parseCurrency,
    valueFormatter: (v) => formatCurrency(typeof v === 'number' ? v : undefined),
  },
];
```

3) Render the table:

```tsx
import TreeTable from './TreeTable';

<TreeTable rows={rows} columns={columns} viewMode="pro" />
```

Core Concepts

- Row model: `RowModel<T>` adds `id`, `type`, `depth`, and optional `children` to your data. The component computes visual indentation from the tree; you still set `depth` while mapping.
- Column definitions: `ColumnDef<T>` describes how values are shown (`cell`, `valueFormatter`) and edited (`editor`, `valueParser`). Use `getIsEditable(row)` per row and `getIsVisible(viewMode)` per audience.
- Controlled expansion: pass `expandedRowIds` and `onRowToggle` to control expand/collapse, or omit to have uncontrolled expansion.
- View modes: `viewMode` accepts `'pro' | 'customer' | 'edit' | 'view'`.
  - `'customer'` disables DnD and hides the actions column.
  - `'edit'` forces editable cells to render their editor (locked).

API Reference

RowModel<T>

```ts
type RowId = string | number;
type RowModel<T extends object = {}> = T & {
  id: RowId;
  type: string;
  depth: number;
  children?: RowModel<T>[];
};
```

ColumnDef<T>

```ts
type ColumnDef<T extends object = {}> = {
  id: string;
  header: React.ReactNode;
  width?: number | string;
  align?: 'left' | 'right' | 'center';
  cell?: (ctx: { row: RowModel<T>; value: unknown; level: number; column: ColumnDef<T> }) => React.ReactNode;
  editor?: (ctx: {
    row: RowModel<T>;
    value: unknown;
    onChange: (next: unknown) => void;
    commit: () => void;
    cancel: () => void;
    autoFocus?: boolean;
  }) => React.ReactNode;
  getIsEditable?: (row: RowModel<T>) => boolean;
  getIsVisible?: (viewMode: ViewMode | undefined) => boolean;
  editMode?: 'locked' | 'unlocked' | ((row: RowModel<T>) => 'locked' | 'unlocked' | undefined);
  autoCommitOnChange?: boolean | ((row: RowModel<T>) => boolean);
  valueFormatter?: (value: unknown, row: RowModel<T>) => React.ReactNode;
  valueParser?: (input: unknown, row: RowModel<T>) => unknown;
};
```

TreeTable props

```ts
type TreeTableProps<T extends object = {}> = {
  rows: ReadonlyArray<RowModel<T>>;
  columns: ReadonlyArray<ColumnDef<T>>;
  size?: 'small' | 'medium';
  dragActivation?: { mode?: 'delay' | 'distance'; delay?: number; tolerance?: number; distance?: number };
  expandedRowIds?: Set<RowId> | RowId[];
  onRowToggle?: (id: RowId, expanded: boolean) => void;
  getRowCanDrag?: (row: RowModel<T>) => boolean;
  getRowCanDrop?: (source: RowModel<T>, target: RowModel<T>, position: 'inside' | 'before' | 'after') => boolean;
  getValidDropTargets?: (source: RowModel<T>) => Promise<Set<RowId> | RowId[]> | Set<RowId> | RowId[];
  onDrop?: (sourceId: RowId, targetId: RowId, position: 'inside' | 'before' | 'after') => Promise<void> | void;
  getRowActions?: (row: RowModel<T>) => React.ReactNode;
  actionsHeader?: React.ReactNode; // header label for actions column
  viewMode?: ViewMode; // 'view' | 'edit' | 'customer' | 'pro'
  onEditCommit?: (row: RowModel<T>, column: ColumnDef<T>, nextValue: unknown) => Promise<void> | void;
};
```

Drag & Drop

- Activate DnD by providing any of: `getRowCanDrag`, `getRowCanDrop`, `onDrop`, `getValidDropTargets`.
- Three drop intents are supported: `'inside'` (as child), `'before'`, `'after'` (as siblings).
- Use `getRowCanDrag(row)` to allow/disallow dragging per row (e.g., based on permissions or type).
- Use `getRowCanDrop(source, target, position)` for synchronous validation.
- Optionally return a list/set of valid target row ids from `getValidDropTargets(source)`; this may be async. During drag, only allowed targets highlight and accept drops.
- Handle persistence in `onDrop(sourceId, targetId, position)`.
- UI details:
  - Blue highlight in middle third = drop inside
  - Top/bottom stripe = drop before/after
  - Drag handle appears on the first column when allowed; drag activation can be delay- or distance-based via `dragActivation`.

Editing

- A cell is editable when the column has an `editor` and `getIsEditable(row)` returns true (or is omitted).
- Start edit by double-clicking a cell or clicking the pencil icon. Press Enter to commit, Escape to cancel. Blur commits too.
- `editMode` controls automatic editor state:
  - `'locked'`: editor is always visible for that column.
  - `'unlocked'`: opens once and closes after the first commit/cancel (per row/column).
  - `viewMode='edit'`: globally locks editors for all editable columns.
- `autoCommitOnChange`: when true, the first change commits immediately (useful with `'unlocked'`).
- `onEditCommit(row, column, next)` is awaited; throw or reject to keep the editor open (e.g., to display validation errors).
- Format and parse with `valueFormatter` (view) and `valueParser` (edit) to keep UI and model in sync.

Visibility & View Modes

- `getIsVisible(viewMode)` decides per-column visibility for audiences such as `'customer'` vs `'pro'`.
- In `'customer'` view, drag handles and the actions column are hidden; the table is marked read-only.
- Use `'view' | 'edit'` to control global edit lock behavior independent of audience.

Editors and Formatters

- Editors: `TextEditor`, `NumberEditor`, `CurrencyInput` in `src/components/editors` and `src/components/inputs`.
- Formatters: `formatCurrency`, `parseCurrency`, `formatNumber`, `formatText` in `src/components/formatters`.

Examples

Minimal editable tree

```tsx
type Data = { name: string; qty?: number };
const rows: RowModel<Data>[] = [
  { id: 1, type: 'folder', depth: 0, name: 'Root', children: [
    { id: 2, type: 'custom', depth: 1, name: 'Child', qty: 3 },
  ]},
];

const columns: ColumnDef<Data>[] = [
  { id: 'name', header: 'Name', width: '40%', getIsEditable: () => true, editor: (p) => <TextEditor {...p} /> },
  { id: 'qty', header: 'Qty', align: 'right', width: 80, editor: (p) => <NumberEditor {...p} /> },
];

<TreeTable rows={rows} columns={columns} viewMode="edit" />
```

DnD with constraints

```tsx
const getRowCanDrag = (row: RowModel<any>) => row.type !== 'subproduct';
const getRowCanDrop = (src: RowModel<any>, dst: RowModel<any>, pos: 'inside' | 'before' | 'after') => {
  if (src.id === dst.id) return false;
  if (pos === 'inside' && dst.type !== 'folder') return false; // only folders can contain children
  return true;
};

<TreeTable
  rows={rows}
  columns={columns}
  getRowCanDrag={getRowCanDrag}
  getRowCanDrop={getRowCanDrop}
  onDrop={(sourceId, targetId, position) => persistMove(sourceId, targetId, position)}
/>;
```

Row actions column

```tsx
<TreeTable
  rows={rows}
  columns={columns}
  actionsHeader="Actions"
  getRowActions={(row) => (
    <>
      <IconButton onClick={() => startEditName(row.id)} size="small">✏️</IconButton>
      <IconButton onClick={() => duplicate(row.id)} size="small">📄</IconButton>
      <IconButton onClick={() => remove(row.id)} size="small">🗑️</IconButton>
    </>
  )}
/>;
```

Keyboard and A11Y

- Use Left/Right arrows on a focused row to collapse/expand when children exist.
- First column shows indentation with an accessible expand/collapse button.
- The table uses `role="treegrid"` and marks customer view as read-only.

Where to look in this repo

- Component: `src/components/TreeTable/TreeTable.tsx`
- Types: `src/components/TreeTable/types.ts`
- Internals (indent, DnD overlays, hooks): `src/components/TreeTable/internal/*`
- Editors: `src/components/editors/*` and `src/components/inputs/CurrencyInput.tsx`
- Formatters: `src/components/formatters/*`
- Full example: `src/features/example/ExampleLineItemsTable.tsx`

Import paths

- Inside this repo, you can import directly from sources:
  - `import TreeTable from 'src/components/TreeTable/TreeTable';`
  - `import { TextEditor, NumberEditor, CurrencyInput } from 'src/components/editors';`
- If you build the package, the entry `src/index.ts` re-exports everything:
  - `import { TreeTable, TextEditor, formatCurrency } from 'tree-table';`

Tips

- Keep row shape T small; derive computed values in render functions.
- Use `valueParser`/`valueFormatter` to keep component stateless regarding formatting.
- For async `onDrop` or `onEditCommit`, you can show your own loading state in the surrounding UI.

Example (adapter)

- See `src/features/example/ExampleLineItemsTable.tsx` for a realistic mapping from `LineItem` → `RowModel<RowData>`, column definitions with view-dependent visibility, and drag/drop persistence.
