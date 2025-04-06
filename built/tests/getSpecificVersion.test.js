import { getSpecificVersion } from '../src/getSpecificVersion.js';
import axios from 'axios';
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
const name = 'format1';
const version = '2.0';
//const fileURL = `${paths.base_URL}/${name}/${version}/file3.js`;
//const fileResponse = {
//    data: Buffer.from('file content'),
//};
//const filePath = `./story-formats/${name}/${version}/file3.js`;
describe('getSpecificVersion', () => {
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
    it('should handle a non-existent story format', async () => {
        const nonExistentName = 'nonExistentFormat';
        await getSpecificVersion(filteredDB, nonExistentName, version);
        expect(axios.get).not.toHaveBeenCalled();
    });
    it('should handle a non-existent version for a story format', async () => {
        const nonExistentVersion = 'nonExistentVersion';
        await getSpecificVersion(filteredDB, name, nonExistentVersion);
        expect(axios.get).not.toHaveBeenCalled();
    });
    it('should handle an empty filteredDB', async () => {
        const emptyDB = {};
        await getSpecificVersion(emptyDB, name, version);
        expect(axios.get).not.toHaveBeenCalled();
    });
});
