// Type: Type definition
export interface StoryFormatEntry {
    name: string;
    author: string;
    version: string;
    proofing: boolean;
    description: string;
    files: string[];
    checksums?: { [filename: string]: string };
}