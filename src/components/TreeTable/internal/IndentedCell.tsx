import * as React from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { ColumnDef, RowModel } from '../types';

export default function IndentedCell<T extends object>(
  row: RowModel<T>,
  column: ColumnDef<T>,
  level: number,
  isFirst: boolean,
  hasChildren: boolean,
  expanded: boolean,
  onToggle?: () => void,
  dragHandle?: React.ReactNode,
  size: 'small' | 'medium' = 'medium',
  overrideContent?: React.ReactNode
) {
  const raw = (row as any)[column.id];
  const value = column.valueFormatter ? column.valueFormatter(raw, row) : raw;
  const content = typeof overrideContent !== 'undefined'
    ? overrideContent
    : (column.cell ? column.cell({ row, value, level, column }) : value);

  if (!isFirst) return content as React.ReactNode;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', pl: level * 2, position: 'relative' }}>
      {hasChildren ? (
        <IconButton
          size={size === 'small' ? 'small' : 'medium'}
          onClick={onToggle}
          aria-label={expanded ? 'Collapse' : 'Expand'}
          aria-expanded={expanded}
          sx={{ mr: 1 }}
        >
          {expanded
            ? <ExpandMoreIcon fontSize={size === 'small' ? 'small' : 'medium'} />
            : <ChevronRightIcon fontSize={size === 'small' ? 'small' : 'medium'} />}
        </IconButton>
      ) : (
        <Box sx={{ width: size === 'small' ? 32 : 40, mr: 1 }} />
      )}
      {dragHandle}
      <Box sx={{ minWidth: 0, flex: 1 }}>{content as React.ReactNode}</Box>
    </Box>
  );
}
