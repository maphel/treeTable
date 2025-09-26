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
    const { setNodeRef: setBeforeRef } = useDroppable({ id: beforeId })
    const { setNodeRef: setAfterRef } = useDroppable({ id: afterId })

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
            <Box
                ref={setAfterRef}
                sx={{
                    ...commonZoneStyles,
                    bottom: 0,
                    height: "33.333%",
                    display: allowedAfter ? "block" : "none"
                }}
            />
        </>
    )
}
