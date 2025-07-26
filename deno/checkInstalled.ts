import { existsSync } from "@std/fs";

/**
 * Checks if any story format files are installed using the following structure:
 * (A) `story-formats/format.js`, (B) `story-formats/<format-name>/format.js`, or
 * (C) `story-formats/<format-name>/<version>/format.js`.
 *
 * Attempts to read the "version" from the format.js file.
 *
 * @returns void
 */
export function checkInstalled(): void {
    // Check if the 'story-formats' directory exists in the current working directory.
    const storyFormatsPath = "./story-formats";

    if (!existsSync(storyFormatsPath)) {
        console.log("❌ There are no story formats installed.");
        return;
    }

    // For every directory in 'story-formats', check if it contains a file with ".js" extension.
    // Alternatively, if it contain one or more directories as version numbers.
    const entries = Array.from(Deno.readDirSync(storyFormatsPath));

    const installedFormats: string[] = [];

    // Search through "./story-formats" directory.
    // For every entry in the directory, check if it is a file or a directory.
    //
    // In rare cases, story-formats may contain a format.js file.
    // In most cases, story-formats will contain directories with the name of the format.
    // Each directory will contain a format.js file, which contains the version of the format.
    entries.forEach((entry): void => {
        // Is this a file?
        if (entry.isFile && entry.name == "format.js") {
            // Based on its path, read the file and check for a version.
            const filePath: string = `${storyFormatsPath}/${entry.name}`;
            // Check the version of the format.
            const version: string = checkVersionOfFormat(filePath);
            // If a version was found, add it to the list.
            // If no version was found, skip the file.
            if (version != "") {
                installedFormats.push(`${entry.name} (version: ${version})`);
            }
        }

        // Is this a directory?
        if (entry.isDirectory) {
            // Create the path to the subdirectory.
            const subDirPath: string = `${storyFormatsPath}/${entry.name}`;
            // Read the entries in the subdirectory.
            const subEntries = Array.from(Deno.readDirSync(subDirPath));
            // Once we have found a story format, stop processing the subdirectory.
            let foundFormat: boolean = false;

            // For every entry in the subdirectory, check if it is "format.js".
            subEntries.forEach((subEntry): void => {
                if (subEntry.isFile && subEntry.name == "format.js") {
                    const filePath: string = `${subDirPath}/${subEntry.name}`;
                    const version: string = checkVersionOfFormat(filePath);
                    if (version != "") {
                        installedFormats.push(`${entry.name} (version: ${version})`);
                        foundFormat = true;
                    }
                }

                // The most common case is the pattern of story-formats/<format-name>/<version>/format.js.
                // Process the subdirectory only if a format was not found yet.
                if (!foundFormat && subEntry.isDirectory) {
                    const versionPath: string = `${subDirPath}/${subEntry.name}/format.js`;
                    const version: string = checkVersionOfFormat(versionPath);
                    if (version != "") {
                        installedFormats.push(`${entry.name} (version: ${version})`);
                        foundFormat = true;
                    }
                }
            });
        }
    });

    // If there are no installed story formats, show a message.
    // Otherwise, show the list of installed story formats.
    if (installedFormats.length === 0) {
        console.log("❌ There are no story formats installed.");
    } else {
        installedFormats.forEach((format) => console.log(`\t${format}`));
    }
}

function checkVersionOfFormat(path: string): string {
    let result: string = "";

    // Check if the path exists.
    if (existsSync(path)) {
        // Read the file.
        const fileContent = Deno.readTextFileSync(path);
        // Check for a string matching the pattern "version": "x.x.x".
        const versionMatch = fileContent.match(/"version":\s*"([^"]+)"/);
        // If a match is found, return the version.
        if (versionMatch && versionMatch[1]) {
            result = versionMatch[1];
        }
    }

    // Return an empty string if no version is found.
    return result;
}
