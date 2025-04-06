import { FilteredDatabase } from '../types/FilteredDatabase.js';
import { ServerResponse } from '../types/ServerResponse.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import axios from 'axios';
import { resolve } from 'path';

const configPath = resolve(import.meta.dirname, '../../paths.json');
const paths = JSON.parse(readFileSync(configPath, 'utf-8'));

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
 * @param name 
 * @param version 
 * @returns 
 */
export async function getSpecificVersion(filteredDB:FilteredDatabase, name: string, version: string) {

    // Does 'name' exist in the database?
    if (!filteredDB[name]) {
        console.error(`❌ Story format ${name} not found.`);
        return;
    }

    let files:string[] = [];

    // Does 'version' exist for the specific 'name'?
    if (!filteredDB[name].some((item: { version: string; }) => item.version === version)) {
        console.error(`❌ Version ${version} for ${name} not found.`);
        return;
    } else {
        console.log(`✅ Found version ${version} for ${name}.`);
        // Get the files for the specific version.
        const format = filteredDB[name].find((item: { version: string; }) => item.version === version);
        if (format) {
            files = format.files;
        }
    }

    const dir:string = './story-formats';
    // Make the directory if it doesn't exist.
    makeDirectoryIfNotExists(dir);

    const dirName:string = `${dir}/${name}`;
    makeDirectoryIfNotExists(dirName);

    // Create a directory for the specific version.
    const versionDir:string = `${dirName}/${version}`;
    makeDirectoryIfNotExists(versionDir);

    // For each file, download it.
    for (const file of files) {
        // Define the file path and URL.
        const filePath:string = `${dirName}/${version}/${file}`;
        // Define the file URL.
        const fileURL:string = `${base_URL}/${name}/${version}/${file}`;
        // Download the file.
        const fileResponse:ServerResponse = await axios.get(fileURL, { responseType: 'arraybuffer' });
        // Convert the file response to a string.
        const fileData:string = (fileResponse.data as Buffer).toString();
        // Write the file to the file path.
        writeFileSync(filePath, fileData);
        // Show a message if the user is using the CLI.
        console.log(`\tDownloaded ${file} to ${filePath}`);
    }
}