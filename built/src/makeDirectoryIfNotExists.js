import { existsSync, mkdirSync } from 'node:fs';
/**
 * Make a directory if it doesn't exist.
 * @param dir
 */
export function makeDirectoryIfNotExists(dir) {
    // Does the directory exist?
    if (!existsSync(dir)) {
        // Create the directory.
        mkdirSync(dir);
    }
}
//# sourceMappingURL=makeDirectoryIfNotExists.js.map