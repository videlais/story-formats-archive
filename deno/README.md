# Story Formats Archive - Deno Version

This is a Deno-compatible version of the Story Formats Archive (SFA-Get) tool. SFA-Get retrieves story formats from the Story Format Archive for use with Twine.

## Prerequisites

- [Deno](https://deno.land/) v1.37 or later

## Installation

Clone the repository:

```bash
git clone https://github.com/videlais/story-formats-archive.git
cd story-formats-archive
```

## Usage

### Running the Application

```bash
# Interactive mode - prompts for user input
deno task start

# Or directly with deno run
deno run --allow-net --allow-read --allow-write deno/index.ts
```

### Command Line Arguments

```bash
# Get latest version of a specific story format
deno task start chapbook latest

# Get a specific version of a story format  
deno task start chapbook 1.2.3

# List installed story formats
deno task start -l
```

### Available Tasks

```bash
# Start the application
deno task start

# Run in development mode
deno task dev

# Run tests
deno task test

# Lint code
deno task lint

# Format code
deno task fmt
```

## Permissions

The application requires the following Deno permissions:

- `--allow-net`: To fetch story formats from the online archive
- `--allow-read`: To check for existing story format installations
- `--allow-write`: To download and save story format files

## Dependencies

- **axios**: HTTP client for making requests to the story format archive
- **@inquirer/prompts**: Interactive command line prompts
- **@std/fs**: Deno standard library for filesystem operations
- **@std/semver**: Deno standard library for semantic version comparison

## Differences from Node.js Version

- Uses Deno standard library modules instead of Node.js built-ins
- Replaces `process.argv` with `Deno.args`
- Uses `Deno.readDirSync` instead of Node's `readdirSync`
- Uses `Deno.writeTextFileSync` instead of Node's `writeFileSync`
- Uses `import.meta.main` for module entry point detection
- Updated shebang for Deno execution

## Project Structure

```text
deno/
├── index.ts              # Main entry point
├── checkInstalled.ts     # Check installed story formats
├── getJSONDatabase.ts    # Fetch database from archive
├── getLatestVersions.ts  # Download latest versions
├── getSpecificVersion.ts # Download specific versions
├── paths.ts              # URL configuration
├── types/               # TypeScript type definitions
│   ├── FilteredDatabase.ts
│   ├── OfficialDatabase.ts
│   ├── ServerResponse.ts
│   └── StoryFormatEntry.ts
└── tests/               # Test files
    └── index_test.ts
```

## Testing

Run the test suite:

```bash
deno task test
```

## License

MIT License - see the main project LICENSE file for details.
