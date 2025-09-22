import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
export default function RowActions({ row, isDuplicating, isDeleting, confirmDelete = true, onEdit, onDuplicate, onDelete, }) {
    var _a, _b, _c, _d;
    const allowed = (_a = row.permission) !== null && _a !== void 0 ? _a : true;
    const configAllowed = (_b = row.configurationPermission) !== null && _b !== void 0 ? _b : true;
    if (!allowed || row.type === 'subproduct')
        return null;
    const type = row.type;
    const canEditName = type === 'custom' && ((_d = (_c = row.propertyPermissions) === null || _c === void 0 ? void 0 : _c.name) !== null && _d !== void 0 ? _d : true);
    const showEdit = type === 'custom' || type === 'product';
    const editDisabled = type !== 'custom' || !canEditName;
    const showDuplicate = type === 'product' || type === 'custom';
    const duplicateDisabled = !configAllowed;
    const showDelete = type === 'folder' || type === 'product' || type === 'custom';
    const deleteDisabled = !configAllowed;
    const handleDelete = async (e) => {
        e.stopPropagation();
        if (deleteDisabled)
            return;
        if (!confirmDelete || window.confirm('Diesen Eintrag löschen?')) {
            await onDelete();
        }
    };
    return (_jsxs(Box, { sx: { display: 'flex', justifyContent: 'flex-end', gap: 0.5 }, children: [showEdit && (_jsx(Tooltip, { title: editDisabled ? 'Bearbeiten nicht möglich' : 'Bearbeiten', children: _jsx("span", { children: _jsx(IconButton, { size: "small", disabled: editDisabled, onClick: (e) => { e.stopPropagation(); if (!editDisabled)
                            onEdit(); }, children: _jsx(EditIcon, { fontSize: "small" }) }) }) })), showDuplicate && (_jsx(Tooltip, { title: duplicateDisabled ? 'Duplizieren nicht erlaubt' : 'Duplizieren', children: _jsx("span", { children: _jsx(IconButton, { size: "small", disabled: duplicateDisabled || isDuplicating, onClick: async (e) => { e.stopPropagation(); await onDuplicate(); }, children: _jsx(ContentCopyIcon, { fontSize: "small" }) }) }) })), showDelete && (_jsx(Tooltip, { title: deleteDisabled ? 'Löschen nicht erlaubt' : 'Löschen', children: _jsx("span", { children: _jsx(IconButton, { size: "small", disabled: deleteDisabled || isDeleting, onClick: handleDelete, children: _jsx(DeleteIcon, { fontSize: "small" }) }) }) }))] }));
}
