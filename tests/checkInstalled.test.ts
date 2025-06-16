import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { checkInstalled } from '../src/checkInstalled.js';
import * as fs from 'node:fs';

jest.mock('node:fs');

describe('checkInstalled', () => {
    let consoleLogSpy: jest.Spied<typeof console.log>;
    beforeEach(() => {
        jest.clearAllMocks();
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('should print message if story-formats directory does not exist', () => {
        (fs.existsSync as jest.Mock).mockReturnValue(false);

        checkInstalled();

        expect(consoleLogSpy).toHaveBeenCalledWith('❌ There are no story formats installed.');
    });

    it('should print message if story-formats directory exists but is empty', () => {
        (fs.existsSync as jest.Mock).mockImplementation((path) => path === './story-formats');
        (fs.readdirSync as jest.Mock).mockReturnValue([]);

        checkInstalled();

        expect(consoleLogSpy).toHaveBeenCalledWith('❌ There are no story formats installed.');
    });

    it('should detect format.js directly under story-formats', () => {
        (fs.existsSync as jest.Mock).mockImplementation((path) => path === './story-formats' || path === './story-formats/format.js');
        (fs.readdirSync as jest.Mock).mockImplementation((path) => {
            if (path === './story-formats') {
                return [{ isFile: () => true, isDirectory: () => false, name: 'format.js' }];
            }
            return [];
        });
        (fs.readFileSync as jest.Mock).mockReturnValue('{"version": "1.2.3"}');

        checkInstalled();

        expect(consoleLogSpy).toHaveBeenCalledWith('\tformat.js (version: 1.2.3)');
    });

    it('should detect format.js inside a format directory', () => {
        (fs.existsSync as jest.Mock).mockImplementation((path) =>
            path === './story-formats' ||
            path === './story-formats/formatA/format.js'
        );
        (fs.readdirSync as jest.Mock).mockImplementation((path) => {
            if (path === './story-formats') {
                return [{ isFile: () => false, isDirectory: () => true, name: 'formatA' }];
            }
            if (path === './story-formats/formatA') {
                return [{ isFile: () => true, isDirectory: () => false, name: 'format.js' }];
            }
            return [];
        });
        (fs.readFileSync as jest.Mock).mockReturnValue('{"version": "2.0.0"}');

        checkInstalled();

        expect(consoleLogSpy).toHaveBeenCalledWith('\tformatA (version: 2.0.0)');
    });

    it('should detect format.js inside a versioned subdirectory', () => {
        (fs.existsSync as jest.Mock).mockImplementation((path) =>
            path === './story-formats' ||
            path === './story-formats/formatB/1.0.1/format.js'
        );
        (fs.readdirSync as jest.Mock).mockImplementation((path) => {
            if (path === './story-formats') {
                return [{ isFile: () => false, isDirectory: () => true, name: 'formatB' }];
            }
            if (path === './story-formats/formatB') {
                return [{ isFile: () => false, isDirectory: () => true, name: '1.0.1' }];
            }
            return [];
        });
        (fs.readFileSync as jest.Mock).mockReturnValue('{"version": "1.0.1"}');

        checkInstalled();

        expect(consoleLogSpy).toHaveBeenCalledWith('\tformatB (version: 1.0.1)');
    });

    it('should skip files without version in story-formats directory', () => {
        (fs.existsSync as jest.Mock).mockImplementation((path => path === './story-formats' || path === './story-formats/format.js'));
        (fs.readdirSync as jest.Mock).mockImplementation((path) => {
            if (path === './story-formats') {
                return [{ isFile: () => true, isDirectory: () => false, name: 'format.js' }];
            }
            return [];
        });
        (fs.readFileSync as jest.Mock).mockReturnValue('no version here');

        checkInstalled();

        expect(consoleLogSpy).toHaveBeenCalledWith('❌ There are no story formats installed.');
    });

    it('should skip files without version in story-formats/formatA directory', () => {
        (fs.existsSync as jest.Mock).mockImplementation((path) =>
            path === './story-formats' ||
            path === './story-formats/formatA/format.js'
        );
        (fs.readdirSync as jest.Mock).mockImplementation((path) => {
            if (path === './story-formats') {
                return [{ isFile: () => false, isDirectory: () => true, name: 'formatA' }];
            }
            if (path === './story-formats/formatA') {
                return [{ isFile: () => true, isDirectory: () => false, name: 'format.js' }];
            }
            return [];
        });
        (fs.readFileSync as jest.Mock).mockReturnValue('no version here');

        checkInstalled();

        expect(consoleLogSpy).toHaveBeenCalledWith('❌ There are no story formats installed.');
    });

    it('should skip files without version in story-formats/formatB/1.0.0 directory', () => {
        (fs.existsSync as jest.Mock).mockImplementation((path) =>
            path === './story-formats' ||
            path === './story-formats/formatB/1.0.0/format.js'
        );
        (fs.readdirSync as jest.Mock).mockImplementation((path) => {
            if (path === './story-formats') {
                return [{ isFile: () => false, isDirectory: () => true, name: 'formatB' }];
            }
            if (path === './story-formats/formatB') {
                return [{ isFile: () => false, isDirectory: () => true, name: '1.0.0' }];
            }
            return [];
        });
        (fs.readFileSync as jest.Mock).mockReturnValue('no version here');

        checkInstalled();

        expect(consoleLogSpy).toHaveBeenCalledWith('❌ There are no story formats installed.');
    });

    it('should list multiple formats', () => {
        (fs.existsSync as jest.Mock).mockImplementation((path) =>
            path === './story-formats' ||
            path === './story-formats/formatA/format.js' ||
            path === './story-formats/formatB/1.0.0/format.js'
        );
        (fs.readdirSync as jest.Mock).mockImplementation((path) => {
            if (path === './story-formats') {
                return [
                    { isFile: () => false, isDirectory: () => true, name: 'formatA' },
                    { isFile: () => false, isDirectory: () => true, name: 'formatB' }
                ];
            }
            if (path === './story-formats/formatA') {
                return [{ isFile: () => true, isDirectory: () => false, name: 'format.js' }];
            }
            if (path === './story-formats/formatB') {
                return [{ isFile: () => false, isDirectory: () => true, name: '1.0.0' }];
            }
            return [];
        });
        (fs.readFileSync as jest.Mock).mockImplementation((path) => {
            // Create copy of path as a string to avoid TypeScript error
            const pathString = path as string;
            if (pathString.endsWith('formatA/format.js')) return '{"version": "2.1.0"}';
            if (pathString.endsWith('formatB/1.0.0/format.js')) return '{"version": "1.0.0"}';
            return '';
        });

        checkInstalled();

        expect(consoleLogSpy).toHaveBeenCalledWith('\tformatA (version: 2.1.0)');
        expect(consoleLogSpy).toHaveBeenCalledWith('\tformatB (version: 1.0.0)');
    });

    it('should handle when story-formats directory contains format.js file, the story format directory contains a format.js file, and there is a version directory that also contains a format.js file', () => {
        (fs.existsSync as jest.Mock).mockImplementation((path) =>
            path === './story-formats' ||
            path === './story-formats/format.js' ||
            path === './story-formats/formatC/format.js' ||
            path === './story-formats/formatD/1.2.3/format.js'
        );
        (fs.readdirSync as jest.Mock).mockImplementation((path) => {
            if (path === './story-formats') {
                return [
                    { isFile: () => true, isDirectory: () => false, name: 'format.js' },
                    { isFile: () => false, isDirectory: () => true, name: 'formatC' },
                    { isFile: () => false, isDirectory: () => true, name: 'formatD' }
                ];
            }
            if (path === './story-formats/formatC') {
                return [{ isFile: () => true, isDirectory: () => false, name: 'format.js' }];
            }
            if (path === './story-formats/formatD') {
                return [{ isFile: () => false, isDirectory: () => true, name: '1.2.3' }];
            }
            if (path === './story-formats/formatD/1.2.3') {
                return [{ isFile: () => true, isDirectory: () => false, name: 'format.js' }];
            }
            if (path === './story-formats/format.js') {
                return [{ isFile: () => true, isDirectory: () => false, name: 'format.js' }];
            }
            return [];
        });

        (fs.readFileSync as jest.Mock).mockImplementation((path) => {
            const pathString = path as string;
            if (pathString.endsWith('story-formats/format.js')) return '{"version": "0.9.0"}';
            if (pathString.endsWith('formatC/format.js')) return '{"version": "3.2.1"}';
            if (pathString.endsWith('formatD/1.2.3/format.js')) return '{"version": "1.2.3"}';
            return '';
        });

        checkInstalled();

        expect(consoleLogSpy).toHaveBeenCalledWith('\tformat.js (version: 0.9.0)');
        expect(consoleLogSpy).toHaveBeenCalledWith('\tformatC (version: 3.2.1)');
        expect(consoleLogSpy).toHaveBeenCalledWith('\tformatD (version: 1.2.3)');
    });

    it('should handle no formats installed', () => {
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readdirSync as jest.Mock).mockReturnValue([]);

        checkInstalled();

        expect(consoleLogSpy).toHaveBeenCalledWith('❌ There are no story formats installed.');
    });

    it('should handle searching story-formats, story-formats/formatA, and story-formats/formatB/1.0.0 when none of them have a format.js file', () => {
        (fs.existsSync as jest.Mock).mockImplementation((path) =>
            path === './story-formats' ||
            path === './story-formats/formatA' ||
            path === './story-formats/formatB/1.0.0'
        );
        (fs.readdirSync as jest.Mock).mockImplementation((path) => {
            if (path === './story-formats') {
                return [{ isFile: () => false, isDirectory: () => true, name: 'formatA' }, { isFile: () => false, isDirectory: () => true, name: 'formatB' }];
            }
            if (path === './story-formats/formatA') {
                return [];
            }
            if (path === './story-formats/formatB') {
                return [{ isFile: () => false, isDirectory: () => true, name: '1.0.0' }];
            }
            return [];
        });

        checkInstalled();

        expect(consoleLogSpy).toHaveBeenCalledWith('❌ There are no story formats installed.');
    });
});
