import { ExpandMore, ChevronRight } from "@mui/icons-material"
import { Box, IconButton } from "@mui/material"
import type { ReactNode } from "react"

import type { ColumnDef, RowModel } from "./genericTreeTable.types.js"

export default function IndentedCell<T extends object>(
    row: RowModel<T>,
    column: ColumnDef<T>,
    level: number,
    isFirst: boolean,
    hasChildren: boolean,
    expanded: boolean,
    onToggle?: () => void,
    dragHandle?: ReactNode,
    size: "small" | "medium" = "medium",
    overrideContent?: ReactNode
) {
    const raw = (row as any)[column.id]
    const value = column.valueFormatter ? column.valueFormatter(raw, row) : raw
    const content =
        typeof overrideContent !== "undefined"
            ? overrideContent
            : column.cell
            ? column.cell({ row, value, level, column })
            : value

    if (!isFirst) return content as ReactNode

    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                pl: level * 1.5,
                position: "relative",
                marginLeft: "-10px"
            }}
        >
            {hasChildren ? (
                <IconButton
                    sx={{p: 0, m: 0}}
                    size={size === "small" ? "small" : "medium"}
                    onClick={onToggle}
                    aria-label={expanded ? "Collapse" : "Expand"}
                    aria-expanded={expanded}
                >
                    {expanded ? (
                        <ExpandMore
                            fontSize={size === "small" ? "small" : "medium"}
                        />
                    ) : (
                        <ChevronRight
                            fontSize={size === "small" ? "small" : "medium"}
                        />
                    )}
                </IconButton>
            ) : (
                <Box sx={{ width: size === "small" ? 8 : 14, mr: 1 }} />
            )}
            {dragHandle}
            <Box sx={{ minWidth: 0, flex: 1 }}>
                {content as ReactNode}
            </Box>
        </Box>
    )
}
