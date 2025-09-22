import * as React from 'react';
import TextField from '@mui/material/TextField';

export type NumberEditorProps = {
  value: unknown;
  onChange: (next: number | undefined) => void;
  onCommit?: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  step?: number;
  min?: number;
  max?: number;
};

export default function NumberEditor({ value, onChange, onCommit, onCancel, autoFocus, step, min, max }: NumberEditorProps) {
  const [text, setText] = React.useState(value == null ? '' : String(value));
  React.useEffect(() => { setText(value == null ? '' : String(value)); }, [value]);
  const parse = (s: string): number | undefined => {
    const n = parseFloat(s.replace(',', '.'));
    return Number.isFinite(n) ? n : undefined;
  };
  return (
    <TextField
      variant="standard"
      size="small"
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange(parse(e.target.value));
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); onCommit?.(); }
        if (e.key === 'Escape') { e.preventDefault(); onCancel?.(); }
      }}
      onBlur={() => onCommit?.()}
      autoFocus={autoFocus}
      inputProps={{ inputMode: 'decimal', step, min, max }}
      fullWidth
    />
  );
}

