import { StoryFormatEntry } from './StoryFormatEntry.js';

// Define an interface for the filtered database.
export interface FilteredDatabase {
    [name: string]: StoryFormatEntry[];
}