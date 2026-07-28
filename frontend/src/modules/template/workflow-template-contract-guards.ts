export type JsonRecord = Record<string, unknown>


export function assertRecord(value: unknown, label: string): JsonRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`)
  }
  return value as JsonRecord
}

export function assertKeys(
  value: JsonRecord,
  required: readonly string[],
  optional: readonly string[] = [],
  label = 'object',
): void {
  const allowed = new Set([...required, ...optional])
  const missing = required.filter((key) => !(key in value))
  const unknown = Object.keys(value).filter((key) => !allowed.has(key))
  if (missing.length || unknown.length) {
    throw new TypeError(`${label} has missing or unsupported fields`)
  }
}

export function assertString(
  value: unknown,
  label: string,
  pattern?: RegExp,
): asserts value is string {
  if (typeof value !== 'string' || value.trim() === '' || (pattern && !pattern.test(value))) {
    throw new TypeError(`${label} must be a valid string`)
  }
}

export function assertInteger(
  value: unknown,
  label: string,
  minimum = Number.MIN_SAFE_INTEGER,
  maximum = Number.MAX_SAFE_INTEGER,
): asserts value is number {
  if (!Number.isSafeInteger(value) || (value as number) < minimum || (value as number) > maximum) {
    throw new TypeError(`${label} must be a bounded safe integer`)
  }
}

export function assertStringArray(
  value: unknown,
  label: string,
  minimum = 0,
  maximum = 500,
): asserts value is string[] {
  if (
    !Array.isArray(value)
    || value.length < minimum
    || value.length > maximum
    || value.some((item) => typeof item !== 'string' || item.trim() === '')
  ) {
    throw new TypeError(`${label} must be a bounded string array`)
  }
}

export function assertEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  label: string,
): asserts value is T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw new TypeError(`${label} is unsupported`)
  }
}

export function assertNoLoneSurrogates(value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1)
      if (next < 0xdc00 || next > 0xdfff) {
        throw new TypeError('canonical JSON rejects lone surrogate code points')
      }
      index += 1
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      throw new TypeError('canonical JSON rejects lone surrogate code points')
    }
  }
}
