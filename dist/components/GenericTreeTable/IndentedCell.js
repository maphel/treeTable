import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ExpandMore, ChevronRight } from "@mui/icons-material";
import { Box, IconButton } from "@mui/material";
export default function IndentedCell(row, column, level, isFirst, hasChildren, expanded, onToggle, dragHandle, size = "medium", overrideContent) {
    const raw = row[column.id];
    const value = column.valueFormatter ? column.valueFormatter(raw, row) : raw;
    const content = typeof overrideContent !== "undefined"
        ? overrideContent
        : column.cell
            ? column.cell({ row, value, level, column })
            : value;
    if (!isFirst)
        return content;
    return (_jsxs(Box, { sx: {
            display: "flex",
            alignItems: "center",
            pl: level * 1.5,
            position: "relative",
            marginLeft: "-10px"
        }, children: [hasChildren ? (_jsx(IconButton, { sx: { p: 0, m: 0 }, size: size === "small" ? "small" : "medium", onClick: onToggle, "aria-label": expanded ? "Collapse" : "Expand", "aria-expanded": expanded, children: expanded ? (_jsx(ExpandMore, { fontSize: size === "small" ? "small" : "medium" })) : (_jsx(ChevronRight, { fontSize: size === "small" ? "small" : "medium" })) })) : (_jsx(Box, { sx: { width: size === "small" ? 8 : 14, mr: 1 } })), dragHandle, _jsx(Box, { sx: { minWidth: 0, flex: 1 }, children: content })] }));
}
