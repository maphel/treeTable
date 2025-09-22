import { jsx as _jsx } from "react/jsx-runtime";
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import IndentedCell from './IndentedCell';
export default function DragOverlayContent({ activeId, byKey, visible, firstColumn, size, }) {
    var _a, _b, _c;
    if (!activeId || !firstColumn)
        return null;
    const activeRow = byKey.get(activeId);
    if (!activeRow)
        return null;
    const meta = visible.find(v => String(v.row.id) === activeId);
    const level = (_a = meta === null || meta === void 0 ? void 0 : meta.level) !== null && _a !== void 0 ? _a : 0;
    const hasChildren = (_b = meta === null || meta === void 0 ? void 0 : meta.hasChildren) !== null && _b !== void 0 ? _b : false;
    const isExpanded = (_c = meta === null || meta === void 0 ? void 0 : meta.expanded) !== null && _c !== void 0 ? _c : false;
    return (_jsx(Box, { sx: { px: 1.5, py: 1, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, boxShadow: 6, minWidth: 240 }, children: IndentedCell(activeRow, firstColumn, level, true, hasChildren, isExpanded, undefined, (_jsx(IconButton, { size: size === 'small' ? 'small' : 'medium', disableRipple: true, disableFocusRipple: true, sx: { mr: 1, cursor: 'grabbing', '&:focus,&:focus-visible': { outline: 'none' } }, children: _jsx(DragIndicatorIcon, { fontSize: size === 'small' ? 'small' : 'medium' }) })), size) }));
}
