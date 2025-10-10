import axios, { AxiosResponse } from 'axios';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import pLimit from 'p-limit';
import * as cliProgress from 'cli-progress';

export interface DownloadOptions {
    concurrency?: number;
    retries?: number;
    timeout?: number;
    showProgress?: boolean;
}

export interface DownloadTask {
    url: string;
    filePath: string;
    filename: string;
    expectedChecksum?: string;
}

export interface DownloadResult {
    success: boolean;
    filePath: string;
    error?: string;
    checksum?: string;
}

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function getBackoffDelay(attempt: number, baseDelay = 1000): number {
    return Math.min(baseDelay * Math.pow(2, attempt), 30000);
}

/**
 * Download a single file with retry logic and exponential backoff
 */
async function downloadFileWithRetry(
    url: string,
    filePath: string,
    retries = 3,
    timeout = 30000
): Promise<{ data: Buffer; checksum: string }> {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response: AxiosResponse<Buffer> = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout,
            });
            
            const data = Buffer.from(response.data);
            const checksum = createHash('sha256').update(data).digest('hex');
            
            return { data, checksum };
        } catch (error) {
            lastError = error as Error;
            
            if (attempt < retries) {
                const delay = getBackoffDelay(attempt);
                console.log(`⚠️ Download failed for ${url}, retrying in ${delay}ms... (attempt ${attempt + 1}/${retries + 1})`);
                await sleep(delay);
            }
        }
    }
    
    throw new Error(`Failed to download ${url} after ${retries + 1} attempts: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Calculate SHA-256 checksum of a buffer
 */
export function calculateChecksum(data: Buffer): string {
    return createHash('sha256').update(data).digest('hex');
}

/**
 * Verify file integrity using checksum
 */
export function verifyChecksum(data: Buffer, expectedChecksum: string): boolean {
    const actualChecksum = calculateChecksum(data);
    return actualChecksum === expectedChecksum;
}

/**
 * Download multiple files concurrently with progress tracking
 */
export async function downloadFiles(
    tasks: DownloadTask[],
    options: DownloadOptions = {}
): Promise<DownloadResult[]> {
    const {
        concurrency = 3,
        retries = 3,
        timeout = 30000,
        showProgress = true
    } = options;
    
    if (tasks.length === 0) {
        return [];
    }
    
    const limit = pLimit(concurrency);
    
    // Initialize progress bar
    const progressBar = showProgress ? new cliProgress.SingleBar({
        format: 'Downloading |{bar}| {percentage}% | {value}/{total} files | {filename}',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true
    }) : null;
    
    if (progressBar) {
        progressBar.start(tasks.length, 0, { filename: 'Initializing...' });
    }
    
    const downloadPromises = tasks.map((task, index) =>
        limit(async (): Promise<DownloadResult> => {
            try {
                if (progressBar) {
                    progressBar.update(index, { filename: task.filename });
                }
                
                const { data, checksum } = await downloadFileWithRetry(
                    task.url,
                    task.filePath,
                    retries,
                    timeout
                );
                
                // Verify checksum if provided
                if (task.expectedChecksum && !verifyChecksum(data, task.expectedChecksum)) {
                    throw new Error(`Checksum verification failed for ${task.filename}`);
                }
                
                // Write file to disk
                writeFileSync(task.filePath, data);
                
                if (progressBar) {
                    progressBar.increment();
                }
                
                return {
                    success: true,
                    filePath: task.filePath,
                    checksum
                };
            } catch (error) {
                if (progressBar) {
                    progressBar.increment();
                }
                
                return {
                    success: false,
                    filePath: task.filePath,
                    error: (error as Error).message
                };
            }
        })
    );
    
    const downloadResults = await Promise.all(downloadPromises);
    
    if (progressBar) {
        progressBar.stop();
    }
    
    // Log results
    const successful = downloadResults.filter(r => r.success);
    const failed = downloadResults.filter(r => !r.success);
    
    if (showProgress) {
        console.log(`\n✅ Successfully downloaded: ${successful.length}/${tasks.length} files`);
        
        if (failed.length > 0) {
            console.log(`❌ Failed downloads: ${failed.length}`);
            failed.forEach(result => {
                console.log(`   • ${result.filePath}: ${result.error}`);
            });
        }
    }
    
    return downloadResults;
}

/**
 * Create download tasks from file lists
 */
export function createDownloadTasks(
    baseUrl: string,
    format: string,
    version: string,
    files: string[],
    baseDir: string
): DownloadTask[] {
    return files.map(file => ({
        url: `${baseUrl}/${format}/${version}/${file}`,
        filePath: `${baseDir}/${format}/${version}/${file}`,
        filename: file
    }));
}