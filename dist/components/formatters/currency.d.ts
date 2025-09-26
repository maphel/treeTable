export type CurrencyFormatOptions = {
    locale?: string;
    currency?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
};
export type CurrencySeparators = {
    group: string;
    decimal: string;
    currencySym: string;
};
export declare function getCurrencyFormatter({ locale, currency, minimumFractionDigits, maximumFractionDigits, currencyDisplay }: CurrencyFormatOptions & {
    currencyDisplay?: "symbol" | "narrowSymbol" | "code" | "name";
}): Intl.NumberFormat;
export declare function getLocaleSeparators(locale?: string, currency?: string): CurrencySeparators;
export declare function sanitizeCurrencyInput(raw: string, separators: CurrencySeparators): string;
export declare function formatCurrencyLive(raw: string, separators: CurrencySeparators): string;
export declare function formatCurrencyValue(value: number, locale?: string, currency?: string): string;
export declare function formatCurrency(value: number | undefined | null, { locale, currency, minimumFractionDigits, maximumFractionDigits }?: CurrencyFormatOptions): string;
export declare function parseCurrency(input: unknown, { locale, currency, }?: CurrencyFormatOptions): number | undefined;
