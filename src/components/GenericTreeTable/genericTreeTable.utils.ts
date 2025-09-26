import type {
    ColumnDef,
    RowModel,
    VisibleRow
} from "./genericTreeTable.types.js"

export function toIdSet(ids?: Set<string> | string[]): Set<string> {
    if (!ids) return new Set<string>()
    return ids instanceof Set ? ids : new Set<string>(ids)
}

export function buildVisibleRows<T extends object>(
    nodes: ReadonlyArray<RowModel<T>>,
    level: number,
    expandedIds: Set<string>,
    out: VisibleRow<T>[]
) {
    const expandAll = expandedIds.size === 0
    for (const n of nodes) {
        const hasChildren = (n.children && n.children.length > 0) || false
        const expanded =
            hasChildren && (expandAll || expandedIds.has(String(n.id)))
        out.push({ row: n, level, hasChildren, expanded })
        if (hasChildren && expanded) {
            buildVisibleRows(n.children!, level + 1, expandedIds, out)
        }
    }
}

export function buildRowIndexMap<T extends object>(
    rows?: ReadonlyArray<RowModel<T>>
) {
    const m = new Map<string, RowModel<T>>()
    const add = (nodes?: ReadonlyArray<RowModel<T>>) => {
        nodes?.forEach((n) => {
            m.set(String(n.id), n)
            if (n.children) add(n.children)
        })
    }
    add(rows)
    return m
}

export function getVisibleColumns<T extends object>(
    columns: ColumnDef<T>[],
    viewContext: unknown
) {
    return (columns || []).filter((c) =>
        typeof c.getIsVisible === "function"
            ? c.getIsVisible(viewContext)
            : true
    )
}

export function getNestedValue(obj: any, path: string): any {
    if (!obj) return undefined
    return path
        .split(".")
        .reduce(
            (acc, part) =>
                acc && acc[part] !== undefined ? acc[part] : undefined,
            obj
        )
}

export function collectExpandableRowIds<T extends object>(
    nodes: ReadonlyArray<RowModel<T>>,
    out: Set<string> = new Set()
): Set<string> {
    for (const n of nodes) {
        if (n.children && n.children.length > 0) {
            out.add(String(n.id))
            collectExpandableRowIds(n.children, out)
        }
    }
    return out
}
