export type TextEditorProps = {
    value: unknown;
    onChange: (next: string) => void;
    onCommit?: () => void;
    onCancel?: () => void;
    autoFocus?: boolean;
    size?: "small" | "medium";
};
export default function TextEditor({ value, onChange, onCommit, onCancel, autoFocus, size }: TextEditorProps): import("react/jsx-runtime").JSX.Element;
