export type NumberFormatOptions = {
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
};
export declare function formatNumber(value: number | undefined | null, { locale, minimumFractionDigits, maximumFractionDigits }?: NumberFormatOptions): string;
