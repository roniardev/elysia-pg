import stylistic from "@stylistic/eslint-plugin"
import lowComplexity from "eslint-plugin-low-complexity"
import essential from "eslint-plugin-essential"
import tseslint from "@typescript-eslint/eslint-plugin"
import tsparser from "@typescript-eslint/parser"
import globals from "globals"

export default [
    {
        ignores: [
            "node_modules/",
            "dist/",
            "logs/",
            "docs/",
            "db/migrations/",
            ".delta/",
            "schema.svg",
            "schema.dbml",
            "bun.lock",
        ],
    },
    {
        files: ["**/*.ts", "**/*.tsx"],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
            },
            globals: {
                ...globals.node,
                ...globals.bun,
            },
        },
        plugins: {
            "@stylistic": stylistic,
            "@typescript-eslint": tseslint,
            "eslint-plugin-low-complexity": lowComplexity,
            "eslint-plugin-essential": essential,
        },
        rules: {
            // Core style (ported from Biome)
            "no-ternary": "error",
            "no-nested-ternary": "error",
            "no-multi-assign": "error",
            "no-multi-str": "error",
            "no-return-assign": "error",
            "no-bitwise": "error",
            "no-alert": "error",
            "no-debugger": "error",
            "no-eq-null": "error",
            "no-console": ["error", { allow: ["warn", "error"] }],
            "no-multiple-empty-lines": ["error", { max: 1, maxBOF: 0, maxEOF: 0 }],
            "max-classes-per-file": ["error", 1],
            "arrow-body-style": ["error", "as-needed"],
            "func-style": ["error", "declaration", { allowArrowFunctions: true }],

            "eslint-plugin-essential/no-else": "error",
            "eslint-plugin-essential/max-alternative-conditions": ["error", { maxElseIf: 0 }],
            "eslint-plugin-essential/max-nested-loops": ["error", { maxDepth: 1 }],
            "eslint-plugin-essential/max-nested-conditions": ["error", { maxDepth: 1 }],

            // Low complexity
            "eslint-plugin-low-complexity/jsx-naming-convention": "off",
            "eslint-plugin-low-complexity/jsx-function-naming-convention": "off",

            // TypeScript
            "@typescript-eslint/naming-convention": [
                "error",
                {
                    selector: "variable",
                    modifiers: ["const"],
                    format: ["camelCase", "PascalCase", "UPPER_CASE"],
                },
                {
                    selector: "typeLike",
                    format: ["PascalCase"],
                },
                {
                    selector: "function",
                    format: ["camelCase"],
                },
                {
                    selector: "import",
                    format: ["camelCase", "PascalCase"],
                },
                {
                    selector: "enumMember",
                    format: ["PascalCase", "UPPER_CASE"],
                },
            ],

            // Stylistic (Biome parity: 4-space indent, double quotes, no semicolons)
            "@stylistic/indent": ["error", 4],
            "@stylistic/quotes": ["error", "double"],
            "@stylistic/semi": ["error", "never"],
            "@stylistic/comma-spacing": ["error", { before: false, after: true }],
            "@stylistic/key-spacing": ["error"],
            "@stylistic/space-before-blocks": "error",
            "@stylistic/space-before-function-paren": [
                "error",
                { anonymous: "always", named: "never", asyncArrow: "always", catch: "always" },
            ],
            "@stylistic/space-infix-ops": "error",
            "@stylistic/no-multi-spaces": "error",
            "@stylistic/no-trailing-spaces": "error",
            "@stylistic/object-curly-spacing": ["error", "always", { objectsInObjects: false }],
        },
    },
    // CLI entry points, seeds, utils, and tests may use console.log
    {
        files: [
            "app/**/*.ts",
            "db/**/*.ts",
            "utils/**/*.ts",
            "test/**/*.ts",
            "drizzle.config.ts",
        ],
        rules: {
            "no-console": "off",
        },
    },
]
