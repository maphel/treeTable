import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import Box from '@mui/material/Box';
import { useDroppable } from '@dnd-kit/core';
export default function DropEdgeOverlays({ rowId, allowedBefore, allowedAfter, isActiveDrag, }) {
    const beforeId = React.useMemo(() => `before:${rowId}`, [rowId]);
    const afterId = React.useMemo(() => `after:${rowId}`, [rowId]);
    const { setNodeRef: setBeforeRef } = useDroppable({ id: beforeId });
    const { setNodeRef: setAfterRef } = useDroppable({ id: afterId });
    const commonZoneStyles = {
        position: 'absolute',
        left: 0,
        right: 0,
        pointerEvents: isActiveDrag ? 'auto' : 'none',
        zIndex: 2,
    };
    return (_jsxs(_Fragment, { children: [_jsx(Box, { ref: setBeforeRef, sx: {
                    ...commonZoneStyles,
                    top: 0,
                    height: '33.333%',
                    display: allowedBefore ? 'block' : 'none',
                } }), _jsx(Box, { ref: setAfterRef, sx: {
                    ...commonZoneStyles,
                    bottom: 0,
                    height: '33.333%',
                    display: allowedAfter ? 'block' : 'none',
                } })] }));
}
