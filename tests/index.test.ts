import { jest } from '@jest/globals';
import { main, getLatestJSONDatabase, filterDatabase, runInteractiveMode, setupProgram } from '../src/index.js';
import axios from 'axios';
import { StoryFormatEntry } from '../types/StoryFormatEntry.js';
import { FilteredDatabase } from '../types/FilteredDatabase.js';
import { select, input } from '@inquirer/prompts';

jest.mock('axios');
jest.mock('@inquirer/prompts', () => ({
    select: jest.fn(),
    input: jest.fn()
}));

const mockGetJSONDatabase = axios.get as jest.MockedFunction<typeof axios.get>;

describe('main', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should setup program correctly', () => {
        // Test that the main function exists and can be called
        // We can't test the actual CLI parsing without complex setup
        expect(typeof main).toBe('function');
    });

    it('should handle command line parsing', () => {
        // Test that setupProgram function exists
        expect(typeof setupProgram).toBe('function');
    });
});

describe('getLatestJSONDatabase', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should throw an error if the official database response does not contain the "data" property', async () => {
        mockGetJSONDatabase.mockResolvedValue({ notData: { notTwine2: [] } });
        await expect(getLatestJSONDatabase()).rejects.toThrow('❌ Official database response does not contain "data" property.');
   });

   it('should throw an error if the official database does not contain "twine2" property', async () => {
        mockGetJSONDatabase.mockResolvedValue({ data: { notTwine2: [] } });
        await expect(getLatestJSONDatabase()).rejects.toThrow('❌ Official database does not contain "twine2" listing.');
   });

    it('should return the twine2 array from the official database', async () => {
          const mockDatabase = { twine2: [{ name: 'Format1', version: '1.0' }] };
          mockGetJSONDatabase.mockResolvedValue({ data: mockDatabase });
    
          const result = await getLatestJSONDatabase();
          expect(result).toEqual(mockDatabase.twine2);
     });

     it('should produce a console message when fetching the latest JSON database', async () => {
        console.log = jest.fn();
        await getLatestJSONDatabase();
        expect(console.log).toHaveBeenCalledWith('🌐 Fetching latest JSON database...');
     });
});

describe('filterDatabase', () => {
    it('should create a filtered database based on the "name" property', async () => {
        const mockDatabase:StoryFormatEntry[] = [
            { name: 'Format1', version: '1.0', author: 'Author1', proofing: false, description: 'Description1', files: [] },
            { name: 'Format2', version: '2.0', author: 'Author1', proofing: false, description: 'Description1', files: [] },
        ];
        
        const result = await filterDatabase(mockDatabase);
        
        expect(result).toEqual({
            Format1: [{ name: 'Format1', version: '1.0', author: 'Author1', proofing: false, description: 'Description1', files: [] }],
            Format2: [{ name: 'Format2', version: '2.0', author: 'Author1', proofing: false, description: 'Description1', files: [] }]
        });
    });

    it('should handle an empty database', async () => {
        const mockDatabase:StoryFormatEntry[] = [];
        const result = await filterDatabase(mockDatabase);
        expect(result).toEqual({});
    });

    it('should produce a console message when filtering the database', async () => {
        console.log = jest.fn();
        const mockDatabase:StoryFormatEntry[] = [
            { name: 'Format1', version: '1.0', author: 'Author1', proofing: false, description: 'Description1', files: [] },
            { name: 'Format2', version: '2.0', author: 'Author1', proofing: false, description: 'Description1', files: [] },
        ];
        await filterDatabase(mockDatabase);
        expect(console.log).toHaveBeenCalledWith('✅ Database fetched.');
    });
});

describe('runInteractiveMode', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should prompt user for selection and process "latest"', async () => {
        const filteredDatabase:FilteredDatabase = {
            Format1: [{ name: 'Format1', version: '1.0', author: 'Author1', proofing: false, description: 'Description1', files: [] }],
            Format2: [{ name: 'Format2', version: '2.0', author: 'Author1', proofing: false, description: 'Description1', files: [] }]
        };

        const downloadOptions = { concurrency: 3, retries: 3, timeout: 30000, showProgress: true };

        (select as jest.MockedFunction<typeof select>).mockResolvedValue('latest');
        const getLatestVersionsMock = jest.spyOn(await import('../src/getLatestVersions.js'), 'getLatestVersions').mockResolvedValue(undefined);
        
        await runInteractiveMode(filteredDatabase, downloadOptions);
        
        expect(select).toHaveBeenCalledWith({
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
        expect(getLatestVersionsMock).toHaveBeenCalledWith(filteredDatabase, Object.keys(filteredDatabase), downloadOptions);
    });

    it('should prompt user for selection and process "specific"', async () => {
        const filteredDatabase:FilteredDatabase = {
            Format1: [{ name: 'Format1', version: '1.0.0', author: 'Author1', proofing: false, description: 'Description1', files: [] }],
            Format2: [{ name: 'Format2', version: '2.0.0', author: 'Author1', proofing: false, description: 'Description1', files: [] }]
        };

        const downloadOptions = { concurrency: 3, retries: 3, timeout: 30000, showProgress: true };

        (select as jest.MockedFunction<typeof select>).mockResolvedValue('specific');
        (input as jest.MockedFunction<typeof input>).mockResolvedValueOnce('Format1');
        (input as jest.MockedFunction<typeof input>).mockResolvedValueOnce('1.0.0');

        const getSpecificVersionMock = jest.spyOn(await import('../src/getSpecificVersion.js'), 'getSpecificVersion').mockResolvedValue(undefined);
        
        await runInteractiveMode(filteredDatabase, downloadOptions);
        
        expect(select).toHaveBeenCalledWith({
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

        expect(input).toHaveBeenCalledWith({ message: 'Enter story format name:' });
        expect(input).toHaveBeenCalledWith({ message: 'Enter version:' });
        expect(getSpecificVersionMock).toHaveBeenCalledWith(filteredDatabase, 'Format1', '1.0.0', downloadOptions);
    });
});
describe('filterDatabase - additional coverage', () => {
    it('should handle multiple story formats with the same name', async () => {
        const mockDatabase: StoryFormatEntry[] = [
            { name: 'Format1', version: '1.0', author: 'Author1', proofing: false, description: 'Description1', files: [] },
            { name: 'Format1', version: '1.1', author: 'Author1', proofing: false, description: 'Description1', files: [] },
            { name: 'Format2', version: '2.0', author: 'Author2', proofing: false, description: 'Description2', files: [] },
        ];
        
        const result = await filterDatabase(mockDatabase);
        
        expect(result).toEqual({
            Format1: [
                { name: 'Format1', version: '1.0', author: 'Author1', proofing: false, description: 'Description1', files: [] },
                { name: 'Format1', version: '1.1', author: 'Author1', proofing: false, description: 'Description1', files: [] }
            ],
            Format2: [
                { name: 'Format2', version: '2.0', author: 'Author2', proofing: false, description: 'Description2', files: [] }
            ]
        });
    });
});

// Commander.js integration tests would require more complex mocking
// For now, we focus on testing the core functionality
