import { resolve, sep } from 'node:path';

const paths = {
    "official_URL": "https://videlais.github.io/story-formats-archive/official/index.json",
    "base_URL": "https://raw.githubusercontent.com/videlais/story-formats-archive/refs/heads/docs/official/twine2"
};

/** Only allow safe characters in path components (format names, versions, filenames). */
const SAFE_PATH_COMPONENT = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

/**
 * Validate that a string is a safe filesystem path component.
 * Rejects empty strings, traversal patterns, and special characters.
 */
export function validatePathComponent(component: string): void {
    if (!component || !SAFE_PATH_COMPONENT.test(component)) {
        throw new Error('Invalid path component: contains disallowed characters');
    }
}

/**
 * Resolve a file path and ensure it is contained within the given base directory.
 * Prevents directory traversal attacks.
 */
export function ensureWithinBaseDir(filePath: string, baseDir: string): string {
    const resolvedBase = resolve(baseDir);
    const resolvedPath = resolve(filePath);
    if (resolvedPath !== resolvedBase && !resolvedPath.startsWith(resolvedBase + sep)) {
        throw new Error('Path traversal detected');
    }
    return resolvedPath;
}

export default paths;