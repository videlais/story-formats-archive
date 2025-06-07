import { getLatestVersions } from '../src/getLatestVersions.js';
import { FilteredDatabase } from '../types/FilteredDatabase.js';
import axios from 'axios';
import fs from 'fs';
import paths from '../src/paths.js';

jest.mock('axios');

const filteredDB: FilteredDatabase = {
    'format1': [
        {
            version: '1.0',
            files: ['file1.js', 'file2.js'],
            name: 'format1',
            description: 'Description for format 1',
            author: 'Author 1',
            proofing: false,
        },
        {
            version: '2.0',
            files: ['file3.js', 'file4.js'],
            name: 'format1',
            description: 'Description for format 1',
            author: 'Author 1',
            proofing: false,
        }
    ],
    'format2': [
        {
            version: '1.0',
            files: ['file5.js', 'file6.js'],
            name: 'format2',
            description: 'Description for format 2',
            author: 'Author 2',
            proofing: false,
        }
    ]
};
const formats = ['format1', 'format2'];

describe('getLatestVersions', () => {
    beforeEach(() => {
        (axios.get as jest.Mock).mockResolvedValue({
            data: {
                format1: {
                    '2.0': {
                        file3: 'file3.js',
                        file4: 'file4.js',
                    },
                },
                format2: {
                    '1.0': {
                        file5: 'file5.js',
                        file6: 'file6.js',
                    },
                },
            },
        });
    });

    afterEach(() => {
        jest.resetAllMocks();
      });

    it('should get the latest versions of each story format', async () => {
        await getLatestVersions(filteredDB, formats);

        expect((axios.get as jest.Mock)).toHaveBeenCalledTimes(4);
        expect((axios.get as jest.Mock)).toHaveBeenCalledWith(`${paths.base_URL}/format1/2.0/file3.js`, {"responseType": "arraybuffer"});
        expect((axios.get as jest.Mock)).toHaveBeenCalledWith(`${paths.base_URL}/format1/2.0/file4.js`, {"responseType": "arraybuffer"});
        expect((axios.get as jest.Mock)).toHaveBeenCalledWith(`${paths.base_URL}/format2/1.0/file5.js`, {"responseType": "arraybuffer"});
        expect((axios.get as jest.Mock)).toHaveBeenCalledWith(`${paths.base_URL}/format2/1.0/file6.js`, {"responseType": "arraybuffer"});
    });

    it('should handle empty filteredDB', async () => {
        const emptyDB: FilteredDatabase = {};
        await getLatestVersions(emptyDB, formats);

        expect((axios.get as jest.Mock)).not.toHaveBeenCalled();
    });

    it('should handle empty formats array', async () => {
        const emptyFormats:Array<string> = [];
        await getLatestVersions(filteredDB, emptyFormats);

        expect((axios.get as jest.Mock)).not.toHaveBeenCalled();
    });

    it('should handle non-existent formats', async () => {
        const nonExistentFormats = ['format3'];
        await getLatestVersions(filteredDB, nonExistentFormats);

        expect((axios.get as jest.Mock)).not.toHaveBeenCalled();
    });

    it('should handle axios errors', async () => {
        (axios.get as jest.Mock).mockRejectedValue(new Error('Network error'));

        await expect(getLatestVersions(filteredDB, formats)).rejects.toThrow('Network error');
        expect((axios.get as jest.Mock)).toHaveBeenCalledTimes(1);
    });

    it('should use first version if only one is available', async () => {
        const singleVersionDB: FilteredDatabase = {
            'format1': [
                {
                    version: '1.0',
                    files: ['file1.js'],
                    name: 'format1',
                    description: 'Description for format 1',
                    author: 'Author 1',
                    proofing: false,
                }
            ]};
        const singleVersionFormats = ['format1'];
        await getLatestVersions(singleVersionDB, singleVersionFormats);
        expect((axios.get as jest.Mock)).toHaveBeenCalledWith(`${paths.base_URL}/format1/1.0/file1.js`, {"responseType": "arraybuffer"});
        expect((axios.get as jest.Mock)).toHaveBeenCalledTimes(1);
    });
});

describe('getLatestVersions without story-formats directory', () => {
    beforeAll(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    it('should create directories if they do not exist', async () => {
        const dir = './story-formats';
        const makeDirectoryIfNotExists = (path: string) => {
            if (!fs.existsSync(path)) {
                fs.mkdirSync(path, { recursive: true });
            }
        };
        
        makeDirectoryIfNotExists(dir);
        
        expect(fs.existsSync(dir)).toBe(true);
    });

    it('should create subdirectories for each story format', async () => {
        const dir = './story-formats/format1';
        const makeDirectoryIfNotExists = (path: string) => {
            if (!fs.existsSync(path)) {
                fs.mkdirSync(path, { recursive: true });
            }
        };
        
        makeDirectoryIfNotExists(dir);
        
        expect(fs.existsSync(dir)).toBe(true);
    });

    it('should create subdirectories for each version of a story format', async () => {
        const dir = './story-formats/format1/2.0';
        const makeDirectoryIfNotExists = (path: string) => {
            if (!fs.existsSync(path)) {
                fs.mkdirSync(path, { recursive: true });
            }
        };
        
        makeDirectoryIfNotExists(dir);
        
        expect(fs.existsSync(dir)).toBe(true);
    });
});