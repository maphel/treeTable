import { jsx as _jsx } from "react/jsx-runtime";
import { DragIndicator as DragIndicatorIcon } from "@mui/icons-material";
import { Box, IconButton, Table, TableBody, TableCell, TableContainer, TableRow } from "@mui/material";
import IndentedCell from "./IndentedCell.js";
import ViewCell from "./ViewCell.js";
export function DragOverlayContent({ activeId, byKey, visible, columns, size }) {
    var _a, _b, _c;
    if (!activeId || !columns)
        return null;
    const activeRow = byKey.get(activeId);
    if (!activeRow)
        return null;
    const meta = visible.find((v) => String(v.row.id) === activeId);
    const level = (_a = meta === null || meta === void 0 ? void 0 : meta.level) !== null && _a !== void 0 ? _a : 0;
    const hasChildren = (_b = meta === null || meta === void 0 ? void 0 : meta.hasChildren) !== null && _b !== void 0 ? _b : false;
    const isExpanded = (_c = meta === null || meta === void 0 ? void 0 : meta.expanded) !== null && _c !== void 0 ? _c : false;
    return (_jsx(Box, { sx: {
            opacity: 0.85,
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            boxShadow: 6,
            minWidth: 240,
            maxWidth: "70vw",
            overflow: "hidden",
        }, children: _jsx(TableContainer, { children: _jsx(Table, { children: _jsx(TableBody, { children: _jsx(TableRow, { children: columns.map((col, idx) => {
                            const cellContent = IndentedCell(activeRow, col, level, idx === 0, hasChildren, isExpanded, undefined, _jsx(IconButton, { size: size === "small" ? "small" : "medium", disableRipple: true, disableFocusRipple: true, sx: {
                                    mr: 1,
                                    cursor: "grabbing",
                                    "&:focus,&:focus-visible": { outline: "none" }
                                }, children: _jsx(DragIndicatorIcon, { fontSize: size === "small" ? "small" : "medium" }) }), size, _jsx(ViewCell, { row: activeRow, col: col, level: level }));
                            return (_jsx(TableCell, { align: col.align, style: { width: col.width }, children: cellContent }, col.id));
                        }) }) }) }) }) }));
}
