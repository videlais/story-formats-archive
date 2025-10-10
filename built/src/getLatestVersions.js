import { existsSync, mkdirSync } from 'node:fs';
import semver from 'semver';
import { downloadFiles, createDownloadTasks } from './downloadUtils.js';
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
 * @param formats:string[]
 * @param options:DownloadOptions
 */
export async function getLatestVersions(filteredDB, formats, options = {}) {
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
    // Create download tasks for all files
    const allDownloadTasks = [];
    for (const key in latestVersions) {
        // Get the version for the specific story format.
        const version = latestVersions[key];
        // For every version, create a directory based on it.
        const versionDir = `${dir}/${key}/${version.version}`;
        makeDirectoryIfNotExists(versionDir);
        // Create download tasks for this format
        const formatTasks = createDownloadTasks(base_URL, key, version.version, version.files, dir);
        allDownloadTasks.push(...formatTasks);
    }
    // Download all files concurrently
    if (allDownloadTasks.length > 0) {
        const downloadResults = await downloadFiles(allDownloadTasks, options);
        // Log individual successful downloads
        const successful = downloadResults.filter(r => r.success);
        successful.forEach(result => {
            console.log(`\tDownloaded ${result.filePath.split('/').pop()} to ${result.filePath}`);
        });
    }
}
