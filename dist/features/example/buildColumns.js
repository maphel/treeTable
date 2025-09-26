import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Box from '@mui/material/Box';
import FolderIcon from '@mui/icons-material/Folder';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ExtensionIcon from '@mui/icons-material/Extension';
import DescriptionIcon from '@mui/icons-material/Description';
import TextEditor from '../../components/editors/TextEditor';
import NumberEditor from '../../components/editors/NumberEditor';
import PercentageEditor from '../../components/editors/PercentageEditor';
import { formatCurrency, parseCurrency } from '../../components/formatters/currency';
import CurrencyEditor from '../../components/editors/CurrencyEditor';
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
    var _a, _b, _c;
    // Ensure sane defaults even when a partial options object is supplied
    const language = (_a = options.language) !== null && _a !== void 0 ? _a : "de-DE";
    const currency = (_b = options.currency) !== null && _b !== void 0 ? _b : "EUR";
    const includeTotals = (_c = options.includeTotals) !== null && _c !== void 0 ? _c : false;
    const currencyOptions = { locale: language, currency };
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
            editor: ({ value, onChange, commit, cancel, autoFocus }) => (_jsx(CurrencyEditor, { value: value, onChange: onChange, onCommit: commit, onCancel: cancel, autoFocus: autoFocus, locale: language, currency: currency })),
            // Ensure live currency string is parsed back to a number
            valueParser: (input) => parseCurrency(input, currencyOptions),
            valueFormatter: (v) => formatCurrency(typeof v === 'number' ? v : undefined, currencyOptions),
        },
        {
            id: 'discount',
            header: 'Rabatt',
            align: 'right',
            width: 120,
            getIsEditable: (row) => row.type !== 'folder',
            getIsVisible: (vm) => vm !== 'customer',
            // Use the PercentageEditor; it emits fractions (0.15 for 15%)
            editor: ({ value, onChange, commit, cancel, autoFocus }) => (_jsx(PercentageEditor, { value: typeof value === 'number' ? value : undefined, onChange: onChange, onCommit: commit, onCancel: cancel, autoFocus: autoFocus, locale: options.language, min: 0, max: 100, step: 0.1 })),
            valueFormatter: (v) => {
                if (typeof v !== 'number')
                    return '';
                return `${v.toLocaleString(options.language, { maximumFractionDigits: 2 })} %`;
            },
        },
    ];
    if (includeTotals) {
        const calcLineTotal = (r) => {
            // base line total for non-folders
            if (r.type !== 'folder') {
                const q = r.qty;
                const p = r.unitPrice;
                if (typeof q === 'number' && typeof p === 'number') {
                    const disc = typeof r.discount === 'number' ? r.discount : 0;
                    const factor = Math.max(0, Math.min(100, disc));
                    return q * p * (1 - factor / 100);
                }
                return 0;
            }
            return 0;
        };
        const sumRecursive = (r) => {
            if (r.type === 'folder') {
                return (r.children || []).reduce((acc, c) => acc + sumRecursive(c), 0);
            }
            return calcLineTotal(r);
        };
        cols.push({
            id: 'total',
            header: 'Summe',
            align: 'right',
            width: 160,
            // Show totals to both pro and customer views
            cell: ({ row }) => {
                // For folders, show aggregated sum of descendants.
                const total = row.type === 'folder' ? sumRecursive(row) : calcLineTotal(row);
                if (!total)
                    return '';
                return formatCurrency(total, currencyOptions);
            },
        });
    }
    return cols;
}
