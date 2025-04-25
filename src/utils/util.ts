export function getDomain(url: string): string {
  // Remove protocol and 'www.'
  url = url.replace(/(https?:\/\/)?(www\.)?/i, '')

  // Remove any path after the domain
  if (url.indexOf('/') !== -1) {
    return url.split('/')[0]
  }

  return url.toLowerCase()
}

export function isPrimitive(value: unknown): boolean {
  const type = typeof value
  return (
    value === null ||
    type === 'string' ||
    type === 'number' ||
    type === 'boolean' ||
    type === 'undefined' ||
    type === 'symbol' ||
    type === 'bigint'
  )
}
