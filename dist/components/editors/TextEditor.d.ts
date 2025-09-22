export type TextEditorProps = {
    value: unknown;
    onChange: (next: string) => void;
    onCommit?: () => void;
    onCancel?: () => void;
    autoFocus?: boolean;
};
export default function TextEditor({ value, onChange, onCommit, onCancel, autoFocus }: TextEditorProps): import("react/jsx-runtime").JSX.Element;
