import * as React from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import FolderIcon from '@mui/icons-material/Folder';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ExtensionIcon from '@mui/icons-material/Extension';
import DescriptionIcon from '@mui/icons-material/Description';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import TreeTable from '../../components/TreeTable/TreeTable';
import { ColumnDef, RowModel, RowId } from '../../components/TreeTable/types';
import { CurrencyInput, NumberEditor, TextEditor } from '../../components/editors';
import { formatCurrency, parseCurrency } from '../../components/formatters';
import {
  LineItem,
  useDeleteLineItemsMutation,
  useDuplicateLineItemsMutation,
  useGetLineItemsQuery,
  useMoveLineItemsMutation,
  useUpdateLineItemMutation,
} from './api';

type RowData = {
  name: string;
  qty?: number;
  unitPrice?: number;
  draggable?: boolean;
  permission?: boolean;
  configurationPermission?: boolean;
  propertyPermissions?: Partial<Record<'name' | 'quantity' | 'unitPrice', boolean>>;
};

type ExampleRow = RowModel<RowData>;

function toRows(items: LineItem[] | undefined, depth = 0): ExampleRow[] {
  if (!items) return [];
  return items.map((i) => ({
    id: i.lineItemId,
    type: i.type,
    depth,
    name: i.name,
    qty: i.quantity,
    unitPrice: i.unitPrice,
    draggable: i.draggable,
    children: toRows(i.children, depth + 1),
  }));
}

type ExampleView = 'pro' | 'customer';

function useViewMode(): [ExampleView, (next: ExampleView) => void] {
  const readInitial = React.useCallback((): ExampleView => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const v = sp.get('view');
      return v === 'customer' ? 'customer' : 'pro';
    } catch {
      return 'pro';
    }
  }, []);

  const [view, setView] = React.useState<ExampleView>(readInitial);

  React.useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (view === 'pro') url.searchParams.delete('view');
      else url.searchParams.set('view', view);
      window.history.replaceState({}, '', url.toString());
    } catch {}
  }, [view]);

  return [view, setView];
}

function TypeIcon({ type }: { type: string }) {
  if (type === 'folder') return <FolderIcon fontSize="small" color="action" />;
  if (type === 'product') return <Inventory2Icon fontSize="small" color="action" />;
  if (type === 'subproduct') return <ExtensionIcon fontSize="small" color="action" />;
  return <DescriptionIcon fontSize="small" color="action" />;
}

function buildMoveIndex(nodes: ExampleRow[]) {
  const parentOf = new Map<RowId, RowId | null>();
  const childrenOf = new Map<RowId | null, RowId[]>();
  const walk = (list: ExampleRow[], parent: RowId | null) => {
    childrenOf.set(parent, list.map((n) => n.id));
    for (const n of list) {
      parentOf.set(n.id, parent);
      walk(n.children || [], n.id);
    }
  };
  walk(nodes, null);
  return { parentOf, childrenOf } as const;
}

function buildColumns(
  editingNameRowId: RowId | null,
  setEditingNameRowId: React.Dispatch<React.SetStateAction<RowId | null>>
): ColumnDef<RowData>[] {
  const CurrencyEditor: ColumnDef<RowData>['editor'] = ({ value, onChange, commit, cancel, autoFocus }) => (
    <CurrencyInput value={value as any} onChange={(s) => onChange(s)} onCommit={commit} onCancel={cancel} autoFocus={autoFocus} locale="de-DE" currency="EUR" />
  );

  return [
    {
      id: 'name',
      header: 'Name',
      width: '40%',
      getIsEditable: (row) => row.type === 'custom' && (row.propertyPermissions?.name ?? true),
      editMode: (row) => (row.id === editingNameRowId ? 'unlocked' : undefined),
      autoCommitOnChange: (row) => row.id === editingNameRowId,
      editor: (p) => (
        <TextEditor
          {...p}
          onCommit={() => {
            p.commit();
            setEditingNameRowId((curr) => (curr === p.row.id ? null : curr));
          }}
          onCancel={() => {
            p.cancel();
            setEditingNameRowId((curr) => (curr === p.row.id ? null : curr));
          }}
        />
      ),
      cell: ({ row, value }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TypeIcon type={row.type} />
          <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(value ?? '')}</Box>
        </Box>
      ),
    },
    {
      id: 'qty',
      header: 'Menge',
      align: 'right',
      width: 120,
      getIsEditable: (row) => row.type !== 'folder' && (row.propertyPermissions?.quantity ?? true),
      editor: ({ value, onChange, commit, cancel, autoFocus }) => (
        <NumberEditor value={typeof value === 'number' ? value : undefined} onChange={onChange} onCommit={commit} onCancel={cancel} autoFocus={autoFocus} step={1} min={0} />
      ),
      valueFormatter: (v) => (typeof v === 'number' ? String(v) : ''),
    },
    {
      id: 'unitPrice',
      header: 'Preis',
      align: 'right',
      width: 140,
      getIsEditable: (row) => row.type !== 'folder' && (row.propertyPermissions?.unitPrice ?? true),
      getIsVisible: (vm) => vm !== 'customer',
      editor: CurrencyEditor,
      valueParser: parseCurrency,
      valueFormatter: (v) => formatCurrency(typeof v === 'number' ? v : undefined),
    },
  ];
}

function RowActions({
  row,
  isDuplicating,
  isDeleting,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  row: ExampleRow;
  isDuplicating: boolean;
  isDeleting: boolean;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const allowed = row.permission ?? true;
  const configAllowed = row.configurationPermission ?? true;
  if (!allowed || row.type === 'subproduct') return null;

  const canEditName = row.type === 'custom' && (row.propertyPermissions?.name ?? true);
  const showEdit = row.type === 'custom' || row.type === 'product';
  const editDisabled = row.type !== 'custom' || !canEditName;

  const showDuplicate = row.type === 'product' || row.type === 'custom';
  const duplicateDisabled = !configAllowed;

  const showDelete = row.type === 'folder' || row.type === 'product' || row.type === 'custom';
  const deleteDisabled = !configAllowed;

  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
      {showEdit && (
        <Tooltip title={editDisabled ? 'Bearbeiten nicht möglich' : 'Bearbeiten'}>
          <span>
            <IconButton size="small" disabled={editDisabled} onClick={(e) => { e.stopPropagation(); if (!editDisabled) onEdit(); }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      )}
      {showDuplicate && (
        <Tooltip title={duplicateDisabled ? 'Duplizieren nicht erlaubt' : 'Duplizieren'}>
          <span>
            <IconButton size="small" disabled={duplicateDisabled || isDuplicating} onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      )}
      {showDelete && (
        <Tooltip title={deleteDisabled ? 'Löschen nicht erlaubt' : 'Löschen'}>
          <span>
            <IconButton size="small" disabled={deleteDisabled || isDeleting} onClick={(e) => { e.stopPropagation(); onDelete(); }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      )}
    </Box>
  );
}

export function ExampleLineItemsTable() {
  const { data } = useGetLineItemsQuery(undefined);
  const rows = React.useMemo(() => toRows(data), [data]);

  const [moveLineItems] = useMoveLineItemsMutation();
  const [updateLineItem] = useUpdateLineItemMutation();
  const [deleteLineItems, { isLoading: isDeleting }] = useDeleteLineItemsMutation();
  const [duplicateLineItems, { isLoading: isDuplicating }] = useDuplicateLineItemsMutation();

  const [view, setView] = useViewMode();
  const isCustomer = view === 'customer';

  const [editingNameRowId, setEditingNameRowId] = React.useState<RowId | null>(null);
  const columns = React.useMemo(() => buildColumns(editingNameRowId, setEditingNameRowId), [editingNameRowId]);

  const getRowCanDrag = React.useCallback((row: ExampleRow) => {
    if (row.draggable === false) return false;
    return row.type !== 'subproduct';
  }, []);

  const getRowCanDrop = React.useCallback((source: ExampleRow, target: ExampleRow, position: 'inside' | 'before' | 'after') => {
    if (String(source.id) === String(target.id)) return false;
    if (position === 'inside' && target.type !== 'folder') return false;
    return true;
  }, []);

  const handleDrop = React.useCallback(async (sourceId: RowId, targetId: RowId, position: 'inside' | 'before' | 'after') => {
    const { parentOf, childrenOf } = buildMoveIndex(rows);
    let parentLineItemId: RowId | null = null;
    let previousLineItem: 'FIRST' | 'LAST' | { lineItemId: RowId } = 'LAST';

    if (position === 'inside') {
      parentLineItemId = targetId;
      previousLineItem = 'LAST';
    } else {
      const parent = parentOf.get(targetId) ?? null;
      parentLineItemId = parent;
      const siblings = (childrenOf.get(parent) || []).filter((id) => id !== sourceId);
      const idx = siblings.indexOf(targetId);
      if (position === 'before') {
        previousLineItem = idx <= 0 ? 'FIRST' : { lineItemId: siblings[idx - 1] };
      } else {
        previousLineItem = { lineItemId: targetId };
      }
    }

    await moveLineItems({ selectedLineItemIds: [sourceId], parentLineItemId, previousLineItem });
  }, [rows, moveLineItems]);

  const COLUMN_PROP_MAP: Record<string, string> = React.useMemo(() => ({ qty: 'quantity', name: 'name', unitPrice: 'unitPrice' }), []);

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ fontWeight: 600, color: 'text.secondary' }}>Ansicht</Box>
        <ToggleButtonGroup exclusive size="small" value={view} onChange={(_, next) => { if (next) setView(next); }} aria-label="Ansicht wählen">
          <ToggleButton value="pro" aria-label="Pro-Ansicht">Pro</ToggleButton>
          <ToggleButton value="customer" aria-label="Kundenansicht">Kunde</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <TreeTable
        dragActivation={{ mode: 'distance', distance: 3 }}
        rows={rows}
        columns={columns}
        viewMode={view}
        actionsHeader="Aktionen"
        onEditCommit={async (row, column, next) => {
          const lineItemId = row.id;
          const prop = COLUMN_PROP_MAP[column.id] ?? column.id;
          await updateLineItem({ lineItemId, properties: { [prop]: next } });
          setEditingNameRowId((curr) => (curr === row.id ? null : curr));
        }}
        getRowActions={!isCustomer ? ((row) => (
          <RowActions
            row={row as any}
            isDuplicating={isDuplicating}
            isDeleting={isDeleting}
            onEdit={() => setEditingNameRowId(row.id)}
            onDuplicate={async () => { await duplicateLineItems({ selectedLineItemIds: [row.id] }); }}
            onDelete={async () => { await deleteLineItems({ selectedLineItemIds: [row.id] }); }}
          />
        )) : undefined}
        getRowCanDrag={!isCustomer ? getRowCanDrag : undefined}
        getRowCanDrop={!isCustomer ? getRowCanDrop : undefined}
        onDrop={!isCustomer ? handleDrop : undefined}
      />
    </>
  );
}

export default ExampleLineItemsTable;
