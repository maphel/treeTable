import * as React from 'react';
import TreeTable from '../../components/TreeTable/TreeTable';
import { ColumnDef, RowModel, RowId } from '../../components/TreeTable/types';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import FolderIcon from '@mui/icons-material/Folder';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ExtensionIcon from '@mui/icons-material/Extension';
import DescriptionIcon from '@mui/icons-material/Description';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { LineItem, useGetLineItemsQuery, useMoveLineItemsMutation, useUpdateLineItemMutation, useDeleteLineItemsMutation, useDuplicateLineItemsMutation } from './api';
import { TextEditor, CurrencyInput } from '../../components/editors';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import { formatCurrency, parseCurrency } from '../../components/formatters';

type RowData = {
  name: string;
  qty?: number;
  unitPrice?: number;
  draggable?: boolean;
  // Optional permission-related flags (respected if provided)
  permission?: boolean; // overall visibility for actions
  configurationPermission?: boolean; // structural actions like duplicate/delete
  propertyPermissions?: Partial<Record<'name' | 'quantity' | 'unitPrice', boolean>>; // editability per property
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
    draggable: (i as any).draggable,
    children: toRows(i.children, depth + 1),
  }));
}

export function ExampleLineItemsTable() {
  const { data } = useGetLineItemsQuery(undefined);
  const rows = React.useMemo(() => toRows(data), [data]);
  const [moveLineItems] = useMoveLineItemsMutation();
  const [updateLineItem] = useUpdateLineItemMutation();
  const [deleteLineItems, { isLoading: isDeleting }] = useDeleteLineItemsMutation();
  const [duplicateLineItems, { isLoading: isDuplicating }] = useDuplicateLineItemsMutation();

  // View mode: 'pro' (default) vs 'customer'
  const getInitialView = (): 'pro' | 'customer' => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const v = sp.get('view');
      return v === 'customer' ? 'customer' : 'pro';
    } catch {
      return 'pro';
    }
  };
  const [view, setView] = React.useState<'pro' | 'customer'>(getInitialView);
  const isCustomer = view === 'customer';

  // Keep URL query param in sync
  React.useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (view === 'pro') {
        url.searchParams.delete('view');
      } else {
        url.searchParams.set('view', view);
      }
      window.history.replaceState({}, '', url.toString());
    } catch {}
  }, [view]);

  // Controls inline name edit when pressing the Edit action
  const [editingNameRowId, setEditingNameRowId] = React.useState<RowId | null>(null);

  const CurrencyEditor: ColumnDef<RowData>['editor'] = ({ value, onChange, commit, cancel, autoFocus }) => (
    <CurrencyInput
      value={value as any}
      onChange={(s) => onChange(s)}
      onCommit={commit}
      onCancel={cancel}
      autoFocus={autoFocus}
      locale="de-DE"
      currency="EUR"
    />
  );

  const columns: ColumnDef<RowData>[] = [
    {
      id: 'name',
      header: 'Name',
      width: '40%',
      getIsEditable: (row) => row.type === 'custom' && (row.propertyPermissions?.name ?? true),
      // When a row is marked for editing via the Edit action, start editor unlocked
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
          {row.type === 'folder' && <FolderIcon fontSize="small" color="action" />}
          {row.type === 'product' && <Inventory2Icon fontSize="small" color="action" />}
          {row.type === 'subproduct' && <ExtensionIcon fontSize="small" color="action" />}
          {row.type === 'custom' && <DescriptionIcon fontSize="small" color="action" />}
          <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {String(value ?? '')}
          </Box>
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
        <TextEditor
          value={typeof value === 'number' ? String(value) : (value ?? '')}
          onChange={(next) => onChange(parseFloat(String(next)))}
          onCommit={commit}
          onCancel={cancel}
          autoFocus={autoFocus}
        />
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

  function getRowCanDrag(row: ExampleRow) {
    if (row.draggable === false) return false;
    return row.type !== 'subproduct';
  }

  function getRowCanDrop(source: ExampleRow, target: ExampleRow, position: 'inside' | 'before' | 'after') {
    if (String(source.id) === String(target.id)) return false;
    if (position === 'inside' && target.type !== 'folder') return false;
    return true;
  }

  function indexTree(nodes: ExampleRow[]) {
    const parentOf = new Map<RowId, RowId | null>();
    const childrenOf = new Map<RowId | null, RowId[]>();
    function walk(list: ExampleRow[], parent: RowId | null) {
      childrenOf.set(parent, list.map(n => n.id));
      for (const n of list) {
        parentOf.set(n.id, parent);
        walk(n.children || [], n.id);
      }
    }
    walk(nodes, null);
    return { parentOf, childrenOf } as const;
  }

  const handleDrop = async (sourceId: RowId, targetId: RowId, position: 'inside' | 'before' | 'after') => {
    const { parentOf, childrenOf } = indexTree(rows);
    let parentLineItemId: RowId | null = null;
    let previousLineItem: 'FIRST' | 'LAST' | { lineItemId: RowId } = 'LAST';

    if (position === 'inside') {
      parentLineItemId = targetId;
      previousLineItem = 'LAST';
    } else {
      const parent = parentOf.get(targetId) ?? null;
      parentLineItemId = parent;
      const siblings = (childrenOf.get(parent) || []).filter(id => id !== sourceId);
      const idx = siblings.indexOf(targetId);
      if (position === 'before') {
        if (idx <= 0) previousLineItem = 'FIRST';
        else previousLineItem = { lineItemId: siblings[idx - 1] };
      } else {
        // After target -> place before its next sibling by using target as previous
        previousLineItem = { lineItemId: targetId };
      }
    }

    await moveLineItems({
      selectedLineItemIds: [sourceId],
      parentLineItemId,
      previousLineItem,
    });
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ fontWeight: 600, color: 'text.secondary' }}>Ansicht</Box>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={view}
          onChange={(_, next) => { if (next) setView(next); }}
          aria-label="Ansicht wählen"
        >
          <ToggleButton value="pro" aria-label="Pro-Ansicht">Pro</ToggleButton>
          <ToggleButton value="customer" aria-label="Kundenansicht">Kunde</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <TreeTable
        dragActivation={{ mode: 'distance', distance: 3 }}
        rows={rows}
        columns={columns}
        viewMode={view}
        onEditCommit={async (row, column, next) => {
          const lineItemId = row.id;
          const prop = column.id === 'qty' ? 'quantity' : column.id;
          await updateLineItem({ lineItemId, properties: { [prop]: next } });
          // Close forced name editor after commit
          setEditingNameRowId((curr) => (curr === row.id ? null : curr));
        }}
        getRowActions={!isCustomer ? ((row) => {
          const hasPermission = row.permission ?? true;
          const hasConfigPermission = row.configurationPermission ?? true;

          if (!hasPermission || row.type === 'subproduct') return null;

          const canEditName = row.type === 'custom' && (row.propertyPermissions?.name ?? true);
          const showEdit = row.type === 'custom' || row.type === 'product';
          const editDisabled = row.type !== 'custom' || !canEditName;

          const showDuplicate = row.type === 'product' || row.type === 'custom';
          const duplicateDisabled = !hasConfigPermission;

          const showDelete = row.type === 'folder' || row.type === 'product' || row.type === 'custom';
          const deleteDisabled = !hasConfigPermission;

          return (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
              {showEdit && (
                <Tooltip title={editDisabled ? 'Bearbeiten nicht möglich' : 'Bearbeiten'}>
                  <span>
                    <IconButton
                      size="small"
                      disabled={editDisabled}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!editDisabled) setEditingNameRowId(row.id);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
              {showDuplicate && (
                <Tooltip title={duplicateDisabled ? 'Duplizieren nicht erlaubt' : 'Duplizieren'}>
                  <span>
                    <IconButton
                      size="small"
                      disabled={duplicateDisabled || isDuplicating}
                      onClick={async (e) => {
                        e.stopPropagation();
                        await duplicateLineItems({ selectedLineItemIds: [row.id] });
                      }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
              {showDelete && (
                <Tooltip title={deleteDisabled ? 'Löschen nicht erlaubt' : 'Löschen'}>
                  <span>
                    <IconButton
                      size="small"
                      disabled={deleteDisabled || isDeleting}
                      onClick={async (e) => {
                        e.stopPropagation();
                        await deleteLineItems({ selectedLineItemIds: [row.id] });
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
            </Box>
          );
        }) : undefined}
        getRowCanDrag={!isCustomer ? getRowCanDrag : undefined}
        getRowCanDrop={!isCustomer ? getRowCanDrop : undefined}
        onDrop={!isCustomer ? handleDrop : undefined}
      />
    </>
  );
}

export default ExampleLineItemsTable;

