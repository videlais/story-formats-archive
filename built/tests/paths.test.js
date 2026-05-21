import { describe, it, expect } from '@jest/globals';
import paths, { validatePathComponent, ensureWithinBaseDir } from '../src/paths.js';
import { resolve } from 'node:path';
describe('Paths', () => {
    it('should have the correct official URL', () => {
        expect(paths.official_URL).toBe('https://videlais.github.io/story-formats-archive/official/index.json');
    });
    it('should have the correct base URL', () => {
        expect(paths.base_URL).toBe('https://raw.githubusercontent.com/videlais/story-formats-archive/refs/heads/docs/official/twine2');
    });
});
describe('validatePathComponent', () => {
    it('should not throw for a valid format name', () => {
        expect(() => validatePathComponent('chapbook')).not.toThrow();
    });
    it('should not throw for a valid version string', () => {
        expect(() => validatePathComponent('1.2.3')).not.toThrow();
    });
    it('should not throw for a valid filename with extension', () => {
        expect(() => validatePathComponent('format.js')).not.toThrow();
    });
    it('should throw for an empty string', () => {
        expect(() => validatePathComponent('')).toThrow('Invalid path component: contains disallowed characters');
    });
    it('should throw for a path traversal segment', () => {
        expect(() => validatePathComponent('..')).toThrow('Invalid path component: contains disallowed characters');
    });
    it('should throw for a segment starting with a dot', () => {
        expect(() => validatePathComponent('.hidden')).toThrow('Invalid path component: contains disallowed characters');
    });
    it('should throw for a segment containing a slash', () => {
        expect(() => validatePathComponent('foo/bar')).toThrow('Invalid path component: contains disallowed characters');
    });
    it('should throw for a segment containing a space', () => {
        expect(() => validatePathComponent('my format')).toThrow('Invalid path component: contains disallowed characters');
    });
    it('should throw for a segment containing shell-special characters', () => {
        expect(() => validatePathComponent('format;rm')).toThrow('Invalid path component: contains disallowed characters');
    });
});
describe('ensureWithinBaseDir', () => {
    it('should return the resolved path when the file is inside the base directory', () => {
        const base = '/tmp/story-formats';
        const file = '/tmp/story-formats/chapbook/1.0.0/format.js';
        const result = ensureWithinBaseDir(file, base);
        expect(result).toBe(resolve(file));
    });
    it('should accept a path that resolves exactly to the base directory', () => {
        const base = '/tmp/story-formats';
        const result = ensureWithinBaseDir('/tmp/story-formats', base);
        expect(result).toBe(resolve(base));
    });
    it('should throw when a path traverses above the base directory', () => {
        const base = '/tmp/story-formats';
        expect(() => ensureWithinBaseDir('/tmp/story-formats/../../etc/passwd', base))
            .toThrow('Path traversal detected');
    });
    it('should throw for an entirely different directory', () => {
        const base = '/tmp/story-formats';
        expect(() => ensureWithinBaseDir('/etc/passwd', base))
            .toThrow('Path traversal detected');
    });
    it('should throw for a sibling directory that shares the base prefix', () => {
        // Ensures the check uses sep-terminated prefix, not just startsWith on the string
        const base = '/tmp/story-formats';
        expect(() => ensureWithinBaseDir('/tmp/story-formats-evil/file.txt', base))
            .toThrow('Path traversal detected');
    });
});
