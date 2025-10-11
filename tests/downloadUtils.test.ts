import { jest } from '@jest/globals';
import { 
    downloadFiles, 
    createDownloadTasks, 
    calculateChecksum, 
    verifyChecksum,
    type DownloadTask,
    type DownloadOptions 
} from '../src/downloadUtils.js';
import axios from 'axios';
import * as fs from 'node:fs';

jest.mock('axios');
jest.mock('node:fs');

const mockAxios = axios as jest.Mocked<typeof axios>;
const mockFs = fs as jest.Mocked<typeof fs>;

describe('downloadUtils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('calculateChecksum', () => {
        it('should calculate SHA-256 checksum correctly', () => {
            const data = Buffer.from('test data');
            const checksum = calculateChecksum(data);
            expect(typeof checksum).toBe('string');
            expect(checksum).toHaveLength(64); // SHA-256 hex string length
        });
    });

    describe('verifyChecksum', () => {
        it('should verify matching checksums', () => {
            const data = Buffer.from('test data');
            const checksum = calculateChecksum(data);
            expect(verifyChecksum(data, checksum)).toBe(true);
        });

        it('should reject non-matching checksums', () => {
            const data = Buffer.from('test data');
            const wrongChecksum = 'wrong_checksum';
            expect(verifyChecksum(data, wrongChecksum)).toBe(false);
        });
    });

    describe('createDownloadTasks', () => {
        it('should create download tasks correctly', () => {
            const baseUrl = 'https://example.com';
            const format = 'testformat';
            const version = '1.0.0';
            const files = ['file1.js', 'file2.css'];
            const baseDir = './downloads';

            const tasks = createDownloadTasks(baseUrl, format, version, files, baseDir);

            expect(tasks).toHaveLength(2);
            expect(tasks[0]).toEqual({
                url: 'https://example.com/testformat/1.0.0/file1.js',
                filePath: './downloads/testformat/1.0.0/file1.js',
                filename: 'file1.js'
            });
            expect(tasks[1]).toEqual({
                url: 'https://example.com/testformat/1.0.0/file2.css',
                filePath: './downloads/testformat/1.0.0/file2.css',
                filename: 'file2.css'
            });
        });
    });

    describe('downloadFiles', () => {
        it('should handle empty task list', async () => {
            const results = await downloadFiles([], { showProgress: false });
            expect(results).toEqual([]);
        });

        it('should download files successfully', async () => {
            const testData = Buffer.from('test file content');
            mockAxios.get.mockResolvedValue({ data: testData });

            const tasks: DownloadTask[] = [
                {
                    url: 'https://example.com/file1.js',
                    filePath: './downloads/file1.js',
                    filename: 'file1.js'
                }
            ];

            const options: DownloadOptions = {
                concurrency: 1,
                retries: 1,
                timeout: 5000,
                showProgress: false
            };

            const results = await downloadFiles(tasks, options);

            expect(results).toHaveLength(1);
            expect(results[0].success).toBe(true);
            expect(results[0].filePath).toBe('./downloads/file1.js');
            expect(mockFs.writeFileSync).toHaveBeenCalledWith('./downloads/file1.js', testData);
        });

        it('should handle download failures and retry', async () => {
            // Mock setTimeout to make retries instant
            const originalSetTimeout = global.setTimeout;
            global.setTimeout = jest.fn((callback: () => void) => {
                callback();
                return 1;
            }) as unknown as typeof setTimeout;

            // First two calls fail, third succeeds
            mockAxios.get
                .mockRejectedValueOnce(new Error('Network error'))
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce({ data: Buffer.from('test') });

            const tasks: DownloadTask[] = [
                {
                    url: 'https://example.com/file1.js',
                    filePath: './downloads/file1.js',
                    filename: 'file1.js'
                }
            ];

            const options: DownloadOptions = {
                concurrency: 1,
                retries: 2, // Reduce retries to speed up test
                timeout: 1000, // Reduce timeout
                showProgress: false
            };

            const results = await downloadFiles(tasks, options);

            expect(results).toHaveLength(1);
            expect(results[0].success).toBe(true);
            expect(mockAxios.get).toHaveBeenCalledTimes(3);

            // Restore setTimeout
            global.setTimeout = originalSetTimeout;
        }, 10000); // Increase test timeout

        it('should handle complete download failure', async () => {
            // Mock setTimeout to make retries instant
            const originalSetTimeout = global.setTimeout;
            global.setTimeout = jest.fn((callback: () => void) => {
                callback();
                return 1;
            }) as unknown as typeof setTimeout;

            mockAxios.get.mockRejectedValue(new Error('Persistent network error'));

            const tasks: DownloadTask[] = [
                {
                    url: 'https://example.com/file1.js',
                    filePath: './downloads/file1.js',
                    filename: 'file1.js'
                }
            ];

            const options: DownloadOptions = {
                concurrency: 1,
                retries: 2,
                timeout: 1000,
                showProgress: false
            };

            const results = await downloadFiles(tasks, options);

            expect(results).toHaveLength(1);
            expect(results[0].success).toBe(false);
            expect(results[0].error).toContain('Persistent network error');

            // Restore setTimeout
            global.setTimeout = originalSetTimeout;
        }, 10000);

        it('should verify checksums when provided', async () => {
            const testData = Buffer.from('test file content');
            const correctChecksum = calculateChecksum(testData);
            
            // Mock axios to return ArrayBuffer that matches our test data
            mockAxios.get.mockResolvedValue({ 
                data: testData.buffer.slice(testData.byteOffset, testData.byteOffset + testData.byteLength)
            });

            const tasks: DownloadTask[] = [
                {
                    url: 'https://example.com/file1.js',  
                    filePath: './downloads/file1.js',
                    filename: 'file1.js',
                    expectedChecksum: correctChecksum
                }
            ];

            const options: DownloadOptions = {
                showProgress: false
            };

            const results = await downloadFiles(tasks, options);

            expect(results).toHaveLength(1);
            expect(results[0].success).toBe(true);
        });

        it('should fail on checksum mismatch', async () => {
            const testData = Buffer.from('test file content');
            const wrongChecksum = 'wrong_checksum';
            mockAxios.get.mockResolvedValue({ data: testData });

            const tasks: DownloadTask[] = [
                {
                    url: 'https://example.com/file1.js',
                    filePath: './downloads/file1.js',
                    filename: 'file1.js',
                    expectedChecksum: wrongChecksum
                }
            ];

            const options: DownloadOptions = {
                showProgress: false
            };

            const results = await downloadFiles(tasks, options);

            expect(results).toHaveLength(1);
            expect(results[0].success).toBe(false);
            expect(results[0].error).toContain('Checksum verification failed');
        });

        it('should show progress bar and log results when showProgress is true', async () => {
            const testData = Buffer.from('test file content');
            mockAxios.get.mockResolvedValue({ data: testData });

            const tasks: DownloadTask[] = [
                {
                    url: 'https://example.com/file1.js',
                    filePath: './downloads/file1.js',
                    filename: 'file1.js'
                },
                {
                    url: 'https://example.com/file2.js',
                    filePath: './downloads/file2.js',
                    filename: 'file2.js'
                }
            ];

            const options: DownloadOptions = {
                showProgress: true,
                concurrency: 1
            };

            // Mock console.log to capture output
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

            const results = await downloadFiles(tasks, options);

            expect(results).toHaveLength(2);
            expect(results[0].success).toBe(true);
            expect(results[1].success).toBe(true);
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Successfully downloaded: 2/2 files'));

            consoleSpy.mockRestore();
        });

        it('should show failed downloads when showProgress is true and some downloads fail', async () => {
            // First call succeeds, second fails
            mockAxios.get
                .mockResolvedValueOnce({ data: Buffer.from('test1') })
                .mockRejectedValueOnce(new Error('Network error'));

            const tasks: DownloadTask[] = [
                {
                    url: 'https://example.com/file1.js',
                    filePath: './downloads/file1.js',
                    filename: 'file1.js'
                },
                {
                    url: 'https://example.com/file2.js',
                    filePath: './downloads/file2.js',
                    filename: 'file2.js'
                }
            ];

            const options: DownloadOptions = {
                showProgress: true,
                concurrency: 1,
                retries: 0
            };

            // Mock console.log to capture output
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

            const results = await downloadFiles(tasks, options);

            expect(results).toHaveLength(2);
            expect(results[0].success).toBe(true);
            expect(results[1].success).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Successfully downloaded: 1/2 files'));
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Failed downloads: 1'));
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('./downloads/file2.js: Failed to download'));

            consoleSpy.mockRestore();
        });

        it('should use default options when not provided', async () => {
            const testData = Buffer.from('test file content');
            mockAxios.get.mockResolvedValue({ data: testData });

            const tasks: DownloadTask[] = [
                {
                    url: 'https://example.com/file1.js',
                    filePath: './downloads/file1.js',
                    filename: 'file1.js'
                }
            ];

            // Don't provide options - should use defaults
            const results = await downloadFiles(tasks);

            expect(results).toHaveLength(1);
            expect(results[0].success).toBe(true);
        });

        it('should handle timeout errors in downloadFileWithRetry', async () => {
            // Mock setTimeout to make retries instant
            const originalSetTimeout = global.setTimeout;
            global.setTimeout = jest.fn((callback: () => void) => {
                callback();
                return 1;
            }) as unknown as typeof setTimeout;

            const timeoutError = new Error('timeout');
            timeoutError.name = 'ECONNABORTED';
            mockAxios.get.mockRejectedValue(timeoutError);

            const tasks: DownloadTask[] = [
                {
                    url: 'https://example.com/file1.js',
                    filePath: './downloads/file1.js',
                    filename: 'file1.js'
                }
            ];

            const options: DownloadOptions = {
                showProgress: false,
                retries: 1,
                timeout: 1000
            };

            const results = await downloadFiles(tasks, options);

            expect(results).toHaveLength(1);
            expect(results[0].success).toBe(false);
            expect(results[0].error).toContain('Failed to download');

            // Restore setTimeout
            global.setTimeout = originalSetTimeout;
        }, 10000);

        it('should handle errors without message property', async () => {
            // Create an error without a message property
            const errorWithoutMessage = new Error();
            delete (errorWithoutMessage as unknown as Record<string, unknown>).message;
            mockAxios.get.mockRejectedValue(errorWithoutMessage);

            const tasks: DownloadTask[] = [
                {
                    url: 'https://example.com/file1.js',
                    filePath: './downloads/file1.js',
                    filename: 'file1.js'
                }
            ];

            const options: DownloadOptions = {
                showProgress: false,
                retries: 0
            };

            const results = await downloadFiles(tasks, options);

            expect(results).toHaveLength(1);
            expect(results[0].success).toBe(false);
            expect(results[0].error).toContain('Unknown error');
        });
    });
});