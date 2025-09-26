export type CurrencyFormatOptions = {
    locale?: string
    currency?: string
    minimumFractionDigits?: number
    maximumFractionDigits?: number
}

export type CurrencySeparators = {
    group: string
    decimal: string
    currencySym: string
}

export function getCurrencyFormatter({
    locale = "en-GB",
    currency = "GBP",
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    currencyDisplay = "symbol"
}: CurrencyFormatOptions & { currencyDisplay?: "symbol" | "narrowSymbol" | "code" | "name" }) {
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits,
        maximumFractionDigits,
        currencyDisplay,
        useGrouping: true
    })
}

export function getLocaleSeparators(
    locale: string = "en-GB",
    currency: string = "GBP"
): CurrencySeparators {
    const formatter = getCurrencyFormatter({ locale, currency, currencyDisplay: "symbol" })
    const parts = formatter.formatToParts(1234.56)
    const group = parts.find((p) => p.type === "group")?.value || "."
    const decimal = parts.find((p) => p.type === "decimal")?.value || ","
    const currencySym = parts.find((p) => p.type === "currency")?.value || "€"

    return { group, decimal, currencySym }
}

export function sanitizeCurrencyInput(
    raw: string,
    separators: CurrencySeparators
): string {
    if (!raw) return ""

    const { decimal: dec, group: grp } = separators
    const otherDec = dec === "." ? "," : "."

    let s = raw
        .replace(/[\u00A0\u202F\s]/g, "")
        .replace(/\p{Sc}+/gu, "")
        .replace(/[A-Za-z]/g, "")

    if (!s.includes(dec) && s.includes(otherDec)) {
        const countOther = (s.match(new RegExp(`\\${otherDec}`, "g")) || [])
            .length
        if (countOther === 1) {
            s = s.replace(otherDec, dec)
        }
    }

    const allowed = new RegExp(`[^0-9\\${grp}\\${dec}-]`, "g")
    s = s.replace(allowed, "")

    const negative = s.includes("-")
    s = s.replace(/-/g, "")
    if (negative) s = "-" + s

    const firstDec = s.indexOf(dec)
    if (firstDec !== -1) {
        const before = s.slice(0, firstDec + 1)
        const after = s
            .slice(firstDec + 1)
            .replace(new RegExp(`\\${dec}`, "g"), "")
        s = before + after
    }

    return s
}

export function formatCurrencyLive(
    raw: string,
    separators: CurrencySeparators
): string {
    if (!raw) return ""

    const { decimal: dec, group: grp } = separators
    const otherDec = dec === "." ? "," : "."

    const trimmed = raw.trim()
    const typedDecimalAtEnd =
        trimmed.endsWith(dec) || trimmed.endsWith(otherDec)

    let s = sanitizeCurrencyInput(raw, separators)

    if (s === "-") return s

    const negative = s.startsWith("-")
    if (negative) s = s.slice(1)

    if (s.startsWith(dec)) s = "0" + s

    const decIdx = s.indexOf(dec)
    let intPart = decIdx >= 0 ? s.slice(0, decIdx) : s
    let fracPart = decIdx >= 0 ? s.slice(decIdx + 1) : ""

    const rgGroup = new RegExp(`\\${grp}`, "g")
    intPart = intPart.replace(rgGroup, "").replace(/[^0-9]/g, "")
    fracPart = fracPart.replace(/[^0-9]/g, "")
    if (fracPart.length > 2) fracPart = fracPart.slice(0, 2)

    const rev = [...intPart].reverse().join("")
    const groupedRev = rev.replace(/(\d{3})(?=\d)/g, `$1${grp}`)
    const grouped = [...groupedRev].reverse().join("")

    let out: string
    if (decIdx >= 0) {
        out =
            fracPart.length > 0
                ? `${grouped}${dec}${fracPart}`
                : typedDecimalAtEnd
                ? `${grouped}${dec}`
                : grouped
    } else {
        out = grouped
        if (/^[.,]$/.test(trimmed)) out = `0${dec}`
    }

    return negative ? `-${out}` : out
}

export function formatCurrencyValue(
    value: number,
    locale: string = "en-GB",
    currency: string = "GBP"
): string {
    const formatter = getCurrencyFormatter({ locale, currency, currencyDisplay: "narrowSymbol" })
    const parts = formatter.formatToParts(value)
    return parts
        .filter((p) => p.type !== "currency" && p.type !== "literal")
        .map((p) => p.value)
        .join("")
        .trim()
}

export function formatCurrency(
    value: number | undefined | null,
    {
        locale = "en-GB",
        currency = "GBP",
        minimumFractionDigits = 2,
        maximumFractionDigits = 2
    }: CurrencyFormatOptions = {}
): string {
    const v = typeof value === "number" && Number.isFinite(value) ? value : 0
    const formatter = getCurrencyFormatter({
        locale,
        currency,
        minimumFractionDigits,
        maximumFractionDigits,
        currencyDisplay: "symbol"
    })
    return formatter.format(v)
}

export function parseCurrency(input: unknown, locale?: string, currency?: string): number | undefined
export function parseCurrency(
    input: unknown,
    options?: CurrencyFormatOptions
): number | undefined
export function parseCurrency(
    input: unknown,
    localeOrOptions?: string | CurrencyFormatOptions,
    currencyMaybe?: string
): number | undefined {
    let locale = "en-GB"
    let currency = "GBP"
    if (typeof localeOrOptions === "string") {
        if (localeOrOptions) locale = localeOrOptions
        if (currencyMaybe) currency = currencyMaybe
    } else if (localeOrOptions && typeof localeOrOptions === "object") {
        if (localeOrOptions.locale) locale = localeOrOptions.locale
        if (localeOrOptions.currency) currency = localeOrOptions.currency
    }
    if (typeof input === "number")
        return Number.isFinite(input) ? input : undefined
    if (typeof input !== "string") return undefined
    let s = input
        .replace(/\s/g, "")
        .replace(/[A-Za-z€$¥£₣₤₽₹₺₩₫₪฿₴₦₱₡₲₵₸₭]/g, "")

    const separators = getLocaleSeparators(locale, currency)
    const { decimal: decimalSep, group: groupSep } = separators

    if (groupSep) {
        const reGroup = new RegExp(`\\${groupSep}`, "g")
        s = s.replace(reGroup, "")
    }
    if (decimalSep && decimalSep !== ".") {
        const reDec = new RegExp(`\\${decimalSep}`, "g")
        s = s.replace(reDec, ".")
    }
    s = s.replace(/(?!^-)[^0-9.]/g, "")
    const n = parseFloat(s)
    return Number.isFinite(n) ? n : undefined
}
