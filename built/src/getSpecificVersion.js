import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import axios from 'axios';
import paths from './paths.js';
// Define the base URL.
const base_URL = paths.base_URL;
/**
 * Make a directory if it doesn't exist.
 * @param String dir Directory path.
 */
function makeDirectoryIfNotExists(dir) {
    // Does the directory exist?
    if (!existsSync(dir)) {
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
export async function getSpecificVersion(filteredDB, name, version) {
    // Does 'name' exist in the database?
    if (Object.prototype.hasOwnProperty.call(filteredDB, name) == false) {
        console.error(`❌ Story format ${name} not found.`);
        return;
    }
    let files = [];
    // Search for the specific version in the database.
    // 'filteredDB[name]' is an array of StoryFormatEntry objects.
    const format = filteredDB[name].find((item) => item.version === version);
    // Does 'version' exist for the specific 'name'?
    if (format === undefined) {
        console.error(`❌ Version ${version} for ${name} not found.`);
        return;
    }
    else {
        console.log(`✅ Found version ${version} for ${name}.`);
        files = format.files;
    }
    const dir = './story-formats';
    // Make the directory if it doesn't exist.
    makeDirectoryIfNotExists(dir);
    const dirName = `${dir}/${name}`;
    makeDirectoryIfNotExists(dirName);
    // Create a directory for the specific version.
    const versionDir = `${dirName}/${version}`;
    makeDirectoryIfNotExists(versionDir);
    // For each file, download it.
    for (const file of files) {
        // Define the file path and URL.
        const filePath = `${dirName}/${version}/${file}`;
        // Define the file URL.
        const fileURL = `${base_URL}/${name}/${version}/${file}`;
        // Download the file.
        const fileResponse = await axios.get(fileURL, { responseType: 'arraybuffer' });
        // Convert the file response to a string.
        const fileData = fileResponse.data.toString();
        // Write the file to the file path.
        writeFileSync(filePath, fileData);
        // Show a message if the user is using the CLI.
        console.log(`\tDownloaded ${file} to ${filePath}`);
    }
}
