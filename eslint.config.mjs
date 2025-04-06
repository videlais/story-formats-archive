// eslint.config.js
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import eslint from '@eslint/js';
import jest from 'eslint-plugin-jest';
import globals from "globals";

export default [
    {
        files: ["src/*.ts", "tests/*.test.ts"],
        plugins: {
            "@typescript-eslint": tsPlugin,
            "jest": jest,
        },
        languageOptions:{
            parser: tsParser,
            parserOptions: {
                project: './tsconfig.json'
            },
            globals: {
              ...globals.node,
              ...globals.jest,
            },
        },
        rules: {
            ...eslint.configs.recommended.rules,
            ...tsPlugin.configs.recommended.rules,
        },
    },
];