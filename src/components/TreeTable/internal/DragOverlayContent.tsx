import * as React from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

import IndentedCell from './IndentedCell';
import type { ColumnDef, RowModel } from '../types';
import type { VisibleRow } from './types';

export default function DragOverlayContent<T extends object = {}>({
  activeId,
  byKey,
  visible,
  firstColumn,
  size,
}: {
  activeId: string | null;
  byKey: Map<string, RowModel<T>>;
  visible: ReadonlyArray<VisibleRow<T>>;
  firstColumn: ColumnDef<T> | undefined;
  size: 'small' | 'medium';
}) {
  if (!activeId || !firstColumn) return null;
  const activeRow = byKey.get(activeId);
  if (!activeRow) return null;
  const meta = visible.find(v => String(v.row.id) === activeId);
  const level = meta?.level ?? 0;
  const hasChildren = meta?.hasChildren ?? false;
  const isExpanded = meta?.expanded ?? false;
  return (
    <Box sx={{ px: 1.5, py: 1, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, boxShadow: 6, minWidth: 240 }}>
      {IndentedCell(
        activeRow,
        firstColumn,
        level,
        true,
        hasChildren,
        isExpanded,
        undefined,
        (
          <IconButton size={size === 'small' ? 'small' : 'medium'} disableRipple disableFocusRipple sx={{ mr: 1, cursor: 'grabbing', '&:focus,&:focus-visible': { outline: 'none' } }}>
            <DragIndicatorIcon fontSize={size === 'small' ? 'small' : 'medium'} />
          </IconButton>
        ),
        size
      )}
    </Box>
  );
}

