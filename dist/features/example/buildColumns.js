import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Box from '@mui/material/Box';
import FolderIcon from '@mui/icons-material/Folder';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ExtensionIcon from '@mui/icons-material/Extension';
import DescriptionIcon from '@mui/icons-material/Description';
import { CurrencyInput, NumberEditor, TextEditor } from '../../components/editors';
import { formatCurrency, parseCurrency } from '../../components/formatters';
export function TypeIcon({ type }) {
    if (type === 'folder')
        return _jsx(FolderIcon, { fontSize: "small", color: "action" });
    if (type === 'product')
        return _jsx(Inventory2Icon, { fontSize: "small", color: "action" });
    if (type === 'subproduct')
        return _jsx(ExtensionIcon, { fontSize: "small", color: "action" });
    return _jsx(DescriptionIcon, { fontSize: "small", color: "action" });
}
export function buildColumns(editingNameRowId, setEditingNameRowId, options = {}) {
    const CurrencyEditor = ({ value, onChange, commit, cancel, autoFocus }) => (_jsx(CurrencyInput, { value: value, onChange: (s) => onChange(s), onCommit: commit, onCancel: cancel, autoFocus: autoFocus, locale: "de-DE", currency: "EUR" }));
    const cols = [
        {
            id: 'name',
            header: 'Name',
            width: '40%',
            getIsEditable: (row) => { var _a, _b; return row.type === 'custom' && ((_b = (_a = row.propertyPermissions) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : true); },
            editMode: (row) => (row.id === editingNameRowId ? 'unlocked' : undefined),
            autoCommitOnChange: (row) => row.id === editingNameRowId,
            editor: (p) => (_jsx(TextEditor, { ...p, onCommit: () => {
                    p.commit();
                    setEditingNameRowId((curr) => (curr === p.row.id ? null : curr));
                }, onCancel: () => {
                    p.cancel();
                    setEditingNameRowId((curr) => (curr === p.row.id ? null : curr));
                } })),
            cell: ({ row, value }) => (_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 1 }, children: [_jsx(TypeIcon, { type: row.type }), _jsx(Box, { component: "span", sx: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, children: String(value !== null && value !== void 0 ? value : '') })] })),
        },
        {
            id: 'qty',
            header: 'Menge',
            align: 'right',
            width: 120,
            getIsEditable: (row) => { var _a, _b; return row.type !== 'folder' && ((_b = (_a = row.propertyPermissions) === null || _a === void 0 ? void 0 : _a.quantity) !== null && _b !== void 0 ? _b : true); },
            editor: ({ value, onChange, commit, cancel, autoFocus }) => (_jsx(NumberEditor, { value: typeof value === 'number' ? value : undefined, onChange: onChange, onCommit: commit, onCancel: cancel, autoFocus: autoFocus, step: 1, min: 0 })),
            valueFormatter: (v) => (typeof v === 'number' ? String(v) : ''),
        },
        {
            id: 'unitPrice',
            header: 'Preis',
            align: 'right',
            width: 140,
            getIsEditable: (row) => { var _a, _b; return row.type !== 'folder' && ((_b = (_a = row.propertyPermissions) === null || _a === void 0 ? void 0 : _a.unitPrice) !== null && _b !== void 0 ? _b : true); },
            getIsVisible: (vm) => vm !== 'customer',
            editor: CurrencyEditor,
            valueParser: parseCurrency,
            valueFormatter: (v) => formatCurrency(typeof v === 'number' ? v : undefined),
        },
    ];
    if (options.includeTotals) {
        cols.push({
            id: 'total',
            header: 'Summe',
            align: 'right',
            width: 140,
            getIsVisible: (vm) => vm !== 'customer',
            cell: ({ row }) => {
                const q = row.qty;
                const p = row.unitPrice;
                if (row.type === 'folder' || row.type === 'subproduct')
                    return '';
                if (typeof q !== 'number' || typeof p !== 'number')
                    return '';
                return formatCurrency(q * p);
            },
        });
    }
    return cols;
}
