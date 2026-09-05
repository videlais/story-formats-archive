/**
 * Validates official/index.json and unofficial/index.json against
 * schema/index.schema.json, then verifies SHA-256 checksums for all listed
 * files against the files on disk.
 *
 * Run from the repository root:
 *   deno run --allow-read --allow-env .github/scripts/verify_checksums.ts
 *
 * Exits with code 1 if the schema is violated, any checksum fails, or a
 * listed file is missing.
 */

import Ajv2020 from "npm:ajv@8/dist/2020.js";
import type { ValidateFunction } from "npm:ajv@8";

interface FormatEntry {
  name: string;
  version?: string;
  files: string[];
  checksums: Record<string, string>;
}

interface IndexFile {
  twine1?: FormatEntry[];
  twine2?: FormatEntry[];
}

async function validateSchema(
  indexPath: string,
  validate: ValidateFunction,
): Promise<number> {
  const data = JSON.parse(await Deno.readTextFile(indexPath));
  if (validate(data)) {
    console.log(`SCHEMA OK  ${indexPath}`);
    return 0;
  }
  console.error(`SCHEMA FAIL  ${indexPath}`);
  for (const err of validate.errors ?? []) {
    console.error(`      ${err.instancePath || "/"} ${err.message}`);
  }
  return validate.errors?.length ?? 1;
}

async function sha256Hex(filePath: string): Promise<string> {
  const data = await Deno.readFile(filePath);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyIndex(
  indexPath: string,
  basePath: string,
): Promise<{ passed: number; failed: number; missing: number }> {
  const index: IndexFile = JSON.parse(await Deno.readTextFile(indexPath));
  let passed = 0;
  let failed = 0;
  let missing = 0;

  for (const [twineVersion, formats] of Object.entries(index)) {
    if (!Array.isArray(formats)) continue;

    for (const format of formats) {
      if (!format.files.length) continue;

      const version = format.version ?? "unknown";
      const formatPath =
        `${basePath}/${twineVersion}/${format.name}/${version}`;

      for (const file of format.files) {
        const expected = format.checksums[file];
        if (expected === undefined) continue;

        const filePath = `${formatPath}/${file}`;

        try {
          const actual = await sha256Hex(filePath);
          if (actual === expected) {
            console.log(`PASS  ${filePath}`);
            passed++;
          } else {
            console.error(`FAIL  ${filePath}`);
            console.error(`      expected: ${expected}`);
            console.error(`      actual:   ${actual}`);
            failed++;
          }
        } catch {
          console.error(`MISSING  ${filePath}`);
          missing++;
        }
      }
    }
  }

  return { passed, failed, missing };
}

const schema = JSON.parse(
  await Deno.readTextFile("schema/index.schema.json"),
);
const ajv = new Ajv2020({ allErrors: true, strict: false });
const validate = ajv.compile(schema);

const schemaErrors =
  (await validateSchema("official/index.json", validate)) +
  (await validateSchema("unofficial/index.json", validate));

const [officialResult, unofficialResult] = await Promise.all([
  verifyIndex("official/index.json", "official"),
  verifyIndex("unofficial/index.json", "unofficial"),
]);

const passed = officialResult.passed + unofficialResult.passed;
const failed = officialResult.failed + unofficialResult.failed;
const missing = officialResult.missing + unofficialResult.missing;

console.log(`\n--- Results ---`);
console.log(`Schema errors: ${schemaErrors}`);
console.log(`Passed:  ${passed}`);
console.log(`Failed:  ${failed}`);
console.log(`Missing: ${missing}`);

if (schemaErrors > 0 || failed > 0 || missing > 0) {
  Deno.exit(1);
}
