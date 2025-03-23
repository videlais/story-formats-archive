import { FilteredDatabase } from '../types/FilteredDatabase.js';
/**
 * Get a specific version of a story format.
 * @param name
 * @param version
 * @returns
 */
export declare function getSpecificVersion(filteredDB: FilteredDatabase, name: string, version: string): Promise<void>;
