#! /usr/bin/env node

import { Command } from 'commander';
import { OfficialDatabase } from '../types/OfficialDatabase.js';
import { StoryFormatEntry } from '../types/StoryFormatEntry.js';
import { FilteredDatabase } from '../types/FilteredDatabase.js';
import { getJSONDatabase } from './getJSONDatabase.js';
import { getSpecificVersion } from './getSpecificVersion.js';
import { getLatestVersions } from './getLatestVersions.js';
import { verifyFormatVersion, verifyAllInstalledFiles, printVerificationResults } from './verifyFiles.js';

import { select, input } from '@inquirer/prompts';
import { AxiosResponse } from 'axios';
import { type DownloadOptions } from './downloadUtils.js';

import paths from './paths.js';

// Read package.json for version info
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Handle import.meta.url safely for both runtime and test environments
let packageJson: { version: string; name: string; description: string };
try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    packageJson = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8'));
} catch {
    // Fallback for test environments
    packageJson = { version: '1.1.0', name: 'sfa-get', description: 'SFA-Get retrieves story formats from the Story Format Archive' };
}

let program: Command;

// Create interface for array of Twine2 names.
interface Twine2ByName {
    [name: string]: StoryFormatEntry;
}

/**
 * Get the latest JSON database from the official URL.
 * This function fetches the latest JSON database from the official URL and returns the Twine2 array.
 * @returns Promise<StoryFormatEntry[]>
 */
async function getLatestJSONDatabase(): Promise<StoryFormatEntry[]> {
    // Show a message if the user is using the CLI.
    console.log('🌐 Fetching latest JSON database...');

    // Get the official database.
    const Official_URL = paths.official_URL;

    // Fetch the official database.
    const officialDatabasePromise:AxiosResponse = await getJSONDatabase(Official_URL);

    // Check if the response has a data property.
    if(Object.prototype.hasOwnProperty.call(officialDatabasePromise, 'data') === false) {
        throw new Error('❌ Official database response does not contain "data" property.');
    }

    // Get the official database from the response.
    const officialDatabase: OfficialDatabase = officialDatabasePromise.data as OfficialDatabase;

    // Check if the official database has the 'twine2' property.
    if (Object.prototype.hasOwnProperty.call(officialDatabase, 'twine2') == false) {
        throw new Error('❌ Official database does not contain "twine2" listing.');
    }

    // Get the twine2 array from the official database.
    return officialDatabase.twine2 as StoryFormatEntry[];
}

/**
 * Filter the database to create a filtered database based on the 'name' property.
 * @param database - The array of StoryFormatEntry objects to filter.
 * @returns Promise<FilteredDatabase>
 */
async function filterDatabase(database: StoryFormatEntry[]): Promise<FilteredDatabase> {
    // Create an array 
    const twine2ByName:Twine2ByName = {};

    // Loop through the twine2 array and add each item based on the 'name' property.
    database.forEach((item:StoryFormatEntry ) => {
        twine2ByName[item.name] = item;
    });

    // Create a filtered database.
    const filteredDB:FilteredDatabase = {};

    // Based on the names, create a filtered database.
    Object.keys(twine2ByName).forEach((storyFormatName:string) => {
        // Create temporary array to hold the filtered items.
        let tempArray:StoryFormatEntry[] = [];
        // Filter based on the name.
        tempArray = database.filter((item:StoryFormatEntry) => {
            return item.name === storyFormatName;
        });
        // Add the filtered array to the filtered database.
        filteredDB[storyFormatName] = tempArray;
    });

    // Show a message if the user is using the CLI.
    console.log('✅ Database fetched.');

    // Return the filtered database.
    return filteredDB;
}

/**
 * Run interactive mode when no specific command is provided
 */
async function runInteractiveMode(filteredDB: FilteredDatabase, options: DownloadOptions): Promise<void> {
    // Ask the user if they want to download the latest versions of all story formats or a specific version.
    const answer = await select({
        message: 'Select installation',
        choices: [
        {
            name: 'latest',
            value: 'latest',
            description: 'Download the latest versions of all story formats',
        },
        {
            name: 'specific',
            value: 'specific',
            description: 'Download a specific version of a story format',
        },
        ],
    });

    if (answer === 'latest') {
        // Get the latest versions of each story format.
        await getLatestVersions(filteredDB, Object.keys(filteredDB), options);
    } else if (answer === 'specific') {
        // Ask the user for the story format name.
        const formatName = await input({ message: 'Enter story format name:' });
        // Ask the user for the version.
        const version = await input({ message: 'Enter version:' });
        // Get the specific version of the story format.
        await getSpecificVersion(filteredDB, formatName, version, options);
    }
}

/**
 * Set up commander.js program with commands and options
 */
function setupProgram(): void {
    // Initialize the program
    program = new Command();
    
    // Set up commander.js program
    program
        .name('sfa-get')
        .description('SFA-Get retrieves story formats from the Story Format Archive')
        .version(packageJson.version)
        .option('-c, --concurrency <number>', 'Number of concurrent downloads', '3')
        .option('-r, --retries <number>', 'Number of retry attempts', '3')
        .option('-t, --timeout <number>', 'Timeout in milliseconds', '30000')
        .option('--no-progress', 'Disable progress indicators');

    // List available story formats command
    program
        .command('list')
        .alias('ls')
        .description('List all available story formats')
        .action(async () => {
            try {
                const { filteredDB } = await initializeDatabase();
                console.log('\n📋 Available Story Formats:');
                Object.keys(filteredDB).forEach(format => {
                    console.log(`  • ${format}`);
                });
            } catch (error) {
                console.error('❌ An error occurred:', (error as Error).message);
                process.exit(1);
            }
        });

    // Download latest versions command
    program
        .command('latest [formats...]')
        .description('Download the latest versions of story formats (all if no formats specified)')
        .action(async (formats: string[]) => {
            try {
                const downloadOptions: DownloadOptions = getDownloadOptions();
                const { filteredDB } = await initializeDatabase();
                const formatsToDownload = formats.length > 0 ? formats : Object.keys(filteredDB);
                await getLatestVersions(filteredDB, formatsToDownload, downloadOptions);
            } catch (error) {
                console.error('❌ An error occurred:', (error as Error).message);
                process.exit(1);
            }
        });

    // Download specific version command
    program
        .command('get <format> <version>')
        .description('Download a specific version of a story format')
        .action(async (format: string, version: string) => {
            try {
                const downloadOptions: DownloadOptions = getDownloadOptions();
                const { filteredDB } = await initializeDatabase();
                
                // Check if the format exists in the database
                if (!Object.prototype.hasOwnProperty.call(filteredDB, format)) {
                    console.error(`❌ Story format "${format}" not found in the database.`);
                    process.exit(1);
                }
                
                if (version === 'latest') {
                    await getLatestVersions(filteredDB, [format], downloadOptions);
                } else {
                    await getSpecificVersion(filteredDB, format, version, downloadOptions);
                }
            } catch (error) {
                console.error('❌ An error occurred:', (error as Error).message);
                process.exit(1);
            }
        });

    // Verify downloaded files command
    program
        .command('verify [format] [version]')
        .description('Verify downloaded files against checksums from the database')
        .action(async (format?: string, version?: string) => {
            try {
                const { filteredDB } = await initializeDatabase();
                
                if (format && version) {
                    // Verify specific format and version
                    const results = verifyFormatVersion(filteredDB, format, version);
                    printVerificationResults(results);
                } else if (format) {
                    // Verify all versions of a specific format
                    const allResults = verifyAllInstalledFiles(filteredDB);
                    const formatResults = allResults.filter(r => r.format === format);
                    
                    if (formatResults.length === 0) {
                        console.log(`❌ No installed files found for format "${format}"`);
                        process.exit(1);
                    }
                    
                    printVerificationResults(formatResults);
                } else {
                    // Verify all installed files
                    const results = verifyAllInstalledFiles(filteredDB);
                    
                    if (results.length === 0) {
                        console.log('❌ No installed story formats found in ./story-formats directory');
                        process.exit(1);
                    }
                    
                    printVerificationResults(results);
                }
            } catch (error) {
                console.error('❌ An error occurred:', (error as Error).message);
                process.exit(1);
            }
        });

    // If no command is provided, run in interactive mode
    if (process.argv.length === 2) {
        (async () => {
            try {
                const downloadOptions: DownloadOptions = getDownloadOptions();
                const { filteredDB } = await initializeDatabase();
                await runInteractiveMode(filteredDB, downloadOptions);
            } catch (error) {
                console.error('❌ An error occurred:', (error as Error).message);
                process.exit(1);
            }
        })();
    }
}



/**
 * Get download options from command line arguments
 */
function getDownloadOptions(programInstance?: Command): DownloadOptions {
    const opts = (programInstance || program).opts();
    return {
        concurrency: parseInt(opts.concurrency, 10),
        retries: parseInt(opts.retries, 10),
        timeout: parseInt(opts.timeout, 10),
        showProgress: opts.progress !== false
    };
}

/**
 * Initialize database by fetching and filtering
 */
async function initializeDatabase(): Promise<{ filteredDB: FilteredDatabase }> {
    const latestDatabase: StoryFormatEntry[] = await getLatestJSONDatabase();
    const filteredDB: FilteredDatabase = await filterDatabase(latestDatabase);
    return { filteredDB };
}

/**
 * Main function to execute the script.
 * This function sets up commander.js and processes arguments.
 * @returns Promise<void>
 */
async function main(): Promise<void> {
    setupProgram();
    program.parse();
}

// Only run main if this file is executed directly
// Use a more robust check that works in both Node.js and test environments  
const isMainModule = import.meta.url && process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
    main().catch((error: Error) => {
        console.error('❌ An error occurred:', error.message);
        process.exit(1);
    });
}

export { main, getLatestJSONDatabase, filterDatabase, runInteractiveMode, getDownloadOptions, setupProgram };
