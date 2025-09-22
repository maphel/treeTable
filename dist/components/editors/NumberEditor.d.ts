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
export default function NumberEditor({ value, onChange, onCommit, onCancel, autoFocus, step, min, max }: NumberEditorProps): import("react/jsx-runtime").JSX.Element;
