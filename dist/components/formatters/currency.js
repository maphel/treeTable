export function getCurrencyFormatter({ locale = "en-GB", currency = "GBP", minimumFractionDigits = 2, maximumFractionDigits = 2, currencyDisplay = "symbol" }) {
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits,
        maximumFractionDigits,
        currencyDisplay,
        useGrouping: true
    });
}
export function getLocaleSeparators(locale = "en-GB", currency = "GBP") {
    var _a, _b, _c;
    const formatter = getCurrencyFormatter({ locale, currency, currencyDisplay: "symbol" });
    const parts = formatter.formatToParts(1234.56);
    const group = ((_a = parts.find((p) => p.type === "group")) === null || _a === void 0 ? void 0 : _a.value) || ".";
    const decimal = ((_b = parts.find((p) => p.type === "decimal")) === null || _b === void 0 ? void 0 : _b.value) || ",";
    const currencySym = ((_c = parts.find((p) => p.type === "currency")) === null || _c === void 0 ? void 0 : _c.value) || "€";
    return { group, decimal, currencySym };
}
export function sanitizeCurrencyInput(raw, separators) {
    if (!raw)
        return "";
    const { decimal: dec, group: grp } = separators;
    const otherDec = dec === "." ? "," : ".";
    let s = raw
        .replace(/[\u00A0\u202F\s]/g, "")
        .replace(/\p{Sc}+/gu, "")
        .replace(/[A-Za-z]/g, "");
    // Handle decimal separator normalization
    if (!s.includes(dec) && s.includes(otherDec)) {
        const countOther = (s.match(new RegExp(`\\${otherDec}`, "g")) || [])
            .length;
        if (countOther === 1) {
            s = s.replace(otherDec, dec);
        }
    }
    // Remove unwanted characters
    const allowed = new RegExp(`[^0-9\\${grp}\\${dec}-]`, "g");
    s = s.replace(allowed, "");
    // Handle negative sign
    const negative = s.includes("-");
    s = s.replace(/-/g, "");
    if (negative)
        s = "-" + s;
    // Keep only first decimal separator
    const firstDec = s.indexOf(dec);
    if (firstDec !== -1) {
        const before = s.slice(0, firstDec + 1);
        const after = s
            .slice(firstDec + 1)
            .replace(new RegExp(`\\${dec}`, "g"), "");
        s = before + after;
    }
    return s;
}
export function formatCurrencyLive(raw, separators) {
    if (!raw)
        return "";
    const { decimal: dec, group: grp } = separators;
    const otherDec = dec === "." ? "," : ".";
    const trimmed = raw.trim();
    const typedDecimalAtEnd = trimmed.endsWith(dec) || trimmed.endsWith(otherDec);
    let s = sanitizeCurrencyInput(raw, separators);
    if (s === "-")
        return s;
    const negative = s.startsWith("-");
    if (negative)
        s = s.slice(1);
    if (s.startsWith(dec))
        s = "0" + s;
    const decIdx = s.indexOf(dec);
    let intPart = decIdx >= 0 ? s.slice(0, decIdx) : s;
    let fracPart = decIdx >= 0 ? s.slice(decIdx + 1) : "";
    // Clean and limit parts
    const rgGroup = new RegExp(`\\${grp}`, "g");
    intPart = intPart.replace(rgGroup, "").replace(/[^0-9]/g, "");
    fracPart = fracPart.replace(/[^0-9]/g, "");
    if (fracPart.length > 2)
        fracPart = fracPart.slice(0, 2);
    // Add thousands separators
    const rev = [...intPart].reverse().join("");
    const groupedRev = rev.replace(/(\d{3})(?=\d)/g, `$1${grp}`);
    const grouped = [...groupedRev].reverse().join("");
    let out;
    if (decIdx >= 0) {
        out =
            fracPart.length > 0
                ? `${grouped}${dec}${fracPart}`
                : typedDecimalAtEnd
                    ? `${grouped}${dec}`
                    : grouped;
    }
    else {
        out = grouped;
        if (/^[.,]$/.test(trimmed))
            out = `0${dec}`;
    }
    return negative ? `-${out}` : out;
}
export function formatCurrencyValue(value, locale = "en-GB", currency = "GBP") {
    const formatter = getCurrencyFormatter({ locale, currency, currencyDisplay: "narrowSymbol" });
    const parts = formatter.formatToParts(value);
    return parts
        .filter((p) => p.type !== "currency" && p.type !== "literal")
        .map((p) => p.value)
        .join("")
        .trim();
}
export function formatCurrency(value, { locale = "en-GB", currency = "GBP", minimumFractionDigits = 2, maximumFractionDigits = 2 } = {}) {
    const v = typeof value === "number" && Number.isFinite(value) ? value : 0;
    const formatter = getCurrencyFormatter({
        locale,
        currency,
        minimumFractionDigits,
        maximumFractionDigits,
        currencyDisplay: "symbol"
    });
    return formatter.format(v);
}
export function parseCurrency(input, { locale = "en-GB", currency = "GBP", } = {}) {
    if (typeof input === "number")
        return Number.isFinite(input) ? input : undefined;
    if (typeof input !== "string")
        return undefined;
    let s = input
        .replace(/\s/g, "")
        .replace(/[A-Za-z€$¥£₣₤₽₹₺₩₫₪฿₴₦₱₡₲₵₸₭]/g, "");
    const separators = getLocaleSeparators(locale, currency);
    const { decimal: decimalSep, group: groupSep } = separators;
    if (groupSep) {
        const reGroup = new RegExp(`\\${groupSep}`, "g");
        s = s.replace(reGroup, "");
    }
    if (decimalSep && decimalSep !== ".") {
        const reDec = new RegExp(`\\${decimalSep}`, "g");
        s = s.replace(reDec, ".");
    }
    s = s.replace(/(?!^-)[^0-9.]/g, "");
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : undefined;
}
