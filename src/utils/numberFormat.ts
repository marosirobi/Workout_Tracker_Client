const formatters = new Map<string, Intl.NumberFormat>();

function getFormatter(
  locale: string,
  minDigits: number,
  maxDigits: number,
): Intl.NumberFormat {
  const key = `${locale}|${minDigits}|${maxDigits}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: minDigits,
      maximumFractionDigits: maxDigits,
    });
    formatters.set(key, formatter);
  }
  return formatter;
}

export function formatInteger(value: number, locale: string): string {
  return getFormatter(locale, 0, 0).format(Math.round(value));
}

export function formatDecimal(
  value: number,
  locale: string,
  digits: number,
  fixed = true,
): string {
  return getFormatter(locale, fixed ? digits : 0, digits).format(value);
}

export function decimalSeparator(locale: string): string {
  return getFormatter(locale, 1, 1).format(1.5).replace(/\d/g, "");
}
