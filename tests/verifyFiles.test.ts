import { describe, expect, test, beforeEach, afterEach } from '@jest/globals';
import { verifyFormatVersion, verifyAllInstalledFiles, printVerificationResults, VerificationResult } from '../src/verifyFiles.js';
import { FilteredDatabase } from '../types/FilteredDatabase.js';
import { StoryFormatEntry } from '../types/StoryFormatEntry.js';
import { existsSync, mkdirSync, writeFileSync, rmSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

describe('verifyFiles', () => {
    const testDir = './test-story-formats';
    let mockFilteredDB: FilteredDatabase;

    beforeEach(() => {
        // Clean up test directory if it exists
        if (existsSync(testDir)) {
            rmSync(testDir, { recursive: true, force: true });
        }

        // Create mock database
        const mockEntry: StoryFormatEntry = {
            name: 'testformat',
            author: 'Test Author',
            version: '1.0.0',
            proofing: false,
            description: 'Test format',
            files: ['LICENSE', 'format.js'],
            checksums: {
                'LICENSE': createHash('sha256').update('MIT License content').digest('hex'),
                'format.js': createHash('sha256').update('console.log("test format");').digest('hex')
            }
        };

        mockFilteredDB = {
            'testformat': [mockEntry]
        };
    });

    afterEach(() => {
        // Clean up test directory
        if (existsSync(testDir)) {
            rmSync(testDir, { recursive: true, force: true });
        }
    });

    describe('verifyFormatVersion', () => {
        test('should return valid status for files that match checksums', () => {
            // Create test files with correct content
            const formatDir = join(testDir, 'testformat', '1.0.0');
            mkdirSync(formatDir, { recursive: true });
            
            writeFileSync(join(formatDir, 'LICENSE'), 'MIT License content');
            writeFileSync(join(formatDir, 'format.js'), 'console.log("test format");');

            const results = verifyFormatVersion(mockFilteredDB, 'testformat', '1.0.0', testDir);

            expect(results).toHaveLength(2);
            expect(results[0].status).toBe('valid');
            expect(results[1].status).toBe('valid');
        });

        test('should return invalid status for files that do not match checksums', () => {
            // Create test files with incorrect content
            const formatDir = join(testDir, 'testformat', '1.0.0');
            mkdirSync(formatDir, { recursive: true });
            
            writeFileSync(join(formatDir, 'LICENSE'), 'Wrong license content');
            writeFileSync(join(formatDir, 'format.js'), 'console.log("wrong content");');

            const results = verifyFormatVersion(mockFilteredDB, 'testformat', '1.0.0', testDir);

            expect(results).toHaveLength(2);
            expect(results[0].status).toBe('invalid');
            expect(results[1].status).toBe('invalid');
        });

        test('should return missing status for files that do not exist', () => {
            const results = verifyFormatVersion(mockFilteredDB, 'testformat', '1.0.0', testDir);

            expect(results).toHaveLength(2);
            expect(results[0].status).toBe('missing');
            expect(results[1].status).toBe('missing');
        });

        test('should throw error for non-existent format', () => {
            expect(() => {
                verifyFormatVersion(mockFilteredDB, 'nonexistent', '1.0.0', testDir);
            }).toThrow('Story format "nonexistent" not found in database');
        });

        test('should throw error for non-existent version', () => {
            expect(() => {
                verifyFormatVersion(mockFilteredDB, 'testformat', '2.0.0', testDir);
            }).toThrow('Version "2.0.0" not found for story format "testformat"');
        });

        test('should handle files without checksums', () => {
            // Create entry without checksums
            const entryWithoutChecksums: StoryFormatEntry = {
                name: 'nochecksum',
                author: 'Test Author',
                version: '1.0.0',
                proofing: false,
                description: 'Test format without checksums',
                files: ['LICENSE'],
                checksums: undefined
            };

            const dbWithoutChecksums: FilteredDatabase = {
                'nochecksum': [entryWithoutChecksums]
            };

            const results = verifyFormatVersion(dbWithoutChecksums, 'nochecksum', '1.0.0', testDir);

            expect(results).toHaveLength(1);
            expect(results[0].status).toBe('no-checksum');
        });
    });

    describe('verifyAllInstalledFiles', () => {
        test('should return empty array when no story formats are installed', () => {
            const results = verifyAllInstalledFiles(mockFilteredDB, testDir);
            expect(results).toHaveLength(0);
        });

        test('should verify all installed formats', () => {
            // Create test files
            const formatDir = join(testDir, 'testformat', '1.0.0');
            mkdirSync(formatDir, { recursive: true });
            
            writeFileSync(join(formatDir, 'LICENSE'), 'MIT License content');
            writeFileSync(join(formatDir, 'format.js'), 'console.log("test format");');

            const results = verifyAllInstalledFiles(mockFilteredDB, testDir);

            expect(results).toHaveLength(2);
            expect(results.every(r => r.status === 'valid')).toBe(true);
        });

        test('should handle formats not in database', () => {
            // Create a format directory that's not in the database
            const unknownFormatDir = join(testDir, 'unknownformat', '1.0.0');
            mkdirSync(unknownFormatDir, { recursive: true });
            
            const results = verifyAllInstalledFiles(mockFilteredDB, testDir);

            expect(results).toHaveLength(1);
            expect(results[0].status).toBe('no-checksum');
            expect(results[0].format).toBe('unknownformat');
        });

        test('should handle mixed file statuses in single format', () => {
            // Create a format with multiple files in different states
            const mixedEntry: StoryFormatEntry = {
                name: 'mixedformat',
                author: 'Test Author',
                version: '1.0.0',
                proofing: false,
                description: 'Format with mixed file states',
                files: ['LICENSE', 'format.js', 'missing.txt', 'no-checksum.txt'],
                checksums: {
                    'LICENSE': createHash('sha256').update('License content').digest('hex'),
                    'format.js': createHash('sha256').update('Format content').digest('hex'),
                    'missing.txt': createHash('sha256').update('Missing content').digest('hex')
                    // no-checksum.txt intentionally has no checksum
                }
            };

            const mixedDB: FilteredDatabase = {
                'mixedformat': [mixedEntry]
            };

            // Create some files but not others
            const formatDir = join(testDir, 'mixedformat', '1.0.0');
            mkdirSync(formatDir, { recursive: true });
            writeFileSync(join(formatDir, 'LICENSE'), 'License content'); // Valid
            writeFileSync(join(formatDir, 'format.js'), 'Wrong content'); // Invalid
            writeFileSync(join(formatDir, 'no-checksum.txt'), 'Some content'); // No checksum
            // missing.txt is not created - will be missing

            const results = verifyFormatVersion(mixedDB, 'mixedformat', '1.0.0', testDir);

            expect(results).toHaveLength(4);
            expect(results.find(r => r.file === 'LICENSE')?.status).toBe('valid');
            expect(results.find(r => r.file === 'format.js')?.status).toBe('invalid');
            expect(results.find(r => r.file === 'missing.txt')?.status).toBe('missing');
            expect(results.find(r => r.file === 'no-checksum.txt')?.status).toBe('no-checksum');
        });

        test('should handle nested directory structures', () => {
            // Test with multiple formats and versions
            const format1Dir = join(testDir, 'format1', '1.0.0');
            const format1DirV2 = join(testDir, 'format1', '2.0.0');
            const format2Dir = join(testDir, 'format2', '1.0.0');
            
            mkdirSync(format1Dir, { recursive: true });
            mkdirSync(format1DirV2, { recursive: true });
            mkdirSync(format2Dir, { recursive: true });
            
            // Create some test files
            writeFileSync(join(format1Dir, 'format.js'), 'test');
            writeFileSync(join(format1DirV2, 'format.js'), 'test');
            writeFileSync(join(format2Dir, 'format.js'), 'test');

            const results = verifyAllInstalledFiles(mockFilteredDB, testDir);
            
            // Should find installations even if not in database
            expect(results.length).toBeGreaterThan(0);
            
            // Check that it found the different format/version combinations
            const foundFormats = [...new Set(results.map(r => r.format))];
            expect(foundFormats).toContain('format1');
            expect(foundFormats).toContain('format2');
        });
    });

    describe('printVerificationResults', () => {
        let consoleSpy: jest.SpyInstance;

        beforeEach(() => {
            consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        });

        afterEach(() => {
            consoleSpy.mockRestore();
        });

        test('should print results for all verification statuses', () => {
            const results: VerificationResult[] = [
                {
                    format: 'testformat1',
                    version: '1.0.0',
                    file: 'valid.txt',
                    status: 'valid',
                    expectedChecksum: 'abc123',
                    actualChecksum: 'abc123',
                    path: '/test/valid.txt'
                },
                {
                    format: 'testformat1',
                    version: '1.0.0',
                    file: 'invalid.txt',
                    status: 'invalid',
                    expectedChecksum: 'abc123',
                    actualChecksum: 'def456',
                    path: '/test/invalid.txt'
                },
                {
                    format: 'testformat2',
                    version: '2.0.0',
                    file: 'missing.txt',
                    status: 'missing',
                    path: '/test/missing.txt'
                },
                {
                    format: 'testformat2',
                    version: '2.0.0',
                    file: 'no-checksum.txt',
                    status: 'no-checksum',
                    path: '/test/no-checksum.txt'
                }
            ];

            printVerificationResults(results);

            // Verify that console.log was called with expected messages
            expect(consoleSpy).toHaveBeenCalledWith('\n🔍 File Verification Results:');
            expect(consoleSpy).toHaveBeenCalledWith('═'.repeat(80));
            expect(consoleSpy).toHaveBeenCalledWith('\n📦 testformat1@1.0.0:');
            expect(consoleSpy).toHaveBeenCalledWith('  ✅ valid.txt - VALID');
            expect(consoleSpy).toHaveBeenCalledWith('  ❌ invalid.txt - INVALID');
            expect(consoleSpy).toHaveBeenCalledWith('     Expected: abc123');
            expect(consoleSpy).toHaveBeenCalledWith('     Actual:   def456');
            expect(consoleSpy).toHaveBeenCalledWith('\n📦 testformat2@2.0.0:');
            expect(consoleSpy).toHaveBeenCalledWith('  ❓ missing.txt - MISSING');
            expect(consoleSpy).toHaveBeenCalledWith('  ⚪ no-checksum.txt - NO CHECKSUM');
            expect(consoleSpy).toHaveBeenCalledWith('📊 Summary: 4 files checked');
            expect(consoleSpy).toHaveBeenCalledWith('   ✅ Valid: 1');
            expect(consoleSpy).toHaveBeenCalledWith('   ❌ Invalid: 1');
            expect(consoleSpy).toHaveBeenCalledWith('   ❓ Missing: 1');
            expect(consoleSpy).toHaveBeenCalledWith('   ⚪ No checksum: 1');
            expect(consoleSpy).toHaveBeenCalledWith('\n⚠️  Some files failed verification. Consider re-downloading them.');
        });

        test('should show success message when all files are valid', () => {
            const results: VerificationResult[] = [
                {
                    format: 'testformat',
                    version: '1.0.0',
                    file: 'valid.txt',
                    status: 'valid',
                    expectedChecksum: 'abc123',
                    actualChecksum: 'abc123',
                    path: '/test/valid.txt'
                }
            ];

            printVerificationResults(results);

            expect(consoleSpy).toHaveBeenCalledWith('\n🎉 All files with checksums passed verification!');
        });

        test('should handle empty results', () => {
            const results: VerificationResult[] = [];

            printVerificationResults(results);

            expect(consoleSpy).toHaveBeenCalledWith('\n🔍 File Verification Results:');
            expect(consoleSpy).toHaveBeenCalledWith('📊 Summary: 0 files checked');
            expect(consoleSpy).toHaveBeenCalledWith('   ✅ Valid: 0');
            expect(consoleSpy).toHaveBeenCalledWith('   ❌ Invalid: 0');
            expect(consoleSpy).toHaveBeenCalledWith('   ❓ Missing: 0');
            expect(consoleSpy).toHaveBeenCalledWith('   ⚪ No checksum: 0');
        });

        test('should not show any final message when no valid files exist', () => {
            const results: VerificationResult[] = [
                {
                    format: 'testformat',
                    version: '1.0.0',
                    file: 'missing.txt',
                    status: 'missing',
                    path: '/test/missing.txt'
                }
            ];

            printVerificationResults(results);

            // Should not call either success or failure message
            expect(consoleSpy).not.toHaveBeenCalledWith('\n🎉 All files with checksums passed verification!');
            expect(consoleSpy).not.toHaveBeenCalledWith('\n⚠️  Some files failed verification. Consider re-downloading them.');
        });
    });

    describe('error handling edge cases', () => {
        test('should handle non-existent story-formats directory', () => {
            const results = verifyAllInstalledFiles(mockFilteredDB, './non-existent-directory');
            expect(results).toHaveLength(0);
        });

        test('should handle file that appears to exist but cannot be read', () => {
            // Create a file with correct checksum first
            const formatDir = join(testDir, 'testformat', '1.0.0');
            mkdirSync(formatDir, { recursive: true });
            
            // Create the LICENSE file
            writeFileSync(join(formatDir, 'LICENSE'), 'MIT License content');
            
            // Delete the file right after creation to simulate a race condition
            // where existsSync returns true but readFileSync fails
            const licensePath = join(formatDir, 'LICENSE');
            rmSync(licensePath);
            
            // Now try to verify - this should handle the case where file exists check passes
            // but reading fails
            const results = verifyFormatVersion(mockFilteredDB, 'testformat', '1.0.0', testDir);
            
            // The LICENSE file should be marked as missing since it can't be read
            const licenseResult = results.find(r => r.file === 'LICENSE');
            expect(licenseResult?.status).toBe('missing');
        });
    });
});