# Deno Conversion Summary

This document summarizes the conversion of the Story Formats Archive project from Node.js to Deno.

## Files Created

### Core Deno Files

- `deno.json` - Deno configuration with tasks, import maps, and compiler options
- `deno/index.ts` - Main entry point converted for Deno
- `deno/checkInstalled.ts` - File system operations converted to Deno APIs
- `deno/getJSONDatabase.ts` - HTTP client functionality (unchanged from Node.js)
- `deno/getLatestVersions.ts` - Version management and file downloads for Deno
- `deno/getSpecificVersion.ts` - Specific version downloads for Deno
- `deno/paths.ts` - URL configuration (unchanged)

### Type Definitions

- `deno/types/FilteredDatabase.ts` - Interface for filtered database
- `deno/types/OfficialDatabase.ts` - Interface for official database structure
- `deno/types/ServerResponse.ts` - Interface for server responses
- `deno/types/StoryFormatEntry.ts` - Interface for story format entries

### Documentation & Testing

- `deno/README.md` - Comprehensive documentation for Deno version
- `deno/tests/index_test.ts` - Test suite using Deno's built-in testing
- `deno/install.ts` - Global installation script for the Deno version

## Key Changes Made

### 1. Import Statements

**Before (Node.js):**

```typescript
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import semver from 'semver';
```

**After (Deno):**

```typescript
import { existsSync } from "@std/fs";
import { gt, parse } from "@std/semver";
```

### 2. File System Operations

**Before (Node.js):**

```typescript
const entries = readdirSync(storyFormatsPath, { withFileTypes: true });
writeFileSync(filePath, fileData);
```

**After (Deno):**

```typescript
const entries = Array.from(Deno.readDirSync(storyFormatsPath));
Deno.writeTextFileSync(filePath, fileData);
```

### 3. Command Line Arguments

**Before (Node.js):**

```typescript
if (process.argv.length === 3) {
    const storyFormatName = process.argv[2];
}
```

**After (Deno):**

```typescript
if (Deno.args.length === 1) {
    const storyFormatName = Deno.args[0];
}
```

### 4. Process Control

**Before (Node.js):**

```typescript
process.exit();
```

**After (Deno):**

```typescript
Deno.exit(0);
```

### 5. Module Entry Point Detection

**Before (Node.js):**

```typescript
// Running directly via Node.js
```

**After (Deno):**

```typescript
if (import.meta.main) {
    // Only run if this is the main module
}
```

### 6. File Extensions in Imports

**Before (Node.js):**

```typescript
import { FilteredDatabase } from '../types/FilteredDatabase.js';
```

**After (Deno):**

```typescript
import { FilteredDatabase } from './types/FilteredDatabase.ts';
```

## Dependencies

### Retained from Node.js

- **axios** - HTTP client (via npm: compatibility)
- **@inquirer/prompts** - Interactive CLI prompts (via npm: compatibility)

### Replaced with Deno Standard Library

- **Node.js fs module** → `@std/fs`
- **semver package** → `@std/semver`
- **Jest testing** → Deno's built-in testing framework

## Configuration

### deno.json Features

- **Tasks**: Pre-configured commands for development, testing, linting
- **Import Maps**: Simplified imports using @std/ aliases
- **Compiler Options**: TypeScript configuration
- **Formatting Rules**: Code style enforcement

### Permissions Required

- `--allow-net`: For fetching story formats from remote archive
- `--allow-read`: For checking existing installations
- `--allow-write`: For downloading and saving files
- `--allow-env`: For terminal compatibility with inquirer prompts

## Usage Comparison

### Node.js Version

```bash
npx sfa-get
npx sfa-get chapbook latest
npx sfa-get -l
```

### Deno Version

```bash
deno task start
deno task start chapbook latest
deno task start -l

# Or directly
deno run --allow-net --allow-read --allow-write --allow-env deno/index.ts
```

## Benefits of Deno Version

1. **Security**: Explicit permissions for file system, network, and environment access
2. **Modern Runtime**: Built-in TypeScript support, ES modules, and web APIs
3. **No node_modules**: Dependencies are cached and versioned explicitly
4. **Standard Library**: Comprehensive standard library reduces external dependencies
5. **Built-in Tools**: Testing, linting, and formatting without additional packages

## Compatibility

The Deno version maintains full functional compatibility with the Node.js version:

- Same command-line interface
- Identical functionality for downloading story formats
- Same interactive prompts and user experience
- Compatible with all existing story format archives

## Testing

Both versions include comprehensive test suites:

- **Node.js**: Jest-based testing with mocking
- **Deno**: Built-in test runner with standard assertions

Run tests:

```bash
# Node.js
npm test

# Deno
deno task test
```
