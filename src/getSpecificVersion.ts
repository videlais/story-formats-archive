import { FilteredDatabase } from '../types/FilteredDatabase.js';
import { existsSync, mkdirSync } from 'node:fs';
import { downloadFiles, createDownloadTasks, type DownloadOptions } from './downloadUtils.js';

import paths from './paths.js';
import { StoryFormatEntry } from '../types/StoryFormatEntry.js';

// Define the base URL.
const base_URL = paths.base_URL;

/**
 * Make a directory if it doesn't exist.
 * @param String dir Directory path.
 */
function makeDirectoryIfNotExists(dir: string) {
    // Does the directory exist?
    if (!existsSync(dir)){
        // Create the directory.
        mkdirSync(dir);
    }
}

/**
 * Get a specific version of a story format.
 * @param filteredDB:FilteredDatabase
 * @param name:string
 * @param version:string
 * @param options:DownloadOptions
 * @returns 
 */
export async function getSpecificVersion(
    filteredDB:FilteredDatabase, 
    name: string, 
    version: string, 
    options: DownloadOptions = {}
) {

    // Does 'name' exist in the database?
    if (Object.prototype.hasOwnProperty.call(filteredDB, name) == false) {
        console.error(`❌ Story format ${name} not found.`);
        return;
    }

    let files:string[] = [];

    // Search for the specific version in the database.
    // 'filteredDB[name]' is an array of StoryFormatEntry objects.
    const format:StoryFormatEntry|undefined = filteredDB[name].find((item: { version: string; }) => item.version === version);

    // Does 'version' exist for the specific 'name'?
    if (format === undefined) {
        console.error(`❌ Version ${version} for ${name} not found.`);
        return;
    } else {
        console.log(`✅ Found version ${version} for ${name}.`);
        files = format.files;
    }

    const dir:string = './story-formats';
    // Make the directory if it doesn't exist.
    makeDirectoryIfNotExists(dir);

    const dirName:string = `${dir}/${name}`;
    makeDirectoryIfNotExists(dirName);

    // Create a directory for the specific version.
    const versionDir:string = `${dirName}/${version}`;
    makeDirectoryIfNotExists(versionDir);

    // Create download tasks for all files
    const downloadTasks = createDownloadTasks(
        base_URL,
        name,
        version,
        files,
        './story-formats'
    );

    // Download all files concurrently
    if (downloadTasks.length > 0) {
        const downloadResults = await downloadFiles(downloadTasks, options);
        
        // Log individual successful downloads
        const successful = downloadResults.filter(r => r.success);
        successful.forEach(result => {
            console.log(`\tDownloaded ${result.filePath.split('/').pop()} to ${result.filePath}`);
        });
    }
}