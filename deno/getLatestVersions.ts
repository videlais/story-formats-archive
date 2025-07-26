import { FilteredDatabase } from "./types/FilteredDatabase.ts";
import { ServerResponse } from "./types/ServerResponse.ts";
import { StoryFormatEntry } from "./types/StoryFormatEntry.ts";
import axios from "axios";
import { existsSync } from "@std/fs";
import { gt, parse } from "@std/semver";

import paths from "./paths.ts";

// Define the base URL.
const base_URL = paths.base_URL;

function makeDirectoryIfNotExists(dir: string) {
    // Does the directory exist?
    if (!existsSync(dir)) {
        // Create the directory.
        Deno.mkdirSync(dir);
    }
}

/**
 * Get the latest versions of each story format.
 * @param filteredDB:FilteredDatabase
 */
export async function getLatestVersions(filteredDB: FilteredDatabase, formats: string[]): Promise<void> {
    // Get the latest version of each story format.
    let latestVersions = Object.keys(filteredDB).reduce((acc: { [key: string]: StoryFormatEntry }, key) => {
        // Get the versions for the specific story format.
        const versions = filteredDB[key];

        // If there are no versions, skip this key.
        if (versions.length === 0) {
            console.warn(`⚠️ No versions found for story format: ${key}`);
            return acc;
        }

        // Get the latest version.
        const latestVersion = versions.reduce((latest, current) => {
            // Compare the versions.
            // Use semver to compare for better version handling.
            return gt(parse(current.version), parse(latest.version)) ? current : latest;
        });
        // Add the latest version to the accumulator.
        acc[key] = latestVersion;
        // Return the accumulator.
        return acc;
    }, {});

    // If latestVersions is empty, show an error message and return.
    if (Object.keys(latestVersions).length === 0) {
        console.error("❌ No story formats found in the database.");
        return;
    }

    const dir = "./story-formats";
    makeDirectoryIfNotExists(dir);

    // Filter latestVersions based on the formats array.
    latestVersions = Object.keys(latestVersions).reduce((acc: { [key: string]: StoryFormatEntry }, key) => {
        if (formats.includes(key)) {
            acc[key] = latestVersions[key];
        }
        return acc;
    }, {});

    // For each key, create a directory with the name of the story format.
    for (const key in latestVersions) {
        const dirName = `${dir}/${key}`;
        makeDirectoryIfNotExists(dirName);
    }

    // For each key in latestVersion, download every file listed in the 'files' array.
    for (const key in latestVersions) {
        // Get the version for the specific story format.
        const version = latestVersions[key];

        // Get the files for the specific
        const files = version.files;

        // For every version, create a directory based on it.
        const versionDir = `${dir}/${key}/${version.version}`;

        // Make the directory if it doesn't exist.
        makeDirectoryIfNotExists(versionDir);

        for (const file of files) {
            // Define the file path and URL.
            const filePath: string = `./story-formats/${key}/${version.version}/${file}`;
            // Define the file URL.
            const fileURL: string = `${base_URL}/${key}/${version.version}/${file}`;
            // Download the file data
            const fileResponse: ServerResponse = await axios.get(fileURL, { responseType: "arraybuffer" });
            // Write the file to disk
            const decoder = new TextDecoder();
            const content = decoder.decode(fileResponse.data as ArrayBuffer);
            Deno.writeTextFileSync(filePath, content);
            // Log the download.
            console.log(`\tDownloaded ${file} to ${filePath}`);
        }
    }
}
