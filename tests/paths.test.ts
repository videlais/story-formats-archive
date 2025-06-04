import paths from '../src/paths.js';

describe('Paths', () => {
    it('should have the correct official URL', () => {
        expect(paths.official_URL).toBe('https://videlais.github.io/story-formats-archive/official/index.json');
    });

    it('should have the correct base URL', () => {
        expect(paths.base_URL).toBe('https://raw.githubusercontent.com/videlais/story-formats-archive/refs/heads/docs/official/twine2');
    });
});