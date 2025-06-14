import axios from 'axios';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import semver from 'semver';
import paths from './paths.js';
// Define the base URL.
const base_URL = paths.base_URL;
function makeDirectoryIfNotExists(dir) {
    // Does the directory exist?
    if (!existsSync(dir)) {
        // Create the directory.
        mkdirSync(dir);
    }
}
/**
 * Get the latest versions of each story format.
 * @param filteredDB:FilteredDatabase
 */
export async function getLatestVersions(filteredDB, formats) {
    // Get the latest version of each story format.
    let latestVersions = Object.keys(filteredDB).reduce((acc, key) => {
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
            return semver.gt(current.version, latest.version) ? current : latest;
        });
        // Add the latest version to the accumulator.
        acc[key] = latestVersion;
        // Return the accumulator.
        return acc;
    }, {});
    // If latestVersions is empty, show an error message and return.
    if (Object.keys(latestVersions).length === 0) {
        console.error('❌ No story formats found in the database.');
        return;
    }
    const dir = './story-formats';
    makeDirectoryIfNotExists(dir);
    // Filter latestVersions based on the formats array.
    latestVersions = Object.keys(latestVersions).reduce((acc, key) => {
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
            const filePath = `./story-formats/${key}/${version.version}/${file}`;
            // Define the file URL.
            const fileURL = `${base_URL}/${key}/${version.version}/${file}`;
            // Download the file data
            const fileResponse = await axios.get(fileURL, { responseType: 'arraybuffer' });
            // Write the file to disk
            writeFileSync(filePath, fileResponse.data.toString());
            // Log the download.
            console.log(`\tDownloaded ${file} to ${filePath}`);
        }
    }
}
