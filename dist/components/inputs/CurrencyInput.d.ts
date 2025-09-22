export type CurrencyInputProps = {
    value: string | number | undefined;
    onChange: (next: string) => void;
    onCommit?: () => void;
    onCancel?: () => void;
    autoFocus?: boolean;
    locale?: string;
    currency?: string;
};
/**
 * Lightweight currency input with de-DE style live formatting
 * - Thousands separator while typing
 * - Decimal comma (",")
 * - Preserves caret around reformatting
 */
export default function CurrencyInput({ value, onChange, onCommit, onCancel, autoFocus, locale, currency, }: CurrencyInputProps): import("react/jsx-runtime").JSX.Element;
