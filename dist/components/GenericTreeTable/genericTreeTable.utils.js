export function toIdSet(ids) {
    if (!ids)
        return new Set();
    return ids instanceof Set ? ids : new Set(ids);
}
export function buildVisibleRows(nodes, level, expandedIds, out) {
    const expandAll = expandedIds.size === 0;
    for (const n of nodes) {
        const hasChildren = (n.children && n.children.length > 0) || false;
        const expanded = hasChildren && (expandAll || expandedIds.has(String(n.id)));
        out.push({ row: n, level, hasChildren, expanded });
        if (hasChildren && expanded) {
            buildVisibleRows(n.children, level + 1, expandedIds, out);
        }
    }
}
export function buildRowIndexMap(rows) {
    const m = new Map();
    const add = (nodes) => {
        nodes === null || nodes === void 0 ? void 0 : nodes.forEach((n) => {
            m.set(String(n.id), n);
            if (n.children)
                add(n.children);
        });
    };
    add(rows);
    return m;
}
export function getVisibleColumns(columns, viewContext) {
    return (columns || []).filter((c) => typeof c.getIsVisible === "function"
        ? c.getIsVisible(viewContext)
        : true);
}
export function getNestedValue(obj, path) {
    if (!obj)
        return undefined;
    return path
        .split(".")
        .reduce((acc, part) => acc && acc[part] !== undefined ? acc[part] : undefined, obj);
}
export function collectExpandableRowIds(nodes, out = new Set()) {
    for (const n of nodes) {
        if (n.children && n.children.length > 0) {
            out.add(String(n.id));
            collectExpandableRowIds(n.children, out);
        }
    }
    return out;
}
