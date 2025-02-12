export function capitalized(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function formatNumber(num: number, minDigits: number = 2): string {
  return num.toLocaleString(undefined, { minimumIntegerDigits: minDigits })
}
