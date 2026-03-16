import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { calculateChecksum } from './downloadUtils.js';
import { validatePathComponent, ensureWithinBaseDir } from './paths.js';
/**
 * Verify a single file against its expected checksum
 */
function verifyFile(filePath, expectedChecksum) {
    if (!existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }
    const fileData = readFileSync(filePath);
    const actualChecksum = calculateChecksum(fileData);
    const valid = actualChecksum === expectedChecksum;
    return { valid, actualChecksum };
}
/**
 * Verify all downloaded files for a specific story format and version
 */
export function verifyFormatVersion(filteredDB, formatName, version, storyFormatsDir = './story-formats') {
    const results = [];
    const resolvedDir = resolve(storyFormatsDir);
    // Validate path components to prevent directory traversal
    validatePathComponent(formatName);
    validatePathComponent(version);
    // Check if format exists in database
    if (!filteredDB[formatName]) {
        throw new Error(`Story format "${formatName}" not found in database`);
    }
    const formatEntry = filteredDB[formatName].find(entry => entry.version === version);
    if (!formatEntry) {
        throw new Error(`Version "${version}" not found for story format "${formatName}"`);
    }
    // Verify each file
    for (const filename of formatEntry.files) {
        validatePathComponent(filename);
        const filePath = join(resolvedDir, formatName, version, filename);
        ensureWithinBaseDir(filePath, resolvedDir);
        const expectedChecksum = formatEntry.checksums?.[filename];
        const result = {
            format: formatName,
            version,
            file: filename,
            path: filePath,
            status: 'missing'
        };
        if (!expectedChecksum) {
            result.status = 'no-checksum';
        }
        else if (!existsSync(filePath)) {
            result.status = 'missing';
        }
        else {
            try {
                const { valid, actualChecksum } = verifyFile(filePath, expectedChecksum);
                result.expectedChecksum = expectedChecksum;
                result.actualChecksum = actualChecksum;
                result.status = valid ? 'valid' : 'invalid';
            }
            catch {
                result.status = 'missing';
            }
        }
        results.push(result);
    }
    return results;
}
/**
 * Verify all downloaded files for all installed story formats
 */
export function verifyAllInstalledFiles(filteredDB, storyFormatsDir = './story-formats') {
    const results = [];
    // Get all installed formats and versions
    const installedFormats = getInstalledFormats(storyFormatsDir);
    for (const { format, version } of installedFormats) {
        try {
            const formatResults = verifyFormatVersion(filteredDB, format, version, storyFormatsDir);
            results.push(...formatResults);
        }
        catch {
            // If format/version not in database, create a result indicating this
            results.push({
                format,
                version,
                file: 'N/A',
                status: 'no-checksum',
                path: join(storyFormatsDir, format, version)
            });
        }
    }
    return results;
}
/**
 * Get all installed story formats and versions from the story-formats directory
 */
function getInstalledFormats(storyFormatsDir = './story-formats') {
    const installations = [];
    if (!existsSync(storyFormatsDir)) {
        return installations;
    }
    try {
        const formatDirs = readdirSync(storyFormatsDir).filter((item) => {
            const itemPath = join(storyFormatsDir, item);
            return statSync(itemPath).isDirectory();
        });
        for (const formatDir of formatDirs) {
            const formatPath = join(storyFormatsDir, formatDir);
            try {
                const versionDirs = readdirSync(formatPath).filter((item) => {
                    const itemPath = join(formatPath, item);
                    return statSync(itemPath).isDirectory();
                });
                for (const versionDir of versionDirs) {
                    installations.push({
                        format: formatDir,
                        version: versionDir
                    });
                }
            }
            catch {
                // Skip if can't read format directory
                continue;
            }
        }
    }
    catch {
        // Return empty array if can't read story-formats directory
    }
    return installations;
}
/**
 * Print verification results in a formatted way
 */
export function printVerificationResults(results) {
    let totalFiles = 0;
    let validFiles = 0;
    let invalidFiles = 0;
    let missingFiles = 0;
    let noChecksumFiles = 0;
    console.log('\n🔍 File Verification Results:');
    console.log('═'.repeat(80));
    const groupedResults = results.reduce((acc, result) => {
        const key = `${result.format}@${result.version}`;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(result);
        return acc;
    }, {});
    for (const [formatVersion, formatResults] of Object.entries(groupedResults)) {
        console.log(`\n📦 ${formatVersion}:`);
        for (const result of formatResults) {
            totalFiles++;
            let icon = '';
            let status = '';
            switch (result.status) {
                case 'valid':
                    icon = '✅';
                    status = 'VALID';
                    validFiles++;
                    break;
                case 'invalid':
                    icon = '❌';
                    status = 'INVALID';
                    invalidFiles++;
                    break;
                case 'missing':
                    icon = '❓';
                    status = 'MISSING';
                    missingFiles++;
                    break;
                case 'no-checksum':
                    icon = '⚪';
                    status = 'NO CHECKSUM';
                    noChecksumFiles++;
                    break;
            }
            console.log(`  ${icon} ${result.file} - ${status}`);
            if (result.status === 'invalid') {
                console.log(`     Expected: ${result.expectedChecksum}`);
                console.log(`     Actual:   ${result.actualChecksum}`);
            }
        }
    }
    console.log('\n' + '═'.repeat(80));
    console.log(`📊 Summary: ${totalFiles} files checked`);
    console.log(`   ✅ Valid: ${validFiles}`);
    console.log(`   ❌ Invalid: ${invalidFiles}`);
    console.log(`   ❓ Missing: ${missingFiles}`);
    console.log(`   ⚪ No checksum: ${noChecksumFiles}`);
    if (invalidFiles > 0) {
        console.log('\n⚠️  Some files failed verification. Consider re-downloading them.');
    }
    else if (validFiles > 0) {
        console.log('\n🎉 All files with checksums passed verification!');
    }
}
