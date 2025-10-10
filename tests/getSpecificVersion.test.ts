import { getSpecificVersion } from '../src/getSpecificVersion.js';
import { FilteredDatabase } from '../types/FilteredDatabase.js';
import * as downloadUtils from '../src/downloadUtils.js';
import * as fs from 'node:fs';

jest.mock('../src/downloadUtils.js');
jest.mock('node:fs');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockDownloadUtils = downloadUtils as jest.Mocked<typeof downloadUtils>;

describe('getSpecificVersion', () => {
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

    beforeEach(() => {
        jest.clearAllMocks();
        mockFs.existsSync.mockReturnValue(true);
        mockFs.mkdirSync.mockImplementation();
        mockDownloadUtils.downloadFiles.mockResolvedValue([
            { success: true, filePath: './story-formats/format1/2.0/file3.js' },
            { success: true, filePath: './story-formats/format1/2.0/file4.js' }
        ]);
        mockDownloadUtils.createDownloadTasks.mockImplementation((baseUrl, format, version, files, baseDir) => {
            return files.map(file => ({
                url: `${baseUrl}/${format}/${version}/${file}`,
                filePath: `${baseDir}/${format}/${version}/${file}`,
                filename: file
            }));
        });
    });

    it('should download files for a specific version of a story format', async () => {
        const name = 'format1';
        const version = '2.0';

        await getSpecificVersion(filteredDB, name, version);

        expect(mockDownloadUtils.downloadFiles).toHaveBeenCalledTimes(1);
        
        const [tasks] = mockDownloadUtils.downloadFiles.mock.calls[0];
        expect(tasks).toHaveLength(2); // 2 files for format1 v2.0
        expect(tasks.every((task: downloadUtils.DownloadTask) => task.url.includes('format1/2.0'))).toBe(true);
    });

    it('should handle a non-existent story format name', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        const nonExistentName = 'nonExistentFormat';
        
        await getSpecificVersion(filteredDB, nonExistentName, '1.0');
        
        expect(consoleSpy).toHaveBeenCalledWith(`❌ Story format ${nonExistentName} not found.`);
        expect(mockDownloadUtils.downloadFiles).not.toHaveBeenCalled();
        
        consoleSpy.mockRestore();
    });

    it('should handle a non-existent version for a story format', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        const nonExistentVersion = 'nonExistentVersion';
        
        await getSpecificVersion(filteredDB, 'format1', nonExistentVersion);
        
        expect(consoleSpy).toHaveBeenCalledWith(`❌ Version ${nonExistentVersion} for format1 not found.`);
        expect(mockDownloadUtils.downloadFiles).not.toHaveBeenCalled();
        
        consoleSpy.mockRestore();
    });

    it('should handle an empty filteredDB', async () => {
        const emptyDB: FilteredDatabase = {};
        
        await getSpecificVersion(emptyDB, 'format1', '1.0');
        
        expect(mockDownloadUtils.downloadFiles).not.toHaveBeenCalled();
    });

    it('should create directories if they do not exist', async () => {
        mockFs.existsSync.mockReturnValue(false);
        
        await getSpecificVersion(filteredDB, 'format1', '2.0');

        expect(mockFs.mkdirSync).toHaveBeenCalledWith('./story-formats');
        expect(mockFs.mkdirSync).toHaveBeenCalledWith('./story-formats/format1');
        expect(mockFs.mkdirSync).toHaveBeenCalledWith('./story-formats/format1/2.0');
    });

    it('should handle download options', async () => {
        const options = { concurrency: 5, retries: 2, timeout: 10000, showProgress: false };
        
        await getSpecificVersion(filteredDB, 'format1', '2.0', options);

        expect(mockDownloadUtils.downloadFiles).toHaveBeenCalledWith(
            expect.any(Array),
            options
        );
    });

    it('should log successful downloads', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        
        await getSpecificVersion(filteredDB, 'format1', '2.0');
        
        expect(consoleSpy).toHaveBeenCalledWith('✅ Found version 2.0 for format1.');
        expect(consoleSpy).toHaveBeenCalledWith('\tDownloaded file3.js to ./story-formats/format1/2.0/file3.js');
        expect(consoleSpy).toHaveBeenCalledWith('\tDownloaded file4.js to ./story-formats/format1/2.0/file4.js');
        
        consoleSpy.mockRestore();
    });
});