import { DragIndicator as DragIndicatorIcon } from "@mui/icons-material"
import {
    Box,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow
} from "@mui/material"

import IndentedCell from "./IndentedCell.js"
import ViewCell from "./ViewCell.js"
import type {
    ColumnDef,
    RowModel,
    VisibleRow
} from "./genericTreeTable.types.js"


export function DragOverlayContent<T extends object>({
    activeId,
    byKey,
    visible,
    columns,
    size
}: {
    activeId: string | null
    byKey: Map<string, RowModel<T>>
    visible: ReadonlyArray<VisibleRow<T>>
    columns: ColumnDef<T>[] | undefined
    size: "small" | "medium"
}) {
    if (!activeId || !columns) return null
    const activeRow = byKey.get(activeId)
    if (!activeRow) return null
    const meta = visible.find((v) => String(v.row.id) === activeId)
    const level = meta?.level ?? 0
    const hasChildren = meta?.hasChildren ?? false
    const isExpanded = meta?.expanded ?? false
    return (
        <Box
            sx={{
                opacity: 0.85,

                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                boxShadow: 6,
                minWidth: 240,
                maxWidth: "70vw",
                overflow: "hidden",
            }}
        >
            <TableContainer>
                <Table>
                    <TableBody>
                        <TableRow>
                            {columns.map((col, idx) => {
                                const content = (
                                    <TableCell>
                                        <ViewCell
                                        row={activeRow}
                                        col={col}
                                        level={level}
                                    />
                                    </TableCell>
                                )
                                return IndentedCell(
                                    activeRow,
                                    col,
                                    level,
                                    idx === 0,
                                    hasChildren,
                                    isExpanded,
                                    undefined,
                                    <IconButton
                                        size={
                                            size === "small"
                                                ? "small"
                                                : "medium"
                                        }
                                        disableRipple
                                        disableFocusRipple
                                        sx={{
                                            mr: 1,
                                            cursor: "grabbing",
                                            "&:focus,&:focus-visible": {
                                                outline: "none"
                                            }
                                        }}
                                    >
                                        <DragIndicatorIcon
                                            fontSize={
                                                size === "small"
                                                    ? "small"
                                                    : "medium"
                                            }
                                        />
                                    </IconButton>,
                                    size,
                                    content
                                )
                            })}
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    )
}
