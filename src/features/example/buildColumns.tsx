import * as React from 'react';
import Box from '@mui/material/Box';
import FolderIcon from '@mui/icons-material/Folder';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ExtensionIcon from '@mui/icons-material/Extension';
import DescriptionIcon from '@mui/icons-material/Description';

import type { ColumnDef, RowModel } from '../../components/GenericTreeTable/genericTreeTable.types';
import TextEditor from '../../components/editors/TextEditor';
import NumberEditor from '../../components/editors/NumberEditor';
import PercentageEditor from '../../components/editors/PercentageEditor';
import { CurrencyFormatOptions, formatCurrency, parseCurrency } from '../../components/formatters/currency';
import CurrencyEditor from '../../components/editors/CurrencyEditor';

export type RowData = {
  name: string;
  qty?: number;
  unitPrice?: number;
  discount?: number;
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
  editingRowId: string | null,
  _setEditingRowId: React.Dispatch<React.SetStateAction<string | null>>,
  options: { includeTotals?: boolean; language?: string; currency?: string } = {}
): ColumnDef<RowData>[] {
  const language = options.language ?? "de-DE";
  const currency = options.currency ?? "EUR";
  const includeTotals = options.includeTotals ?? false;
  const currencyOptions: CurrencyFormatOptions = { locale: language, currency };

  const cols: ColumnDef<RowData>[] = [
    {
      id: 'name',
      header: 'Name',
      width: '40%',
      getIsEditable: (row) => row.type === 'custom' && (row.propertyPermissions?.name ?? true),
      editMode: (row) => (row.id === editingRowId ? 'unlocked' : undefined),
      autoCommitOnChange: (row) => row.id === editingRowId,
      editor: ({ value, onChange, commit, cancel, autoFocus, size }) => (
        <TextEditor
          value={value}
          onChange={onChange as any}
          onCommit={commit}
          onCancel={cancel}
          autoFocus={autoFocus}
          size={size}
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
      editMode: (row) => (row.id === editingRowId ? 'unlocked' : undefined),
      editor: ({ value, onChange, commit, cancel, autoFocus, size }) => (
        <NumberEditor
          value={typeof value === 'number' ? value : undefined}
          onChange={onChange}
          onCommit={commit}
          onCancel={cancel}
          autoFocus={autoFocus}
          size={size}
          step={1}
          min={0}
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
      editMode: (row) => (row.id === editingRowId ? 'unlocked' : undefined),
      editor: ({ value, onChange, commit, cancel, autoFocus, size }) => (
        <CurrencyEditor 
        value={value as any}
         onChange={onChange as any} 
         onCommit={commit} 
         onCancel={cancel} 
         autoFocus={autoFocus}
         size={size}
          locale={language} 
          currency={currency}
           />
      ),
      valueParser: (input) => parseCurrency(input, currencyOptions),
      valueFormatter: (v) => formatCurrency(typeof v === 'number' ? v : undefined, currencyOptions),
    },
    {
      id: 'discount',
      header: 'Rabatt',
      align: 'right',
      width: 120,
      getIsEditable: (row) => row.type !== 'folder',
      getIsVisible: (vm) => vm !== 'customer',
      editMode: (row) => (row.id === editingRowId ? 'unlocked' : undefined),
      editor: ({ value, onChange, commit, cancel, autoFocus, size }) => (
        <PercentageEditor
          value={typeof value === 'number' ? (value as number) : undefined}
          onChange={onChange as any}
          onCommit={commit}
          onCancel={cancel}
          autoFocus={autoFocus}
          size={size}
          locale={options.language}
          min={0}
          max={100}
          step={0.1}
        />
      ),
      valueFormatter: (v) => {
        if (typeof v !== 'number') return '';
        return `${v.toLocaleString(options.language, { maximumFractionDigits: 2 })} %`;
      },
    },
  ];

  if (includeTotals) {
    const calcLineTotal = (r: RowModel<RowData>): number => {
      if (r.type !== 'folder') {
        const q = (r as any).qty as number | undefined;
        const p = (r as any).unitPrice as number | undefined;
        if (typeof q === 'number' && typeof p === 'number') {
          const disc = typeof (r as any).discount === 'number' ? (r as any).discount : 0;
          const factor = Math.max(0, Math.min(100, disc));
          return q * p * (1 - factor / 100);
        }
        return 0;
      }
      return 0;
    };

    const sumRecursive = (r: RowModel<RowData>): number => {
      if (r.type === 'folder') {
        return (r.children || []).reduce((acc: number, c: RowModel<RowData>) => acc + sumRecursive(c), 0);
      }
      return calcLineTotal(r);
    };

    cols.push({
      id: 'total',
      header: 'Summe',
      align: 'right',
      width: 160,
      cell: ({ row }) => {
        const total = row.type === 'folder' ? sumRecursive(row) : calcLineTotal(row);
        if (!total) return '';
        return formatCurrency(total, currencyOptions);
      },
    });
  }

  return cols;
}
