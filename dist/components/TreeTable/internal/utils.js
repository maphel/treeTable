export function toIdSet(ids) {
    if (!ids)
        return new Set();
    return ids instanceof Set ? ids : new Set(ids);
}
export function buildVisibleRows(nodes, level, expandedIds, out) {
    for (const n of nodes) {
        const hasChildren = !!(n.children && n.children.length > 0);
        const expanded = hasChildren && expandedIds.has(n.id);
        out.push({ row: n, level, hasChildren, expanded });
        if (hasChildren && expanded) {
            buildVisibleRows(n.children, level + 1, expandedIds, out);
        }
    }
}
export function buildRowIndexMap(rows) {
    const m = new Map();
    const add = (nodes) => {
        nodes === null || nodes === void 0 ? void 0 : nodes.forEach(n => {
            m.set(String(n.id), n);
            if (n.children)
                add(n.children);
        });
    };
    add(rows);
    return m;
}
export function getVisibleColumns(columns, viewMode) {
    return (columns || []).filter((c) => (typeof c.getIsVisible === 'function' ? c.getIsVisible(viewMode) : true));
}
