#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write

/**
 * Install script for SFA-Get Deno version
 * This creates a global command that can be run from anywhere
 */

const INSTALL_DIR = `${Deno.env.get("HOME")}/.deno/bin`;
const SCRIPT_NAME = "sfa-get-deno";
const SCRIPT_PATH = `${INSTALL_DIR}/${SCRIPT_NAME}`;

// Create the bin directory if it doesn't exist
try {
    await Deno.mkdir(INSTALL_DIR, { recursive: true });
} catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) {
        throw error;
    }
}

// Get the current directory (where this script is located)
const currentDir = new URL(".", import.meta.url).pathname;

// Create the executable script content
const scriptContent = `#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write
// Auto-generated script for sfa-get-deno
import "${currentDir}index.ts";
`;

// Write the script
await Deno.writeTextFile(SCRIPT_PATH, scriptContent);

// Make it executable (on Unix-like systems)
if (Deno.build.os !== "windows") {
    await Deno.chmod(SCRIPT_PATH, 0o755);
}

console.log(`✅ Installed sfa-get-deno to ${SCRIPT_PATH}`);
console.log(`📋 Make sure ${INSTALL_DIR} is in your PATH`);
console.log(`🚀 You can now run: sfa-get-deno`);

// Add to PATH instructions
console.log(`\n📝 To add to PATH, add this line to your shell profile:`);
console.log(`export PATH="${INSTALL_DIR}:$PATH"`);
