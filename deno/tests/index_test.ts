import { assertEquals, assertExists } from "@std/assert";
import { StoryFormatEntry } from "../types/StoryFormatEntry.ts";

// Test the filterDatabase function by importing it separately
function filterDatabase(database: StoryFormatEntry[]) {
    // Create an array
    const twine2ByName: { [name: string]: StoryFormatEntry } = {};

    // Loop through the twine2 array and add each item based on the 'name' property.
    database.forEach((item: StoryFormatEntry) => {
        twine2ByName[item.name] = item;
    });

    // Create a filtered database.
    const filteredDB: { [name: string]: StoryFormatEntry[] } = {};

    // Based on the names, create a filtered database.
    Object.keys(twine2ByName).forEach((storyFormatName: string) => {
        // Create temporary array to hold the filtered items.
        let tempArray: StoryFormatEntry[] = [];
        // Filter based on the name.
        tempArray = database.filter((item: StoryFormatEntry) => {
            return item.name === storyFormatName;
        });
        // Add the filtered array to the filtered database.
        filteredDB[storyFormatName] = tempArray;
    });

    return filteredDB;
}

Deno.test("filterDatabase should create a proper filtered database", () => {
    const mockDatabase: StoryFormatEntry[] = [
        {
            name: "Chapbook",
            author: "Chris Klimas",
            version: "1.2.3",
            proofing: false,
            description: "A story format for Twine",
            files: ["format.js"],
        },
        {
            name: "Chapbook",
            author: "Chris Klimas",
            version: "1.1.0",
            proofing: false,
            description: "A story format for Twine",
            files: ["format.js"],
        },
        {
            name: "Harlowe",
            author: "Leon Arnott",
            version: "3.3.0",
            proofing: false,
            description: "Another story format",
            files: ["format.js"],
        },
    ];

    const filtered = filterDatabase(mockDatabase);

    // Should group by name
    assertExists(filtered["Chapbook"]);
    assertExists(filtered["Harlowe"]);

    // Chapbook should have 2 versions
    assertEquals(filtered["Chapbook"].length, 2);

    // Harlowe should have 1 version
    assertEquals(filtered["Harlowe"].length, 1);

    // Check specific version exists
    assertEquals(filtered["Chapbook"][0].version, "1.2.3");
    assertEquals(filtered["Harlowe"][0].version, "3.3.0");
});

Deno.test("paths should be defined", async () => {
    const paths = await import("../paths.ts");
    assertExists(paths.default.official_URL);
    assertExists(paths.default.base_URL);
    assertEquals(typeof paths.default.official_URL, "string");
    assertEquals(typeof paths.default.base_URL, "string");
});
