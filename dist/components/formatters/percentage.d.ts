export type PercentageSeparators = {
    group: string;
    decimal: string;
};
export declare function getLocaleSeparators(locale?: string): PercentageSeparators;
export declare function sanitizePercentInput(raw: string, separators: PercentageSeparators): string;
export declare function formatPercentLive(raw: string, separators: PercentageSeparators): string;
export declare function formatPercentValue(value: number, locale?: string): string;
export declare function parsePercent(input: unknown, locale?: string): number | undefined;
