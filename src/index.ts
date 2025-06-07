#! /usr/bin/env node

import { OfficialDatabase } from '../types/OfficialDatabase.js';
import { StoryFormatEntry } from '../types/StoryFormatEntry.js';
import { FilteredDatabase } from '../types/FilteredDatabase.js';
import { getJSONDatabase } from './getJSONDatabase.js';
import { getSpecificVersion } from './getSpecificVersion.js';
import { getLatestVersions } from './getLatestVersions.js';
import { checkInstalled } from './checkInstalled.js';
import { select, input } from '@inquirer/prompts';
import { AxiosResponse } from 'axios';

import paths from './paths.js';

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
 * Process user input to either get the latest versions of all story formats or a specific version of a story format.
 * This function checks if any CLI arguments were passed, and if so, it processes them accordingly.
 * If no CLI arguments were passed, it prompts the user to select an option.
 * If the user selects to get the latest versions, it fetches the latest versions of all story formats.
 * If the user selects to get a specific version, it prompts the user for the story format name and version, and then fetches that specific version.
 * @param filteredDB - The filtered database to process user input against.
 */
async function processUserInput(filteredDB:FilteredDatabase): Promise<void> {
    // Check if a single CLI argument was passed.
    if (process.argv.length === 3) {
        // Check if the first argument is "-l" for the "list" command.
        if (process.argv[2] === '-l') {
            // Show the list of installed story formats.
            console.log('📜 Installed story formats:');
            checkInstalled();
            return;
        }
    }

    // Check if any CLI arguments were passed.
    if (process.argv.length > 2) {
        // Get the story format name from the CLI arguments.
        const storyFormatName = process.argv[2];
        // Get the version from the CLI arguments.
        const version = process.argv[3];

        // Check if the passed name exists in the filtered database.
        const nameIsInDatabase = Object.prototype.hasOwnProperty.call(filteredDB, storyFormatName);

        // If the name is not in the database, show an error message and return.
        if (nameIsInDatabase == false) {
            console.error(`❌ Story format "${storyFormatName}" not found in the database.`);
            return;
        }

        // Is version "latest"?
        if (version === 'latest') {
            // Get the latest version of the story format.
            await getLatestVersions(filteredDB, [storyFormatName]);
        }
        else {
            // Get the specific version of the story format.
            await getSpecificVersion(filteredDB, storyFormatName, version);
        }
        
    } else {
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
            await getLatestVersions(filteredDB, Object.keys(filteredDB));
        } else if (answer === 'specific') {
            // Ask the user for the story format name.
            const answer = await input({ message: 'Enter story format name:' });
            // Ask the user for the version.
            const version = await input({ message: 'Enter version:' });
            // Get the specific version of the story format.
            await getSpecificVersion(filteredDB, answer, version);
        }
    }
}

/**
 * Main function to execute the script.
 * This function fetches the latest JSON database, filters it, and processes user input.
 * It handles errors and exits the process gracefully.
 * @returns Promise<void>
 */
async function main(): Promise<void> {
    // Get the latest JSON database.
    const latestDatabase: StoryFormatEntry[] = await getLatestJSONDatabase();

    // Filter the database.
    const filteredDB: FilteredDatabase = await filterDatabase(latestDatabase);

    // Process user input.
    await processUserInput(filteredDB);
}

main()
    .then(() => {
        // Exit the process.
        //process.exit();
    })
    .catch((error: Error) => {
        // Log the error.
        console.error('❌ An error occurred:', error.message);
        // Exit the process with an error code.
    });


export { main, getLatestJSONDatabase, filterDatabase, processUserInput };
