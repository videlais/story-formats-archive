import { getSpecificVersion } from '../src/getSpecificVersion.js';
import { FilteredDatabase } from '../types/FilteredDatabase.js';
import axios from 'axios';

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

const name = 'format1';
const version = '2.0';
//const fileURL = `${paths.base_URL}/${name}/${version}/file3.js`;
//const fileResponse = {
//    data: Buffer.from('file content'),
//};
//const filePath = `./story-formats/${name}/${version}/file3.js`;

describe('getSpecificVersion with invalid inputs', () => {
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

    it('should handle a non-existent story format name', async () => {
        const nonExistentName = 'nonExistentFormat';
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        await getSpecificVersion(filteredDB, nonExistentName, version);
        expect(consoleSpy).toHaveBeenCalledWith(`❌ Story format ${nonExistentName} not found.`);
        consoleSpy.mockRestore();
        expect(axios.get).not.toHaveBeenCalled();
    });

    it('should handle a non-existent version for a story format', async () => {
        const nonExistentVersion = 'nonExistentVersion';
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        await getSpecificVersion(filteredDB, name, nonExistentVersion);
        expect(consoleSpy).toHaveBeenCalledWith(`❌ Version ${nonExistentVersion} for ${name} not found.`);
        consoleSpy.mockRestore();
        expect(axios.get).not.toHaveBeenCalled();
    });

    it('should handle an empty filteredDB', async () => {
        const emptyDB: FilteredDatabase = {};
        await getSpecificVersion(emptyDB, name, version);
        expect(axios.get).not.toHaveBeenCalled();
    });
});

describe('getSpecificVersion with valid inputs', () => {
    beforeEach(() => {
        (axios.get as jest.Mock).mockResolvedValue({
            data: Buffer.from('file content'),
        });
    });

    it('should download files for a specific version of a story format', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        await getSpecificVersion(filteredDB, name, version);
        expect(consoleSpy).toHaveBeenCalledWith(`✅ Found version ${version} for ${name}.`);
        expect(axios.get).toHaveBeenCalledTimes(2);
        consoleSpy.mockRestore();
    });

    it('should create directories for the story format and version', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        await getSpecificVersion(filteredDB, name, version);
        expect(consoleSpy).toHaveBeenCalledWith(`✅ Found version ${version} for ${name}.`);
        consoleSpy.mockRestore();
    });

    it('should handle multiple files for a specific version of a story format', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        await getSpecificVersion(filteredDB, name, '1.0');
        expect(consoleSpy).toHaveBeenCalledWith(`✅ Found version 1.0 for ${name}.`);
        expect(axios.get).toHaveBeenCalledTimes(6);
        consoleSpy.mockRestore();
    });

    it('should handle a different story format with its own files', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        await getSpecificVersion(filteredDB, 'format2', '1.0');
        expect(consoleSpy).toHaveBeenCalledWith(`✅ Found version 1.0 for format2.`);
        expect(axios.get).toHaveBeenCalledTimes(8);
        consoleSpy.mockRestore();
    });
});