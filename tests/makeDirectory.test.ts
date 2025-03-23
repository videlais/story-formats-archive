import fs from 'node:fs';
import { makeDirectoryIfNotExists } from '../src/makeDirectoryIfNotExists';

describe('makeDirectoryIfNotExists', () => {
    const testDir = './tests/test';

    afterEach(() => {
        if (fs.existsSync(testDir)) {
            fs.rmdirSync(testDir);
        }
    });

    it('should create the directory if it does not exist', () => {
        makeDirectoryIfNotExists(testDir);
        expect(fs.existsSync(testDir)).toBe(true);
    });

    it('should not create the directory if it already exists', () => {
        fs.mkdirSync(testDir);
        makeDirectoryIfNotExists(testDir);
        expect(fs.existsSync(testDir)).toBe(true);
    });
    
});