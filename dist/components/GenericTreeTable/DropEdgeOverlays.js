import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useDroppable } from "@dnd-kit/core";
import Box from "@mui/material/Box";
import * as React from "react";
export default function DropEdgeOverlays({ rowId, allowedBefore, allowedAfter, isActiveDrag }) {
    const beforeId = React.useMemo(() => `before:${rowId}`, [rowId]);
    const afterId = React.useMemo(() => `after:${rowId}`, [rowId]);
    const { setNodeRef: setBeforeRef, isOver: isBeforeOver } = useDroppable({ id: beforeId });
    const { setNodeRef: setAfterRef, isOver: isAfterOver } = useDroppable({ id: afterId });
    const commonZoneStyles = {
        position: "absolute",
        left: 0,
        right: 0,
        pointerEvents: isActiveDrag ? "auto" : "none",
        zIndex: 2
    };
    return (_jsxs(_Fragment, { children: [_jsx(Box, { ref: setBeforeRef, sx: {
                    ...commonZoneStyles,
                    top: 0,
                    height: "33.333%",
                    display: allowedBefore ? "block" : "none"
                } }), isActiveDrag && allowedBefore && isBeforeOver && (_jsx(Box, { sx: (theme) => ({
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 0,
                    height: "33.333%",
                    pointerEvents: "none",
                    zIndex: 1,
                    background: `linear-gradient(to bottom, ${theme.palette.primary.light} 0%, ${theme.palette.primary.light} 20%, transparent 20%, transparent 100%)`
                }) })), _jsx(Box, { ref: setAfterRef, sx: {
                    ...commonZoneStyles,
                    bottom: 0,
                    height: "33.333%",
                    display: allowedAfter ? "block" : "none"
                } }), isActiveDrag && allowedAfter && isAfterOver && (_jsx(Box, { sx: (theme) => ({
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: "33.333%",
                    pointerEvents: "none",
                    zIndex: 1,
                    background: `linear-gradient(to bottom, transparent 0%, transparent 80%, ${theme.palette.primary.light} 80%, ${theme.palette.primary.light} 100%)`
                }) }))] }));
}
