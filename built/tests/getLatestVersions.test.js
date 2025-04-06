import { getLatestVersions } from '../src/getLatestVersions.js';
import axios from 'axios';
import { readFileSync } from 'fs';
import { resolve } from 'path';
const configPath = resolve(__dirname, '../../paths.json');
const paths = JSON.parse(readFileSync(configPath, 'utf-8'));
jest.mock('axios');
const filteredDB = {
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
        axios.get.mockResolvedValue({
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
        expect(axios.get).toHaveBeenCalledTimes(4);
        expect(axios.get).toHaveBeenCalledWith(`${paths.base_URL}/format1/2.0/file3.js`, { "responseType": "arraybuffer" });
        expect(axios.get).toHaveBeenCalledWith(`${paths.base_URL}/format1/2.0/file4.js`, { "responseType": "arraybuffer" });
        expect(axios.get).toHaveBeenCalledWith(`${paths.base_URL}/format2/1.0/file5.js`, { "responseType": "arraybuffer" });
        expect(axios.get).toHaveBeenCalledWith(`${paths.base_URL}/format2/1.0/file6.js`, { "responseType": "arraybuffer" });
    });
    it('should handle empty filteredDB', async () => {
        const emptyDB = {};
        await getLatestVersions(emptyDB, formats);
        expect(axios.get).not.toHaveBeenCalled();
    });
    it('should handle empty formats array', async () => {
        const emptyFormats = [];
        await getLatestVersions(filteredDB, emptyFormats);
        expect(axios.get).not.toHaveBeenCalled();
    });
    it('should handle non-existent formats', async () => {
        const nonExistentFormats = ['format3'];
        await getLatestVersions(filteredDB, nonExistentFormats);
        expect(axios.get).not.toHaveBeenCalled();
    });
    it('should handle axios errors', async () => {
        axios.get.mockRejectedValue(new Error('Network error'));
        await expect(getLatestVersions(filteredDB, formats)).rejects.toThrow('Network error');
        expect(axios.get).toHaveBeenCalledTimes(1);
    });
    it('should use first version if only one is available', async () => {
        const singleVersionDB = {
            'format1': [
                {
                    version: '1.0',
                    files: ['file1.js'],
                    name: 'format1',
                    description: 'Description for format 1',
                    author: 'Author 1',
                    proofing: false,
                }
            ]
        };
        const singleVersionFormats = ['format1'];
        await getLatestVersions(singleVersionDB, singleVersionFormats);
        expect(axios.get).toHaveBeenCalledWith(`${paths.base_URL}/format1/1.0/file1.js`, { "responseType": "arraybuffer" });
        expect(axios.get).toHaveBeenCalledTimes(1);
    });
});
