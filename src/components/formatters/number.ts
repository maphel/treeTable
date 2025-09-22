export type NumberFormatOptions = {
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

export function formatNumber(
  value: number | undefined | null,
  { locale = 'de-DE', minimumFractionDigits = 0, maximumFractionDigits = 2 }: NumberFormatOptions = {}
): string {
  const v = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(v);
}

