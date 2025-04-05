#! /usr/bin/env node

import { OfficialDatabase } from '../types/OfficialDatabase';
import { StoryFormatEntry } from '../types/StoryFormatEntry';
import { FilteredDatabase } from '../types/FilteredDatabase';
import { getJSONDatabase } from './getJSONDatabase';
import { getSpecificVersion } from './getSpecificVersion';
import { getLatestVersions } from './getLatestVersions';
import { paths } from "./paths";
import { select, input } from '@inquirer/prompts';
import { AxiosResponse } from 'axios';

// Show a message if the user is using the CLI.
console.log('🌐 Fetching latest JSON database...');

// Get the official database.
const Official_URL = paths.official_URL;

// Fetch the official database.
const officialDatabasePromise:AxiosResponse = await getJSONDatabase(Official_URL);

// Get the official database from the response.
const officialDatabase: OfficialDatabase = officialDatabasePromise.data as OfficialDatabase;

// Get the twine2 array from the official database.
const twine2:StoryFormatEntry[] = officialDatabase.twine2;

// At this point, we don't know how many story format names we might have.
// We need to iterate through the array and create an object that uses the name as the key.
// This will allow us to quickly look up a story format by name.

// Create interface for array of Twine2 names.
interface Twine2ByName {
    [name: string]: StoryFormatEntry;
}

// Create an array 
const twine2ByName:Twine2ByName = {};

// Loop through the twine2 array and add each item based on the 'name' property.
twine2.forEach((item:StoryFormatEntry ) => {
    twine2ByName[item.name] = item;
});

// Create a filtered database.
const filteredDB:FilteredDatabase = {};

// Based on the names, create a filtered database.
Object.keys(twine2ByName).forEach((storyFormatName:string) => {
    // Create temporary array to hold the filtered items.
    let tempArray:StoryFormatEntry[] = [];
    // Filter based on the name.
    tempArray = twine2.filter((item:StoryFormatEntry) => {
        return item.name === storyFormatName;
    });
    // Add the filtered array to the filtered database.
    filteredDB[storyFormatName] = tempArray;
});

// Show a message if the user is using the CLI.
console.log('✅ Database fetched.');

// Check if any CLI arguments were passed.
if (process.argv.length > 2) {
    // Get the story format name from the CLI arguments.
    const storyFormatName = process.argv[2];
    // Get the version from the CLI arguments.
    const version = process.argv[3];
    // Check if the story format name exists in the filtered database.
    if (filteredDB[storyFormatName]) {
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
        // Show an error message if the story format name doesn't exist.
        console.error('❌ Story format not found.');
    }
    // Exit the process.
    process.exit();
}

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
