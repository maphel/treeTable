import { useDroppable } from "@dnd-kit/core"
import Box from "@mui/material/Box"
import * as React from "react"


export default function DropEdgeOverlays({
    rowId,
    allowedBefore,
    allowedAfter,
    isActiveDrag
}: {
    rowId: string
    allowedBefore: boolean
    allowedAfter: boolean
    isActiveDrag: boolean
}) {
    const beforeId = React.useMemo(() => `before:${rowId}` as const, [rowId])
    const afterId = React.useMemo(() => `after:${rowId}` as const, [rowId])
    const { setNodeRef: setBeforeRef, isOver: isBeforeOver } = useDroppable({ id: beforeId })
    const { setNodeRef: setAfterRef, isOver: isAfterOver } = useDroppable({ id: afterId })

    const commonZoneStyles = {
        position: "absolute" as const,
        left: 0,
        right: 0,
        pointerEvents: isActiveDrag ? "auto" : "none",
        zIndex: 2
    }

    return (
        <>
            <Box
                ref={setBeforeRef}
                sx={{
                    ...commonZoneStyles,
                    top: 0,
                    height: "33.333%",
                    display: allowedBefore ? "block" : "none"
                }}
            />
            {isActiveDrag && allowedBefore && isBeforeOver && (
                <Box
                    sx={(theme) => ({
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: 0,
                        height: "33.333%",
                        pointerEvents: "none",
                        zIndex: 1,
                        background: `linear-gradient(to bottom, ${theme.palette.primary.light} 0%, ${theme.palette.primary.light} 50%, transparent 50%, transparent 100%)`
                    })}
                />
            )}
            <Box
                ref={setAfterRef}
                sx={{
                    ...commonZoneStyles,
                    bottom: 0,
                    height: "33.333%",
                    display: allowedAfter ? "block" : "none"
                }}
            />
            {isActiveDrag && allowedAfter && isAfterOver && (
                <Box
                    sx={(theme) => ({
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: "33.333%",
                        pointerEvents: "none",
                        zIndex: 1,
                        background: `linear-gradient(to bottom, transparent 0%, transparent 50%, ${theme.palette.primary.light} 50%, ${theme.palette.primary.light} 100%)`
                    })}
                />
            )}
        </>
    )
}
