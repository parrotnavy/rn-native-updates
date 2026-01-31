# Agents Guide for rn-native-updates

This file orients agentic coding tools to the repo's build, test, and style
conventions. It is scoped to this repository only.

## Source-of-truth Rules

- Cursor rules: none found (.cursor/rules/ or .cursorrules not present).
- Copilot rules: none found (.github/copilot-instructions.md not present).

## Project Layout

- Library source: src/
- Tests: src/__tests__
- Example apps: example-bare/ and example-expo/
- Build output: lib/ (from react-native-builder-bob)

## Build / Lint / Test Commands

Root package scripts (from package.json):
- Build: `npm run build` (bob build)
- Clean: `npm run clean`
- Typecheck: `npm run typecheck` (tsc --noEmit)
- Lint: `npm run lint` (biome lint .)
- Lint fix: `npm run lint:fix`
- Format: `npm run format` (biome format --write .)
- Check (Biome): `npm run check` (biome check src/)
- Test: `npm run test` (jest)
- Test coverage: `npm run test:coverage`

Single test execution (root):
- Jest pattern: `**/__tests__/**/*.test.ts?(x)` in `jest.config.js`.
- Run a single file: `npm run test -- src/__tests__/api.test.ts`
- Run a single test name: `npx jest -t "<test name>"`

Example app: bare React Native (example-bare/):
- Start Metro: `npm start`
- Run Android: `npm run android`
- Run iOS: `npm run ios`
- Lint: `npm run lint` (eslint .)
- Test: `npm run test` (jest)

Example app: Expo (example-expo/):
- Start: `npm run start`
- Run Android: `npm run android` (expo run:android)
- Run iOS: `npm run ios` (expo run:ios)
- Web: `npm run web` (expo start --web)

## Formatting and Linting

Primary formatter/linter is Biome for the library source:
- Indent: 2 spaces
- Line width: 100
- Quotes: single
- Trailing commas: all
- Semicolons: always
- Lint rules: recommended + noUnusedImports/noUnusedVariables are errors
- Naming convention rule: disabled in Biome

Biome is disabled for:
- example-bare/** and example-expo/**
- lib/, dist/, build/ output folders

Example-bare uses ESLint and Prettier:
- ESLint: extends @react-native
- Prettier: single quotes, trailing commas, bracketSameLine true,
  bracketSpacing false, arrowParens avoid

## TypeScript Rules

Strict TypeScript is enforced in the library:
- strict: true
- noUnusedLocals, noUnusedParameters
- noImplicitReturns, noFallthroughCasesInSwitch
- noUncheckedIndexedAccess
- verbatimModuleSyntax (use type-only imports)
- moduleResolution: bundler

Build-time TS:
- Declarations emitted to lib/typescript/
- src only; tests excluded

## Imports and Module Style

- Use ES module imports.
- Group imports with blank lines: external first, then local.
- Use type-only imports in-line: `import { type Foo } from './types'`.
- Respect verbatimModuleSyntax: avoid importing types as values.

## Naming Conventions

- Functions/variables: camelCase (getLatestVersion, isUpdateAvailable).
- Types/interfaces/classes: PascalCase (AppUpdateError, PlayStoreUpdateInfo).
- Enums: PascalCase with SCREAMING_SNAKE members
  (UpdateAvailability.UPDATE_AVAILABLE).

## Error Handling Patterns

- Public APIs throw AppUpdateError with AppUpdateErrorCode when failing.
- Unsupported platform paths throw AppUpdateError with code UNKNOWN.
- Hooks wrap unknown errors into AppUpdateError before storing or calling
  onError.
- Catch blocks may intentionally ignore errors only for safe fallback paths;
  otherwise report or wrap the error.

## React Hooks Patterns (library code)

- Use useCallback for async actions exposed by hooks.
- Track mounted state with refs to avoid setting state after unmount.
- Keep platform-specific logic behind Platform.OS checks.

## Testing Conventions

- Tests live in src/__tests__ and use *.test.ts(x).
- Use describe/it with clear behavior-oriented names.
- Jest setup in jest.setup.js and ts-jest transform in jest.config.js.

## Misc Notes

- Do not edit generated output in lib/.
- Expo/Bare example apps are not formatted by Biome; follow their local
  ESLint/Prettier configs if you touch those folders.
- Prefer minimal, focused changes; avoid refactors when fixing bugs.
