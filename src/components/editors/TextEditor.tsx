import * as React from 'react';
import TextField from '@mui/material/TextField';

export type TextEditorProps = {
  value: unknown;
  onChange: (next: string) => void;
  onCommit?: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
};

export default function TextEditor({ value, onChange, onCommit, onCancel, autoFocus }: TextEditorProps) {
  const ref = React.useRef<HTMLInputElement | null>(null);
  React.useEffect(() => {
    if (autoFocus && ref.current) {
      try { ref.current.select(); } catch {}
    }
  }, [autoFocus]);

  return (
    <TextField
      variant="standard"
      size="small"
      value={typeof value === 'string' ? value : (value ?? '')}
      inputRef={ref}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); onCommit?.(); }
        if (e.key === 'Escape') { e.preventDefault(); onCancel?.(); }
      }}
      onBlur={() => onCommit?.()}
      autoFocus={autoFocus}
      fullWidth
    />
  );
}

