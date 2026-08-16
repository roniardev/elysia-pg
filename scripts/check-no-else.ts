/**
 * check-no-else.ts — bans `else` / `else if` statements (Raya house style).
 *
 * Biome has no rule that forbids `else` (its noUselessElse only catches
 * `else` after a returning `if`). This script is the hard ban: early
 * returns / guard clauses only, no else branches.
 *
 * Usage: bun ./scripts/check-no-else.ts [paths...]   (default: repo dirs)
 * Exit 0 when clean, 1 with a report when `else` tokens are found.
 *
 * Known limitation: regex literals are NOT masked. A pattern such as
 * `/else/` in code is a false positive — the tokenizer only masks
 * comments and string literals.
 */

import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, resolve } from "node:path"

const DEFAULT_ROOTS = ["app", "common", "db", "src", "test"]

function walk(target: string, out: string[]): void {
    const stat = statSync(target)
    if (stat.isDirectory()) {
        for (const entry of readdirSync(target)) {
            walk(join(target, entry), out)
        }
        return
    }
    if (target.endsWith(".ts")) {
        out.push(target)
    }
}

/**
 * Mask comments and string literals with spaces (same length, same newlines)
 * so `else` inside prose, comments, or text is never a false positive.
 */
function maskLiterals(code: string): string {
    let out = ""
    let i = 0
    const n = code.length

    const mask = (count: number): void => {
        out += " ".repeat(count)
    }

    const maskChar = (ch: string | undefined): string => {
        if (ch === "\n") {
            return "\n"
        }
        return " "
    }

    while (i < n) {
        const c = code[i]
        const next = code[i + 1]

        if (c === "/" && next === "/") {
            while (i < n && code[i] !== "\n") {
                out += " "
                i++
            }
            continue
        }

        if (c === "/" && next === "*") {
            mask(2)
            i += 2
            while (i < n && !(code[i] === "*" && code[i + 1] === "/")) {
                out += maskChar(code[i])
                i++
            }
            if (i < n) {
                mask(2)
                i += 2
            }
            continue
        }

        if (c === '"' || c === "'" || c === "`") {
            const quote = c
            out += quote
            i++
            while (i < n) {
                const ch = code[i]
                if (ch === "\\") {
                    mask(2)
                    i += 2
                    continue
                }
                if (ch === quote) {
                    out += quote
                    i++
                    break
                }
                out += maskChar(ch)
                i++
            }
            continue
        }

        out += c
        i++
    }
    return out
}

const roots = process.argv.slice(2).filter((arg) => !arg.startsWith("-"))
let targets = roots
if (roots.length === 0) {
    targets = DEFAULT_ROOTS
}
const files: string[] = []
for (const root of targets) {
    walk(resolve(root), files)
}

const ELSE_TOKEN = /\belse\b/g
const violations: Array<{ file: string; line: number; code: string }> = []

for (const file of files) {
    const code = readFileSync(file, "utf8")
    const masked = maskLiterals(code)
    for (const match of masked.matchAll(ELSE_TOKEN)) {
        const line = code.slice(0, match.index).split("\n").length
        const lineText = code.split("\n")[line - 1]?.trim() ?? ""
        violations.push({ file, line, code: lineText })
    }
}

if (violations.length > 0) {
    console.error(
        "check-no-else: found `else` statements (use early returns / guard clauses):",
    )
    for (const v of violations) {
        console.error(`  ${v.file}:${v.line}: ${v.code}`)
    }
    process.exit(1)
}

console.log(`check-no-else: OK (${files.length} files, no \`else\` statements)`)
