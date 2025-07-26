import { StoryFormatEntry } from "./StoryFormatEntry.ts";

// Define an interface for the filtered database.
export interface FilteredDatabase {
    [name: string]: StoryFormatEntry[];
}
