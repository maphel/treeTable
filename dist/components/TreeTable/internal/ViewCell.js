import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
export default function ViewCell({ row, col, level }) {
    const raw = row[col.id];
    const value = col.valueFormatter ? col.valueFormatter(raw, row) : raw;
    const content = col.cell ? col.cell({ row, value, level, column: col }) : value;
    return _jsx(_Fragment, { children: content });
}
