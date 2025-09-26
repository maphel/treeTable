import * as React from "react"

import type { ColumnDef, RowModel } from "./genericTreeTable.types.js"
import { getNestedValue } from "./genericTreeTable.utils.js"

export type ViewCellProps<T extends object> = {
    row: RowModel<T>
    col: ColumnDef<T>
    level: number
}

export default function ViewCell<T extends object = object>({
    row,
    col,
    level
}: ViewCellProps<T>) {
    const raw = getNestedValue(row, col.id)
    const value = col.valueFormatter ? col.valueFormatter(raw, row) : raw
    const content = col.cell
        ? col.cell({ row, value, level, column: col })
        : (value as React.ReactNode)
    return <>{content}</>
}
