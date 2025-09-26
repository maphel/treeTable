import * as React from 'react';
import Box from '@mui/material/Box';
import FolderIcon from '@mui/icons-material/Folder';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ExtensionIcon from '@mui/icons-material/Extension';
import DescriptionIcon from '@mui/icons-material/Description';

import type { ColumnDef } from '../../components/GenericTreeTable/genericTreeTable.types';
import TextEditor from '../../components/editors/TextEditor';
import NumberEditor from '../../components/editors/NumberEditor';
import { formatCurrency, parseCurrency } from '../../components/formatters/currency';
import CurrencyEditor from '../../components/editors/CurrencyEditor';

export type RowData = {
  name: string;
  qty?: number;
  unitPrice?: number;
  draggable?: boolean;
  permission?: boolean;
  configurationPermission?: boolean;
  propertyPermissions?: Partial<Record<'name' | 'quantity' | 'unitPrice', boolean>>;
};

export function TypeIcon({ type }: { type: string }) {
  if (type === 'folder') return <FolderIcon fontSize="small" color="action" />;
  if (type === 'product') return <Inventory2Icon fontSize="small" color="action" />;
  if (type === 'subproduct') return <ExtensionIcon fontSize="small" color="action" />;
  return <DescriptionIcon fontSize="small" color="action" />;
}

export function buildColumns(
  editingNameRowId: string | null,
  setEditingNameRowId: React.Dispatch<React.SetStateAction<string | null>>,
  options: { includeTotals?: boolean } = {}
): ColumnDef<RowData>[] {

  const cols: ColumnDef<RowData>[] = [
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

  if (options.includeTotals) {
    cols.push({
      id: 'total',
      header: 'Summe',
      align: 'right',
      width: 140,
      getIsVisible: (vm) => vm !== 'customer',
      cell: ({ row }) => {
        const q = (row as any).qty as number | undefined;
        const p = (row as any).unitPrice as number | undefined;
        if (row.type === 'folder' || row.type === 'subproduct') return '';
        if (typeof q !== 'number' || typeof p !== 'number') return '';
        return formatCurrency(q * p);
      },
    });
  }

  return cols;
}

