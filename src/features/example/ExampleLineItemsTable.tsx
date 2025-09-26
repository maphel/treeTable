import * as React from 'react';
import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { buildColumns } from './buildColumns';
import RowActions from './components/RowActions';
import {
  LineItem,
  useDeleteLineItemsMutation,
  useDuplicateLineItemsMutation,
  useGetLineItemsQuery,
  useMoveLineItemsMutation,
  useUpdateLineItemMutation,
} from './api';
import { GenericTreeTable } from '../../components/GenericTreeTable/GenericTreeTable';
import { RowModel } from '../../components/GenericTreeTable/genericTreeTable.types';

type RowData = {
  name: string;
  qty?: number;
  unitPrice?: number;
  discount?: number;
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
    discount: (i as any).discount,
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

function buildMoveIndex(nodes: ExampleRow[]) {
  const parentOf = new Map<string, string | null>();
  const childrenOf = new Map<string | null, string[]>();
  const walk = (list: ExampleRow[], parent: string | null) => {
    childrenOf.set(parent, list.map((n) => n.id));
    for (const n of list) {
      parentOf.set(n.id, parent);
      walk(n.children || [], n.id);
    }
  };
  walk(nodes, null);
  return { parentOf, childrenOf } as const;
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

  const [editingRowId, setEditingRowId] = React.useState<string | null>(null);
  const columns = React.useMemo(
    () => buildColumns(editingRowId, setEditingRowId, { includeTotals: true, language: 'de-DE', currency: 'EUR' }),
    [editingRowId]
  );

  const getRowCanDrag = React.useCallback((row: ExampleRow) => {
    if (row.draggable === false) return false;
    return row.type !== 'subproduct';
  }, []);

  const getRowCanDrop = React.useCallback((source: ExampleRow, target: ExampleRow, position: 'inside' | 'before' | 'after') => {
    if (String(source.id) === String(target.id)) return false;
    if (position === 'inside' && target.type !== 'folder') return false;
    return true;
  }, []);

  const handleDrop = React.useCallback(async (sourceId: string, targetId: string, position: 'inside' | 'before' | 'after') => {
    const { parentOf, childrenOf } = buildMoveIndex(rows);
    let parentLineItemId: string | null = null;
    let previousLineItem: 'FIRST' | 'LAST' | { lineItemId: string } = 'LAST';

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

  const COLUMN_PROP_MAP: Record<string, string> = React.useMemo(
    () => ({ qty: 'quantity', name: 'name', unitPrice: 'unitPrice', discount: 'discount' }),
    []
  );

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ fontWeight: 600, color: 'text.secondary' }}>Ansicht</Box>
        <ToggleButtonGroup exclusive size="small" value={view} onChange={(_, next) => { if (next) setView(next); }} aria-label="Ansicht wählen">
          <ToggleButton value="pro" aria-label="Pro-Ansicht">Pro</ToggleButton>
          <ToggleButton value="customer" aria-label="Kundenansicht">Kunde</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <GenericTreeTable
        dragActivation={{ mode: 'distance', distance: 3 }}
        rows={rows}
        columns={columns}
        viewMode={view}
        actionsHeader="Aktionen"
        onEditCommit={async (row, column, next) => {
          const lineItemId = row.id;
          const prop = COLUMN_PROP_MAP[column.id] ?? column.id;
          await updateLineItem({ lineItemId, properties: { [prop]: next } });
        }}
        onRowAllEditorsClosed={(row) => {
          setEditingRowId((curr) => (curr === row.id ? null : curr));
        }}
        getRowActions={!isCustomer ? ((row) => (
          <RowActions
            row={row as any}
            isEditing={editingRowId === row.id}
            isDuplicating={isDuplicating}
            isDeleting={isDeleting}
            confirmDelete
            onEdit={() => setEditingRowId((curr) => (curr === row.id ? null : row.id))}
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
