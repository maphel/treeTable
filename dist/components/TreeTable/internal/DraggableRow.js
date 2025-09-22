import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from 'react';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import DropEdgeOverlays from './DropEdgeOverlays';
import IndentedCell from './IndentedCell';
export default function DraggableRow(props) {
    const { data, visibleColumns, size, isCustomerView, getRowCanDrag, getRowCanDrop, validTargets, overId, activeId, byKey, toggle, viewMode, getRowActions, editingKey, editingValue, setEditingKey, setEditingValue, autoClosedKeys, markAutoClosed, startEdit, onEditCommit, } = props;
    const { row, level, hasChildren, expanded: isExpanded } = data;
    const draggableId = String(row.id);
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: draggableId });
    const canDrag = isCustomerView ? false : (getRowCanDrag ? getRowCanDrag(row) : true);
    // inside droppable (for moving into a folder)
    const insideId = React.useMemo(() => `inside:${draggableId}`, [draggableId]);
    const { isOver: isInsideOver, setNodeRef: setInsideRef } = useDroppable({ id: insideId });
    const style = {
        transform: isDragging ? undefined : CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1 : undefined,
        position: 'relative',
    };
    const insideAllowed = React.useMemo(() => {
        if (!activeId)
            return false;
        const source = byKey.get(activeId);
        if (!source)
            return false;
        const allowedByProps = getRowCanDrop ? getRowCanDrop(source, row, 'inside') : true;
        const allowedByValidList = validTargets ? validTargets.has(row.id) : true;
        return allowedByProps && allowedByValidList;
    }, [activeId, byKey, getRowCanDrop, row, validTargets]);
    React.useEffect(() => {
        let t;
        if (isInsideOver && insideAllowed && hasChildren && !isExpanded) {
            t = setTimeout(() => { toggle(row.id); }, 500);
        }
        return () => { if (t)
            clearTimeout(t); };
    }, [isInsideOver, insideAllowed, hasChildren, isExpanded, row.id, toggle]);
    const beforeAllowed = React.useMemo(() => {
        if (!activeId)
            return false;
        const source = byKey.get(activeId);
        if (!source)
            return false;
        const byProps = getRowCanDrop ? getRowCanDrop(source, row, 'before') : true;
        const byValid = validTargets ? validTargets.has(row.id) : true;
        return byProps && byValid;
    }, [activeId, byKey, getRowCanDrop, row, validTargets]);
    const afterAllowed = React.useMemo(() => {
        if (!activeId)
            return false;
        const source = byKey.get(activeId);
        if (!source)
            return false;
        const byProps = getRowCanDrop ? getRowCanDrop(source, row, 'after') : true;
        const byValid = validTargets ? validTargets.has(row.id) : true;
        return byProps && byValid;
    }, [activeId, byKey, getRowCanDrop, row, validTargets]);
    const isEditable = React.useCallback((col) => {
        if (isCustomerView)
            return false;
        if (typeof col.getIsEditable === 'function')
            return !!col.getIsEditable(row);
        return !!col.editor;
    }, [row, isCustomerView]);
    const resolveEditMode = React.useCallback((col) => {
        const modeRaw = typeof col.editMode === 'function' ? col.editMode(row) : col.editMode;
        if (modeRaw === 'locked')
            return 'locked';
        if (modeRaw === 'unlocked')
            return 'unlocked';
        const globalEdit = viewMode === 'edit' && isEditable(col);
        if (globalEdit)
            return 'locked';
        return 'off';
    }, [row, viewMode, isEditable]);
    function EditorCell({ col, mode, cellKey }) {
        const key = cellKey;
        const raw = row[col.id];
        const always = mode === 'locked';
        const active = always || editingKey === key;
        const [val, setVal] = React.useState(active ? (always ? raw : editingValue) : raw);
        React.useEffect(() => {
            if (always) {
                setVal(raw);
            }
            else if (editingKey === key) {
                setVal(editingValue);
            }
            else {
                setVal(raw);
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [raw, editingKey, editingValue, key, always]);
        const commitWithValue = React.useCallback(async (v) => {
            const parsed = col.valueParser ? col.valueParser(v, row) : v;
            try {
                await (onEditCommit === null || onEditCommit === void 0 ? void 0 : onEditCommit(row, col, parsed));
                if (!always) {
                    setEditingKey(null);
                    setEditingValue(undefined);
                }
                if (mode === 'unlocked') {
                    markAutoClosed(key);
                }
            }
            catch (e) {
                // keep editor open on error
                // eslint-disable-next-line no-console
                console.warn('Commit failed', e);
            }
        }, [col, row, always, mode, key]);
        const commit = React.useCallback(async () => {
            await commitWithValue(val);
        }, [commitWithValue, val]);
        const cancel = React.useCallback(() => {
            if (!always) {
                setEditingKey(null);
                setEditingValue(undefined);
            }
            else {
                setVal(raw);
            }
            if (mode === 'unlocked') {
                markAutoClosed(key);
            }
        }, [always, raw, mode, key]);
        const handleKeyDown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                void commit();
            }
            else if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                cancel();
            }
        };
        const handleBlur = () => { void commit(); };
        if (!col.editor)
            return null;
        const autoCommit = typeof col.autoCommitOnChange === 'function' ? col.autoCommitOnChange(row) : !!col.autoCommitOnChange;
        const commitOnceRef = React.useRef(false);
        const handleChange = React.useCallback((next) => {
            setVal(next);
            if (autoCommit && !always && !commitOnceRef.current) {
                commitOnceRef.current = true;
                void commitWithValue(next);
            }
        }, [autoCommit, always, mode, commitWithValue]);
        return (_jsx(Box, { onKeyDown: handleKeyDown, sx: { width: '100%' }, children: col.editor({ row, value: val, onChange: handleChange, commit: () => void commit(), cancel, autoFocus: !always && editingKey === key }) }));
    }
    const renderViewContent = (col) => {
        const raw = row[col.id];
        const value = col.valueFormatter ? col.valueFormatter(raw, row) : raw;
        return col.cell ? col.cell({ row, value, level, column: col }) : value;
    };
    const dragAttrs = { ...attributes, tabIndex: -1 };
    const handleRowKeyDown = (e) => {
        if (e.target !== e.currentTarget)
            return; // ignore when inside inputs
        if (e.key === 'ArrowLeft') {
            if (hasChildren && isExpanded) {
                e.preventDefault();
                toggle(row.id);
            }
        }
        else if (e.key === 'ArrowRight') {
            if (hasChildren && !isExpanded) {
                e.preventDefault();
                toggle(row.id);
            }
        }
    };
    return (_jsxs(TableRow, { hover: true, ref: setNodeRef, style: style, tabIndex: 0, "aria-level": level + 1, "aria-expanded": hasChildren ? isExpanded : undefined, onKeyDown: handleRowKeyDown, sx: (theme) => {
            const color = theme.palette.primary.light;
            const isBeforeOverRow = !!activeId && beforeAllowed && overId === `before:${draggableId}`;
            const isAfterOverRow = !!activeId && afterAllowed && overId === `after:${draggableId}`;
            const isInsideOverRow = !!activeId && insideAllowed && overId === `inside:${draggableId}`;
            const base = { position: 'relative', transition: 'background-color 120ms, background-image 120ms' };
            if (isInsideOverRow) {
                base.backgroundColor = color;
                base.backgroundImage = 'none';
            }
            else if (isBeforeOverRow) {
                base.backgroundImage = `linear-gradient(to bottom, ${color} 0%, ${color} 33.333%, transparent 33.333%, transparent 100%)`;
            }
            else if (isAfterOverRow) {
                base.backgroundImage = `linear-gradient(to bottom, transparent 0%, transparent 66.666%, ${color} 66.666%, ${color} 100%)`;
            }
            return base;
        }, children: [visibleColumns.map((col, idx) => {
                const key = `${String(row.id)}::${col.id}`;
                const editable = isEditable(col);
                const mode = editable ? resolveEditMode(col) : 'off';
                const initiallyUnlockedActive = mode === 'unlocked' && !autoClosedKeys.has(key);
                const always = mode === 'locked';
                const isActive = always || editingKey === key || initiallyUnlockedActive;
                const content = isActive ? (_jsx(EditorCell, { col: col, mode: mode, cellKey: key })) : (renderViewContent(col));
                return (_jsxs(TableCell, { align: col.align, style: { width: col.width, position: 'relative' }, sx: !!col.editor && editable && !always && !isActive ? { pr: 5, '&:hover .cell-edit-btn': { opacity: 1 } } : undefined, onDoubleClick: () => { if (!always && editable)
                        startEdit(row, col); }, children: [IndentedCell(row, col, level, idx === 0, hasChildren, isExpanded, hasChildren ? () => toggle(row.id) : undefined, idx === 0 && canDrag ? (_jsx(IconButton, { size: size === 'small' ? 'small' : 'medium', disableRipple: true, disableFocusRipple: true, sx: { mr: 1, cursor: 'grab', touchAction: 'none', '&:focus,&:focus-visible': { outline: 'none' } }, ...dragAttrs, ...listeners, children: _jsx(DragIndicatorIcon, { fontSize: size === 'small' ? 'small' : 'medium' }) })) : undefined, size, content), !!col.editor && editable && !always && !isActive && (_jsx(IconButton, { size: "small", className: "cell-edit-btn", "aria-label": "Edit", onClick: (e) => { e.stopPropagation(); startEdit(row, col); }, sx: { position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', opacity: 0, transition: 'opacity 120ms' }, children: _jsx(EditOutlinedIcon, { fontSize: "small" }) }))] }, col.id));
            }), getRowActions && !isCustomerView && (_jsx(TableCell, { align: "right", children: getRowActions(row) }, "__actions")), !isCustomerView && (_jsxs(_Fragment, { children: [_jsx(Box, { ref: setInsideRef, sx: { position: 'absolute', left: 0, right: 0, top: '33.333%', bottom: '33.333%', pointerEvents: activeId ? 'auto' : 'none', display: insideAllowed ? 'block' : 'none' } }), _jsx(DropEdgeOverlays, { rowId: draggableId, allowedBefore: !!activeId && beforeAllowed, allowedAfter: !!activeId && afterAllowed, isActiveDrag: !!activeId })] }))] }, String(row.id)));
}
