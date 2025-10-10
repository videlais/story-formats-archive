import { getLatestVersions } from '../src/getLatestVersions.js';
import { FilteredDatabase } from '../types/FilteredDatabase.js';
import * as downloadUtils from '../src/downloadUtils.js';
import * as fs from 'node:fs';

jest.mock('../src/downloadUtils.js');
jest.mock('node:fs');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockDownloadUtils = downloadUtils as jest.Mocked<typeof downloadUtils>;

describe('getLatestVersions', () => {
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

    beforeEach(() => {
        jest.clearAllMocks();
        mockFs.existsSync.mockReturnValue(true);
        mockFs.mkdirSync.mockImplementation();
        mockDownloadUtils.downloadFiles.mockResolvedValue([
            { success: true, filePath: './story-formats/format1/2.0.0/file3.js' },
            { success: true, filePath: './story-formats/format1/2.0.0/file4.js' },
            { success: true, filePath: './story-formats/format2/1.0.0/file5.js' },
            { success: true, filePath: './story-formats/format2/1.0.0/file6.js' }
        ]);
        mockDownloadUtils.createDownloadTasks.mockImplementation((baseUrl, format, version, files, baseDir) => {
            return files.map(file => ({
                url: `${baseUrl}/${format}/${version}/${file}`,
                filePath: `${baseDir}/${format}/${version}/${file}`,
                filename: file
            }));
        });
    });

    it('should select latest versions and download files', async () => {
        const formats = ['format1', 'format2'];
        await getLatestVersions(filteredDB, formats);

        // Should call downloadFiles once with the correct tasks
        expect(mockDownloadUtils.downloadFiles).toHaveBeenCalledTimes(1);
        
        const [tasks] = mockDownloadUtils.downloadFiles.mock.calls[0];
        expect(tasks).toHaveLength(4); // 2 files for format1 v2.0.0, 2 files for format2 v1.0.0
        
        // Check that it selected the latest versions
        expect(tasks.some((task: downloadUtils.DownloadTask) => task.url.includes('format1/2.0.0'))).toBe(true);
        expect(tasks.some((task: downloadUtils.DownloadTask) => task.url.includes('format2/1.0.0'))).toBe(true);
    });

    it('should handle empty filteredDB', async () => {
        const emptyDB: FilteredDatabase = {};
        await getLatestVersions(emptyDB, []);

        expect(mockDownloadUtils.downloadFiles).not.toHaveBeenCalled();
    });

    it('should handle formats with no versions', async () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        const noVersionDB: FilteredDatabase = {
            'format1': []
        };
        
        await getLatestVersions(noVersionDB, ['format1']);

        expect(consoleSpy).toHaveBeenCalledWith('⚠️ No versions found for story format: format1');
        expect(mockDownloadUtils.downloadFiles).not.toHaveBeenCalled();
        
        consoleSpy.mockRestore();
    });

    it('should filter formats based on the formats array', async () => {
        const formats = ['format1']; // Only format1
        await getLatestVersions(filteredDB, formats);

        expect(mockDownloadUtils.downloadFiles).toHaveBeenCalledTimes(1);
        
        const [tasks] = mockDownloadUtils.downloadFiles.mock.calls[0];
        expect(tasks).toHaveLength(2); // Only 2 files for format1
        expect(tasks.every((task: downloadUtils.DownloadTask) => task.url.includes('format1'))).toBe(true);
    });

    it('should use semver to select the latest version', async () => {
        await getLatestVersions(filteredDB, ['format1']);

        const [tasks] = mockDownloadUtils.downloadFiles.mock.calls[0];
        // Should select version 2.0.0 over 1.0.0
        expect(tasks.every((task: downloadUtils.DownloadTask) => task.url.includes('format1/2.0.0'))).toBe(true);
    });

    it('should create directories for formats', async () => {
        mockFs.existsSync.mockReturnValue(false);
        
        await getLatestVersions(filteredDB, ['format1', 'format2']);

        expect(mockFs.mkdirSync).toHaveBeenCalledWith('./story-formats');
        expect(mockFs.mkdirSync).toHaveBeenCalledWith('./story-formats/format1');
        expect(mockFs.mkdirSync).toHaveBeenCalledWith('./story-formats/format2');
    });
});