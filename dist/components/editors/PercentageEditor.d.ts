export type PercentageEditorProps = {
    value: number | undefined;
    onChange: (next: number | undefined) => void;
    onCommit?: () => void;
    onCancel?: () => void;
    autoFocus?: boolean;
    min?: number;
    max?: number;
    step?: number;
    locale?: string;
    size?: "small" | "medium";
};
export default function PercentageEditor({ value, onChange, onCommit, onCancel, autoFocus, min, max, step, locale, size }: PercentageEditorProps): import("react/jsx-runtime").JSX.Element;
