export function formatNumber(value, { locale = "en-GB", minimumFractionDigits = 0, maximumFractionDigits = 2 } = {}) {
    const v = typeof value === "number" && Number.isFinite(value) ? value : 0;
    return new Intl.NumberFormat(locale, {
        minimumFractionDigits,
        maximumFractionDigits
    }).format(v);
}
