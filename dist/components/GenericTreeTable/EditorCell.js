import { jsx as _jsx } from "react/jsx-runtime";
import { Box } from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
import { getNestedValue } from "./genericTreeTable.utils.js";
export default function EditorCell({ row, col, mode, cellKey, editingKey, editingValue, setEditingKey, setEditingValue, markAutoClosed, onEditCommit }) {
    const key = cellKey;
    const raw = getNestedValue(row, col.id);
    const always = mode === "locked";
    const active = always || editingKey === key;
    const [val, setVal] = useState(active ? (always ? raw : editingValue) : raw);
    useEffect(() => {
        if (always) {
            setVal(raw);
        }
        else if (editingKey === key) {
            setVal(editingValue);
        }
        else {
            setVal(raw);
        }
    }, [raw, editingKey, editingValue, key, always]);
    const commitWithValue = useCallback(async (v) => {
        const parsed = col.valueParser ? col.valueParser(v, row) : v;
        try {
            await (onEditCommit === null || onEditCommit === void 0 ? void 0 : onEditCommit(row, col, parsed));
            if (!always) {
                // Only clear editing state if this cell is still the active one.
                setEditingKey((prev) => {
                    const shouldClear = prev === key;
                    if (shouldClear)
                        setEditingValue(undefined);
                    return shouldClear ? null : prev;
                });
            }
            if (mode === "unlocked") {
                markAutoClosed(key);
            }
        }
        catch (e) {
            console.warn("Commit failed", e);
        }
    }, [
        col,
        row,
        always,
        mode,
        key,
        onEditCommit,
        setEditingKey,
        setEditingValue,
        markAutoClosed
    ]);
    const commit = useCallback(async () => {
        await commitWithValue(val);
    }, [commitWithValue, val]);
    const cancel = useCallback(() => {
        if (!always) {
            // Only clear if we are still the active editor
            setEditingKey((prev) => {
                const shouldClear = prev === key;
                if (shouldClear)
                    setEditingValue(undefined);
                return shouldClear ? null : prev;
            });
        }
        else {
            setVal(raw);
        }
        if (mode === "unlocked") {
            markAutoClosed(key);
        }
    }, [always, raw, mode, key, setEditingKey, setEditingValue, markAutoClosed]);
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            commit().then();
        }
        else if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            cancel();
        }
    };
    if (!col.editor)
        return null;
    const autoCommit = typeof col.autoCommitOnChange === "function"
        ? col.autoCommitOnChange(row)
        : col.autoCommitOnChange;
    const commitOnceRef = useRef(false);
    const handleChange = useCallback((next) => {
        setVal(next);
        if (autoCommit && !always && !commitOnceRef.current) {
            commitOnceRef.current = true;
            commitWithValue(next).then();
        }
    }, [autoCommit, always, commitWithValue]);
    return (_jsx(Box, { onKeyDown: handleKeyDown, sx: { width: "100%" }, children: col.editor({
            row,
            value: val,
            onChange: handleChange,
            commit: () => void commit(),
            cancel,
            autoFocus: !always && editingKey === key
        }) }));
}
