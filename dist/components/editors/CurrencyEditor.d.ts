export type CurrencyInputProps = {
    value: string | number | undefined;
    onChange: (next: string) => void;
    onCommit?: () => void;
    onCancel?: () => void;
    autoFocus?: boolean;
    locale?: string;
    currency?: string;
};
export default function CurrencyEditor({ value, onChange, onCommit, onCancel, autoFocus, locale, currency, }: CurrencyInputProps): import("react/jsx-runtime").JSX.Element;
