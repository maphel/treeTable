import * as React from 'react';
import Box from '@mui/material/Box';
import type { ColumnDef, RowModel } from '../types';

export type EditorCellProps<T extends object> = {
  row: RowModel<T>;
  col: ColumnDef<T>;
  mode: 'locked' | 'unlocked' | 'off';
  cellKey: string;
  editingKey: string | null;
  editingValue: any;
  setEditingKey: React.Dispatch<React.SetStateAction<string | null>>;
  setEditingValue: React.Dispatch<React.SetStateAction<any>>;
  markAutoClosed: (key: string) => void;
  onEditCommit?: (row: RowModel<T>, column: ColumnDef<T>, next: unknown) => Promise<void> | void;
};

export default function EditorCell<T extends object = {}>({
  row,
  col,
  mode,
  cellKey,
  editingKey,
  editingValue,
  setEditingKey,
  setEditingValue,
  markAutoClosed,
  onEditCommit,
}: EditorCellProps<T>) {
  const key = cellKey;
  const raw = (row as any)[col.id];
  const always = mode === 'locked';
  const active = always || editingKey === key;
  const [val, setVal] = React.useState<any>(active ? (always ? raw : editingValue) : raw);

  React.useEffect(() => {
    if (always) {
      setVal(raw);
    } else if (editingKey === key) {
      setVal(editingValue);
    } else {
      setVal(raw);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw, editingKey, editingValue, key, always]);

  const commitWithValue = React.useCallback(async (v: any) => {
    const parsed = col.valueParser ? col.valueParser(v, row) : v;
    try {
      await onEditCommit?.(row, col, parsed);
      if (!always) {
        setEditingKey(null);
        setEditingValue(undefined);
      }
      if (mode === 'unlocked') {
        markAutoClosed(key);
      }
    } catch (e) {
      // keep editor open on error
      // eslint-disable-next-line no-console
      console.warn('Commit failed', e);
    }
  }, [col, row, always, mode, key, onEditCommit, setEditingKey, setEditingValue, markAutoClosed]);

  const commit = React.useCallback(async () => {
    await commitWithValue(val);
  }, [commitWithValue, val]);

  const cancel = React.useCallback(() => {
    if (!always) {
      setEditingKey(null);
      setEditingValue(undefined);
    } else {
      setVal(raw);
    }
    if (mode === 'unlocked') {
      markAutoClosed(key);
    }
  }, [always, raw, mode, key, setEditingKey, setEditingValue, markAutoClosed]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); void commit(); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cancel(); }
  };

  const handleBlur = () => { void commit(); };

  if (!col.editor) return null;

  const autoCommit = typeof col.autoCommitOnChange === 'function' ? (col.autoCommitOnChange as any)(row) : !!col.autoCommitOnChange;
  const commitOnceRef = React.useRef(false);

  const handleChange = React.useCallback((next: any) => {
    setVal(next);
    if (autoCommit && !always && !commitOnceRef.current) {
      commitOnceRef.current = true;
      void commitWithValue(next);
    }
  }, [autoCommit, always, commitWithValue]);

  return (
    <Box onKeyDown={handleKeyDown} sx={{ width: '100%' }}>
      {col.editor({ row, value: val, onChange: handleChange, commit: () => void commit(), cancel, autoFocus: !always && editingKey === key })}
    </Box>
  );
}

