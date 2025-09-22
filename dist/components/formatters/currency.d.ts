export type CurrencyFormatOptions = {
    locale?: string;
    currency?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
};
export declare function formatCurrency(value: number | undefined | null, { locale, currency, minimumFractionDigits, maximumFractionDigits }?: CurrencyFormatOptions): string;
/**
 * Parse a localized currency string to a number.
 * Accepts various currency symbols and both comma/dot decimals.
 */
export declare function parseCurrency(input: unknown): number | undefined;
