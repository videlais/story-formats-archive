export const testEnvironment = 'node';
export const verbose = true;
export const collectCoverage = true;
export const coverageDirectory = 'coverage';
export const testMatch = ['**/__tests__/**/*.js?(x)', '**/?(*.)+(spec|test).js?(x)'];
export const moduleFileExtensions = ['js', 'json', 'jsx', 'node'];
export const extensionsToTreatAsEsm = ['.ts'];
export const transformIgnorePatterns = [
    'node_modules/(?!(p-limit|yocto-queue|cli-progress)/)'
];
export const transform = {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest'
};