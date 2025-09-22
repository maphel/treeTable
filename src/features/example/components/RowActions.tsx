import * as React from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import type { RowModel } from '../../../components/TreeTable/types';

export type RowActionsProps<T extends object = {}> = {
  row: RowModel<T> & {
    permission?: boolean;
    configurationPermission?: boolean;
    propertyPermissions?: Partial<Record<'name' | 'quantity' | 'unitPrice', boolean>>;
  };
  isDuplicating: boolean;
  isDeleting: boolean;
  confirmDelete?: boolean;
  onEdit: () => void;
  onDuplicate: () => void | Promise<void>;
  onDelete: () => void | Promise<void>;
};

export default function RowActions<T extends object = {}>({
  row,
  isDuplicating,
  isDeleting,
  confirmDelete = true,
  onEdit,
  onDuplicate,
  onDelete,
}: RowActionsProps<T>) {
  const allowed = row.permission ?? true;
  const configAllowed = row.configurationPermission ?? true;
  if (!allowed || (row as any).type === 'subproduct') return null;

  const type = (row as any).type as string;
  const canEditName = type === 'custom' && ((row as any).propertyPermissions?.name ?? true);
  const showEdit = type === 'custom' || type === 'product';
  const editDisabled = type !== 'custom' || !canEditName;

  const showDuplicate = type === 'product' || type === 'custom';
  const duplicateDisabled = !configAllowed;

  const showDelete = type === 'folder' || type === 'product' || type === 'custom';
  const deleteDisabled = !configAllowed;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleteDisabled) return;
    if (!confirmDelete || window.confirm('Diesen Eintrag löschen?')) {
      await onDelete();
    }
  };

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
            <IconButton size="small" disabled={duplicateDisabled || isDuplicating} onClick={async (e) => { e.stopPropagation(); await onDuplicate(); }}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      )}
      {showDelete && (
        <Tooltip title={deleteDisabled ? 'Löschen nicht erlaubt' : 'Löschen'}>
          <span>
            <IconButton size="small" disabled={deleteDisabled || isDeleting} onClick={handleDelete}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      )}
    </Box>
  );
}

