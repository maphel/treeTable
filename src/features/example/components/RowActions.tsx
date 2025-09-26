import * as React from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import EditIcon from '@mui/icons-material/Edit';
import EditOffIcon from '@mui/icons-material/EditOff';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import type { RowModel } from '../../../components/GenericTreeTable/genericTreeTable.types';

export type RowActionsProps<T extends object = {}> = {
  row: RowModel<T> & {
    permission?: boolean;
    configurationPermission?: boolean;
    propertyPermissions?: Partial<Record<'name' | 'quantity' | 'unitPrice', boolean>>;
  };
  isEditing?: boolean;
  isDuplicating: boolean;
  isDeleting: boolean;
  confirmDelete?: boolean;
  onEdit: () => void;
  onDuplicate: () => void | Promise<void>;
  onDelete: () => void | Promise<void>;
};

export default function RowActions<T extends object = {}>({
  row,
  isEditing,
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
  const propPerms = (row as any).propertyPermissions || {};
  const canEditName = type === 'custom' && (propPerms.name ?? true);
  const canEditQty = type !== 'folder' && (propPerms.quantity ?? true);
  const canEditUnitPrice = type !== 'folder' && (propPerms.unitPrice ?? true);
  const canEditDiscount = type !== 'folder';
  const hasAnyEditable = (canEditName || canEditQty || canEditUnitPrice || canEditDiscount) && type !== 'subproduct';
  const showEdit = type === 'custom' || type === 'product';
  const editDisabled = !hasAnyEditable;

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
        <Tooltip title={editDisabled ? 'Bearbeiten nicht möglich' : (isEditing ? 'Bearbeiten beenden' : 'Bearbeiten')}>
          <span>
            <IconButton size="small" disabled={editDisabled} onClick={(e) => { e.stopPropagation(); if (!editDisabled) onEdit(); }}>
              {isEditing ? <EditOffIcon fontSize="small" /> : <EditIcon fontSize="small" />}
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
