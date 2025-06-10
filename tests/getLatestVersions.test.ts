import { getLatestVersions } from '../src/getLatestVersions.js';
import { FilteredDatabase } from '../types/FilteredDatabase.js';
import axios from 'axios';
import fs from 'node:fs';
import paths from '../src/paths.js';

jest.mock('axios');

const filteredDB: FilteredDatabase = {
    'format1': [
        {
            version: '1.0.0',
            files: ['file1.js', 'file2.js'],
            name: 'format1',
            description: 'Description for format 1',
            author: 'Author 1',
            proofing: false,
        },
        {
            version: '2.0.0',
            files: ['file3.js', 'file4.js'],
            name: 'format1',
            description: 'Description for format 1',
            author: 'Author 1',
            proofing: false,
        }
    ],
    'format2': [
        {
            version: '1.0.0',
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
                    '2.0.0': {
                        file3: 'file3.js',
                        file4: 'file4.js',
                    },
                },
                format2: {
                    '1.0.0': {
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
        expect((axios.get as jest.Mock)).toHaveBeenCalledWith(`${paths.base_URL}/format1/2.0.0/file3.js`, {"responseType": "arraybuffer"});
        expect((axios.get as jest.Mock)).toHaveBeenCalledWith(`${paths.base_URL}/format1/2.0.0/file4.js`, {"responseType": "arraybuffer"});
        expect((axios.get as jest.Mock)).toHaveBeenCalledWith(`${paths.base_URL}/format2/1.0.0/file5.js`, {"responseType": "arraybuffer"});
        expect((axios.get as jest.Mock)).toHaveBeenCalledWith(`${paths.base_URL}/format2/1.0.0/file6.js`, {"responseType": "arraybuffer"});
    });

    it('should handle empty filteredDB', async () => {
        const emptyDB: FilteredDatabase = {};
        await getLatestVersions(emptyDB, formats);

        expect((axios.get as jest.Mock)).not.toHaveBeenCalled();
    });

    it('should handle filtererDB with no keys', async () => {
        const emptyDB: FilteredDatabase = { 'format1': [] };
        await getLatestVersions(emptyDB, formats);
        expect((axios.get as jest.Mock)).not.toHaveBeenCalled();
    });

    it('should handle formats not in filteredDB', async () => {
        const nonExistentFormats = ['format3'];
        await getLatestVersions(filteredDB, nonExistentFormats);

        expect((axios.get as jest.Mock)).not.toHaveBeenCalled();
    });

    it('should handle formats with no versions', async () => {
        // Mock console.warn to capture warnings
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        // Create a filteredDB with no versions for 'format1' and 'format2'
        // This simulates a scenario where the story format exists but has no versions.
        // This is useful for testing how the function handles such cases.
        const noVersionDB: FilteredDatabase = {
            'format1': [],
            'format2': []
        };
        const noVersionFormats = ['format1', 'format2'];
        await getLatestVersions(noVersionDB, noVersionFormats);
        expect((axios.get as jest.Mock)).not.toHaveBeenCalled();
        expect(console.warn).toHaveBeenCalledWith('⚠️ No versions found for story format: format1');
        expect(console.warn).toHaveBeenCalledWith('⚠️ No versions found for story format: format2');
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
                    version: '1.0.0',
                    files: ['file1.js'],
                    name: 'format1',
                    description: 'Description for format 1',
                    author: 'Author 1',
                    proofing: false,
                }
            ]};
        const singleVersionFormats = ['format1'];
        await getLatestVersions(singleVersionDB, singleVersionFormats);
        expect((axios.get as jest.Mock)).toHaveBeenCalledWith(`${paths.base_URL}/format1/1.0.0/file1.js`, {"responseType": "arraybuffer"});
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
        const dir = './story-formats/format1/2.0.0';
        const makeDirectoryIfNotExists = (path: string) => {
            if (!fs.existsSync(path)) {
                fs.mkdirSync(path, { recursive: true });
            }
        };
        
        makeDirectoryIfNotExists(dir);
        
        expect(fs.existsSync(dir)).toBe(true);
    });

    it('should warn and skip formats with no versions', async () => {
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        await getLatestVersions({ 'format1': [] }, ['format1']);
        expect(warnSpy).toHaveBeenCalledWith('⚠️ No versions found for story format: format1');
        warnSpy.mockRestore();
    });

    it('should error and return if no story formats found', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        await getLatestVersions({}, []);
        expect(errorSpy).toHaveBeenCalledWith('❌ No story formats found in the database.');
        errorSpy.mockRestore();
    });

    it('should only process formats present in the formats array', async () => {
        (axios.get as jest.Mock).mockResolvedValue({ data: Buffer.from('test') });
        const db: FilteredDatabase = {
            'format1': [{
                version: '1.0.0',
                files: ['file1.js'],
                name: 'format1',
                description: '',
                author: '',
                proofing: false
            }],
            'format2': [{
                version: '1.0.0',
                files: ['file2.js'],
                name: 'format2',
                description: '',
                author: '',
                proofing: false
            }]
        };
        await getLatestVersions(db, ['format2']);
        expect((axios.get as jest.Mock)).toHaveBeenCalledWith(`${paths.base_URL}/format2/1.0.0/file2.js`, { responseType: 'arraybuffer' });
        expect((axios.get as jest.Mock)).toHaveBeenCalledTimes(1);
    });

    it('should use semver to select the latest version', async () => {
        (axios.get as jest.Mock).mockResolvedValue({ data: Buffer.from('test') });
        const db: FilteredDatabase = {
            'format1': [
                {
                    version: '1.0.0',
                    files: ['file1.js'],
                    name: 'format1',
                    description: '',
                    author: '',
                    proofing: false
                },
                {
                    version: '2.0.0',
                    files: ['file2.js'],
                    name: 'format1',
                    description: '',
                    author: '',
                    proofing: false
                }
            ]
        };
        await getLatestVersions(db, ['format1']);
        expect((axios.get as jest.Mock)).toHaveBeenCalledWith(`${paths.base_URL}/format1/2.0.0/file2.js`, { responseType: 'arraybuffer' });
    });

    it('should create directories for each format and version', async () => {
        const mkdirSpy = jest.spyOn(fs, 'mkdirSync').mockImplementation((path: fs.PathLike) => path.toString());
        jest.spyOn(fs, 'existsSync').mockReturnValue(false);
        (axios.get as jest.Mock).mockResolvedValue({ data: Buffer.from('test') });
        const db: FilteredDatabase = {
            'format1': [{
                version: '1.0.0',
                files: ['file1.js'],
                name: 'format1',
                description: '',
                author: '',
                proofing: false
            }]
        };
        await getLatestVersions(db, ['format1']);
        expect(mkdirSpy).toHaveBeenCalledWith('./story-formats');
        expect(mkdirSpy).toHaveBeenCalledWith('./story-formats/format1');
        expect(mkdirSpy).toHaveBeenCalledWith('./story-formats/format1/1.0.0');
        mkdirSpy.mockRestore();
    });
});
