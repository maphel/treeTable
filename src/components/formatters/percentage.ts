export type PercentageSeparators = {
    group: string
    decimal: string
}

export function getLocaleSeparators(
    locale: string = "en-GB"
): PercentageSeparators {
    const formatter = new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })

    const parts = formatter.formatToParts(1234.56)
    const group = parts.find((p) => p.type === "group")?.value || "."
    const decimal = parts.find((p) => p.type === "decimal")?.value || ","

    return { group, decimal }
}

export function sanitizePercentInput(
    raw: string,
    separators: PercentageSeparators
): string {
    if (!raw) return ""

    const { decimal: dec } = separators
    const otherDec = dec === "." ? "," : "."

    let s = raw
        .replace(/[\u00A0\u202F\s]/g, "")
        .replace(/%/g, "")
        .replace(/[A-Za-z]/g, "")

    if (!s.includes(dec) && s.includes(otherDec)) {
        const countOther = (s.match(new RegExp(`\\${otherDec}`, "g")) || [])
            .length
        if (countOther === 1) {
            s = s.replace(otherDec, dec)
        }
    }

    const allowed = new RegExp(`[^0-9\\${dec}-]`, "g")
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

export function formatPercentLive(
    raw: string,
    separators: PercentageSeparators
): string {
    if (!raw) return ""

    const { decimal: dec } = separators
    const otherDec = dec === "." ? "," : "."

    const trimmed = raw.trim()
    const typedDecimalAtEnd =
        trimmed.endsWith(dec) || trimmed.endsWith(otherDec)

    let s = sanitizePercentInput(raw, separators)

    if (s === "-") return s

    const negative = s.startsWith("-")
    if (negative) s = s.slice(1)

    if (s.startsWith(dec)) s = "0" + s

    const decIdx = s.indexOf(dec)
    let intPart = decIdx >= 0 ? s.slice(0, decIdx) : s
    let fracPart = decIdx >= 0 ? s.slice(decIdx + 1) : ""

    intPart = intPart.replace(/[^0-9]/g, "")
    fracPart = fracPart.replace(/[^0-9]/g, "")

    let out: string
    if (decIdx >= 0) {
        out =
            fracPart.length > 0
                ? `${intPart}${dec}${fracPart}`
                : typedDecimalAtEnd
                ? `${intPart}${dec}`
                : intPart
    } else {
        out = intPart
        if (/^[.,]$/.test(trimmed)) out = `0${dec}`
    }

    return negative ? `-${out}` : out
}

export function formatPercentValue(
    value: number,
    locale: string = "en-GB"
): string {
    const formatter = new Intl.NumberFormat(locale, {
        style: "decimal",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    })
    return formatter.format(value)
}

export function parsePercent(
    input: unknown,
    locale?: string
): number | undefined {
    if (typeof input === "number")
        return Number.isFinite(input) ? input : undefined
    if (typeof input !== "string") return undefined
    let s = input.replace(/\s/g, "").replace(/%/g, "")

    let decimalSep = ""
    if (locale) {
        const parts = new Intl.NumberFormat(locale).formatToParts(123.4)
        for (const part of parts) {
            if (part.type === "decimal") decimalSep = part.value
        }
    }
    if (!decimalSep) {
        const lastComma = s.lastIndexOf(",")
        const lastDot = s.lastIndexOf(".")
        if (lastComma >= 0 || lastDot >= 0) {
            decimalSep = lastComma > lastDot ? "," : "."
        }
    }

    if (decimalSep && decimalSep !== ".") {
        const reDec = new RegExp(`\\${decimalSep}`, "g")
        s = s.replace(reDec, ".")
    }
    s = s.replace(/(?!^-)[^0-9.]/g, "")
    const n = parseFloat(s)
    return Number.isFinite(n) ? n : undefined
}
