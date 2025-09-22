export function formatCurrency(value, { locale = 'de-DE', currency = 'EUR', minimumFractionDigits = 2, maximumFractionDigits = 2 } = {}) {
    const v = typeof value === 'number' && Number.isFinite(value) ? value : 0;
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits,
        maximumFractionDigits,
    }).format(v);
}
/**
 * Parse a localized currency string to a number.
 * Accepts various currency symbols and both comma/dot decimals.
 */
export function parseCurrency(input) {
    if (typeof input === 'number')
        return Number.isFinite(input) ? input : undefined;
    if (typeof input !== 'string')
        return undefined;
    let s = input.replace(/\s/g, '').replace(/[A-Za-z€$¥£₣₤₽₹₺₩₫₪฿₴₦₱₡₲₵₸₭]/g, '');
    // Determine decimal separator from last occurrence of ',' or '.'
    const lastComma = s.lastIndexOf(',');
    const lastDot = s.lastIndexOf('.');
    let decimalSep = '';
    if (lastComma >= 0 || lastDot >= 0) {
        decimalSep = lastComma > lastDot ? ',' : '.';
    }
    // Remove all non-digits except the chosen decimalSep and leading '-'
    const re = new RegExp(`[^0-9${decimalSep ? '\\' + decimalSep : ''}-]`, 'g');
    s = s.replace(re, '');
    if (decimalSep)
        s = s.replace(decimalSep, '.');
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : undefined;
}
