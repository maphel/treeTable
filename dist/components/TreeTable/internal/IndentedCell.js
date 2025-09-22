import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
export default function IndentedCell(row, column, level, isFirst, hasChildren, expanded, onToggle, dragHandle, size = 'medium', overrideContent) {
    const raw = row[column.id];
    const value = column.valueFormatter ? column.valueFormatter(raw, row) : raw;
    const content = typeof overrideContent !== 'undefined'
        ? overrideContent
        : (column.cell ? column.cell({ row, value, level, column }) : value);
    if (!isFirst)
        return content;
    return (_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', pl: level * 2, position: 'relative' }, children: [hasChildren ? (_jsx(IconButton, { size: size === 'small' ? 'small' : 'medium', onClick: onToggle, "aria-label": expanded ? 'Collapse' : 'Expand', "aria-expanded": expanded, sx: { mr: 1 }, children: expanded
                    ? _jsx(ExpandMoreIcon, { fontSize: size === 'small' ? 'small' : 'medium' })
                    : _jsx(ChevronRightIcon, { fontSize: size === 'small' ? 'small' : 'medium' }) })) : (_jsx(Box, { sx: { width: size === 'small' ? 32 : 40, mr: 1 } })), dragHandle, _jsx(Box, { sx: { minWidth: 0, flex: 1 }, children: content })] }));
}
