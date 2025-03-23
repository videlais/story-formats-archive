import { makeDirectoryIfNotExists } from './makeDirectoryIfNotExists.js';
import { writeFileSync } from 'fs';
import axios from 'axios';
import { paths } from "./paths.js";
// Define the base URL.
const base_URL = paths.base_URL;
/**
 * Get a specific version of a story format.
 * @param name
 * @param version
 * @returns
 */
export async function getSpecificVersion(filteredDB, name, version) {
    // Does 'name' exist in the database?
    if (!filteredDB[name]) {
        console.error(`❌ Story format ${name} not found.`);
        return;
    }
    let files = [];
    // Does 'version' exist for the specific 'name'?
    if (!filteredDB[name].some((item) => item.version === version)) {
        console.error(`❌ Version ${version} for ${name} not found.`);
        return;
    }
    else {
        console.log(`✅ Found version ${version} for ${name}.`);
        // Get the files for the specific version.
        const format = filteredDB[name].find((item) => item.version === version);
        if (format) {
            files = format.files;
        }
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
//# sourceMappingURL=getSpecificVersion.js.map