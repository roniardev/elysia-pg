export const ULID_PATTERN = "^[0-9A-HJKMNP-TV-Z]{26}$"

export const ULID_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/

export function isUlid(value: string): boolean {
    return ULID_REGEX.test(value)
}
