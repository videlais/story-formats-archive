import { jest } from '@jest/globals';
import { main, getLatestJSONDatabase, filterDatabase, processUserInput } from '../src/index.js';
import axios from 'axios';
import { select, input } from '@inquirer/prompts';
jest.mock('axios');
jest.mock('@inquirer/prompts', () => ({
    select: jest.fn(),
    input: jest.fn()
}));
const mockGetJSONDatabase = axios.get;
describe('main', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should fetch the latest JSON database and filter it', async () => {
        const mockDatabase = [
            { name: 'Format1', version: '1.0' },
            { name: 'Format2', version: '2.0' }
        ];
        mockGetJSONDatabase.mockResolvedValue({ data: { twine2: mockDatabase } });
        await main();
        expect(mockGetJSONDatabase).toHaveBeenCalledWith('https://videlais.github.io/story-formats-archive/official/index.json');
    });
    it('should handle errors when fetching the database', async () => {
        mockGetJSONDatabase.mockRejectedValue(new Error('Network error'));
        await expect(main()).rejects.toThrow('Network error');
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
        const mockDatabase = [
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
        const mockDatabase = [];
        const result = await filterDatabase(mockDatabase);
        expect(result).toEqual({});
    });
    it('should produce a console message when filtering the database', async () => {
        console.log = jest.fn();
        const mockDatabase = [
            { name: 'Format1', version: '1.0', author: 'Author1', proofing: false, description: 'Description1', files: [] },
            { name: 'Format2', version: '2.0', author: 'Author1', proofing: false, description: 'Description1', files: [] },
        ];
        await filterDatabase(mockDatabase);
        expect(console.log).toHaveBeenCalledWith('✅ Database fetched.');
    });
});
describe('processUserInput', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should produce error if story format name is not in database', async () => {
        const mockArgs = ['node', 'index.js', 'missing', 'latest'];
        process.argv = mockArgs;
        const filteredDatabase = {
            Format1: [{ name: 'Format1', version: '1.0', author: 'Author1', proofing: false, description: 'Description1', files: [] }],
            Format2: [{ name: 'Format2', version: '2.0', author: 'Author1', proofing: false, description: 'Description1', files: [] }]
        };
        console.error = jest.fn();
        await processUserInput(filteredDatabase);
        expect(console.error).toHaveBeenCalledWith('❌ Story format "missing" not found in the database.');
    });
    it('should call getLatestVersions if version is "latest"', async () => {
        const mockArgs = ['node', 'index.js', 'Format1', 'latest'];
        process.argv = mockArgs;
        const filteredDatabase = {
            Format1: [{ name: 'Format1', version: '1.0', author: 'Author1', proofing: false, description: 'Description1', files: [] }],
            Format2: [{ name: 'Format2', version: '2.0', author: 'Author1', proofing: false, description: 'Description1', files: [] }]
        };
        // Mock getLatestVersion function to avoid actual network calls.
        const getLatestVersionsMock = jest.spyOn(await import('../src/getLatestVersions.js'), 'getLatestVersions').mockResolvedValue(undefined);
        await processUserInput(filteredDatabase);
        expect(getLatestVersionsMock).toHaveBeenCalledWith(filteredDatabase, ['Format1']);
    });
    it('should call getSpecificVersion if version is not "latest"', async () => {
        const mockArgs = ['node', 'index.js', 'Format1', '1.0'];
        process.argv = mockArgs;
        const filteredDatabase = {
            Format1: [{ name: 'Format1', version: '1.0', author: 'Author1', proofing: false, description: 'Description1', files: [] }],
            Format2: [{ name: 'Format2', version: '2.0', author: 'Author1', proofing: false, description: 'Description1', files: [] }]
        };
        // Mock getSpecificVersion function to avoid actual network calls.
        const getSpecificVersionMock = jest.spyOn(await import('../src/getSpecificVersion.js'), 'getSpecificVersion').mockResolvedValue(undefined);
        await processUserInput(filteredDatabase);
        expect(getSpecificVersionMock).toHaveBeenCalledWith(filteredDatabase, 'Format1', '1.0');
    });
    it('should prompt user for selection if no CLI arguments are passed and process "latest"', async () => {
        process.argv = ['node', 'index.js'];
        const filteredDatabase = {
            Format1: [{ name: 'Format1', version: '1.0', author: 'Author1', proofing: false, description: 'Description1', files: [] }],
            Format2: [{ name: 'Format2', version: '2.0', author: 'Author1', proofing: false, description: 'Description1', files: [] }]
        };
        select.mockResolvedValue('latest');
        const getLatestVersionsMock = jest.spyOn(await import('../src/getLatestVersions.js'), 'getLatestVersions').mockResolvedValue(undefined);
        await processUserInput(filteredDatabase);
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
        expect(getLatestVersionsMock).toHaveBeenCalledWith(filteredDatabase, Object.keys(filteredDatabase));
    });
    it('should prompt user for selection if no CLI arguments are passed and process "specific"', async () => {
        process.argv = ['node', 'index.js'];
        const filteredDatabase = {
            Format1: [{ name: 'Format1', version: '1.0.0', author: 'Author1', proofing: false, description: 'Description1', files: [] }],
            Format2: [{ name: 'Format2', version: '2.0.0', author: 'Author1', proofing: false, description: 'Description1', files: [] }]
        };
        select.mockResolvedValue('specific');
        input.mockResolvedValueOnce('Format1');
        input.mockResolvedValueOnce('1.0.0');
        const getSpecificVersionMock = jest.spyOn(await import('../src/getSpecificVersion.js'), 'getSpecificVersion').mockResolvedValue(undefined);
        await processUserInput(filteredDatabase);
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
        expect(getSpecificVersionMock).toHaveBeenCalledTimes(1);
    });
});
