import { jest } from '@jest/globals';
import { downloadFiles, createDownloadTasks, calculateChecksum, verifyChecksum } from '../src/downloadUtils.js';
import axios from 'axios';
import * as fs from 'node:fs';
jest.mock('axios');
jest.mock('node:fs');
const mockAxios = axios;
const mockFs = fs;
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
            const tasks = [
                {
                    url: 'https://example.com/file1.js',
                    filePath: './downloads/file1.js',
                    filename: 'file1.js'
                }
            ];
            const options = {
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
            // First two calls fail, third succeeds
            mockAxios.get
                .mockRejectedValueOnce(new Error('Network error'))
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce({ data: Buffer.from('test') });
            const tasks = [
                {
                    url: 'https://example.com/file1.js',
                    filePath: './downloads/file1.js',
                    filename: 'file1.js'
                }
            ];
            const options = {
                concurrency: 1,
                retries: 3,
                timeout: 5000,
                showProgress: false
            };
            const results = await downloadFiles(tasks, options);
            expect(results).toHaveLength(1);
            expect(results[0].success).toBe(true);
            expect(mockAxios.get).toHaveBeenCalledTimes(3);
        });
        it('should handle complete download failure', async () => {
            mockAxios.get.mockRejectedValue(new Error('Persistent network error'));
            const tasks = [
                {
                    url: 'https://example.com/file1.js',
                    filePath: './downloads/file1.js',
                    filename: 'file1.js'
                }
            ];
            const options = {
                concurrency: 1,
                retries: 2,
                timeout: 5000,
                showProgress: false
            };
            const results = await downloadFiles(tasks, options);
            expect(results).toHaveLength(1);
            expect(results[0].success).toBe(false);
            expect(results[0].error).toContain('Persistent network error');
        });
        it('should verify checksums when provided', async () => {
            const testData = Buffer.from('test file content');
            const correctChecksum = calculateChecksum(testData);
            mockAxios.get.mockResolvedValue({ data: testData });
            const tasks = [
                {
                    url: 'https://example.com/file1.js',
                    filePath: './downloads/file1.js',
                    filename: 'file1.js',
                    expectedChecksum: correctChecksum
                }
            ];
            const options = {
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
            const tasks = [
                {
                    url: 'https://example.com/file1.js',
                    filePath: './downloads/file1.js',
                    filename: 'file1.js',
                    expectedChecksum: wrongChecksum
                }
            ];
            const options = {
                showProgress: false
            };
            const results = await downloadFiles(tasks, options);
            expect(results).toHaveLength(1);
            expect(results[0].success).toBe(false);
            expect(results[0].error).toContain('Checksum verification failed');
        });
    });
});
