# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.3] - 2026-1-1

### Changed

- Updated dependencies

## [1.3.2] - 2025-11-07

### Added

- Snowman 1.5.0 to official story formats
- Snowman 2.1.1 to official story formats

### Changed

- Updated dependencies

## [1.3.0] - 2025-10-10

### Added

- SHA256 hash verification for downloaded files
- Concurrency support for file downloads
- File verification support (`verifyFiles` module)
- SHA256 hashes for all story format files in database

### Changed

- Updated axios from 1.11.0 to 1.12.0
- Updated various development dependencies
- CI scripts and actions fixes

## [1.0.1] - 2025-09-05

### Changed

- Updated @jest/globals from 30.0.5 to 30.1.2
- Updated @inquirer/prompts from 7.7.1 to 7.8.0
- Updated axios from 1.10.0 to 1.11.0
- Updated form-data from 4.0.2 to 4.0.4
- Updated @eslint/js from 9.29.0 to 9.30.0
- Updated eslint from 9.29.0 to 9.30.0
- Updated @types/node from 24.0.3 to 24.0.8
- Updated typescript-eslint from 8.34.0 to 8.34.1
- Updated @typescript-eslint/parser from 8.34.0 to 8.34.1
- Fixed single test issue
- Slowed down dependabot updates

## [1.0.0] - 2025-07-15

### Added

- CLI `-l` flag for listing available formats
- Additional comprehensive tests
- Full test coverage for specific version functionality

### Changed

- Code cleanup and refactoring
- Updated dependencies:
  - @babel/core from 7.27.1 to 7.27.4
  - @typescript-eslint/parser from 8.32.1 to 8.33.0
  - @typescript-eslint/eslint-plugin from 8.32.1 to 8.33.0
  - eslint-plugin-jest from 28.11.0 to 28.12.0
  - @eslint/js from 9.27.0 to 9.28.0
  - globals from 16.1.0 to 16.2.0
  - @types/node from 22.15.17 to 22.15.21
  - @inquirer/prompts from 7.5.1 to 7.5.3
  - typescript-eslint from 8.31.1 to 8.32.1
  - @inquirer/testing from 2.1.46 to 2.1.47
  - ts-jest from 29.3.2 to 29.3.4
  - eslint from 9.26.0 to 9.27.0
  - @babel/preset-env from 7.27.1 to 7.27.2

### Removed

- Experimental Deno support

## [0.8.1] - 2025-06-03

### Fixed

- Path data handling issue

### Changed

- Updated README documentation
- Updated dependencies:
  - eslint from 9.25.1 to 9.26.0
  - @babel/preset-typescript from 7.27.0 to 7.27.1
  - @babel/core from 7.26.10 to 7.27.1
  - @babel/preset-env from 7.26.9 to 7.27.1
  - typescript-eslint from 8.30.1 to 8.31.0
  - @inquirer/prompts from 7.4.1 to 7.5.0
  - axios from 1.8.4 to 1.9.0
  - @typescript-eslint/eslint-plugin from 8.30.1 to 8.31.0
  - @types/node from 22.14.1 to 22.15.2
  - @typescript-eslint/parser from 8.30.0 to 8.30.1
  - typescript-eslint from 8.29.1 to 8.30.1
  - @eslint/js from 9.24.0 to 9.25.0
  - @typescript-eslint/eslint-plugin from 8.29.0 to 8.29.1
  - @typescript-eslint/parser from 8.29.0 to 8.29.1
  - ts-jest from 29.3.1 to 29.3.2
  - @types/node from 22.14.0 to 22.14.1

## [0.7.2] - 2025-05-20

### Added

- Additional testing coverage

### Changed

- Build process now cleans before building
- Re-configured testing setup
- Updated dependencies:
  - ts-jest from 29.2.6 to 29.3.0
  - typescript-eslint from 8.27.0 to 8.28.0
  - @types/node from 22.13.11 to 22.13.14

## [0.7.0] - 2025-05-15

### Added

- Command line arguments support
- Dependabot configuration for automated dependency updates

### Changed

- Initial structure for CLI argument parsing

## [0.6.0] - Initial Release

### Added

- Initial release of sfa-get
- Download story formats from Story Format Archive
- Support for official and unofficial story formats
- Basic CLI functionality
- TypeScript implementation
- Jest testing framework
- ESLint configuration
- Database JSON structure for story formats
