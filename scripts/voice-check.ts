import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

type Fixture = {
  name: string;
  notes?: string;
  sections: { heading: string; rawText: string }[];
  must_contain: string[];
  must_not_contain: string[];
};

const FIXTURE_DIR = join(process.cwd(), "tests", "voice-fixtures");
const ENDPOINT =
  process.env.CHRONICLE_URL ?? "http://localhost:3000/api/process/cleanup";

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

function loadFixtures(): { path: string; fixture: Fixture }[] {
  const files = readdirSync(FIXTURE_DIR).filter((f) => f.endsWith(".json"));
  return files.map((file) => {
    const full = join(FIXTURE_DIR, file);
    const fixture = JSON.parse(readFileSync(full, "utf8")) as Fixture;
    return { path: file, fixture };
  });
}

async function runCleanup(f: Fixture): Promise<string> {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sections: f.sections }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`HTTP ${response.status}: ${body}`);
  }
  const data = (await response.json()) as { formattedContent: string };
  return data.formattedContent;
}

function excerpt(haystack: string, needle: string): string {
  const idx = haystack.indexOf(needle);
  if (idx === -1) return "(not found)";
  const start = Math.max(0, idx - 60);
  const end = Math.min(haystack.length, idx + needle.length + 60);
  return `...${haystack.slice(start, end)}...`;
}

type CheckResult = {
  fixture: string;
  passed: boolean;
  failures: string[];
};

function checkFixture(f: Fixture, output: string): CheckResult {
  const failures: string[] = [];
  for (const token of f.must_contain) {
    if (!output.includes(token)) {
      failures.push(`  ${RED}✗${RESET} missing: ${JSON.stringify(token)}`);
    }
  }
  for (const token of f.must_not_contain) {
    if (output.includes(token)) {
      failures.push(
        `  ${RED}✗${RESET} should not contain: ${JSON.stringify(token)}\n    at: ${DIM}${excerpt(output, token)}${RESET}`,
      );
    }
  }
  return { fixture: f.name, passed: failures.length === 0, failures };
}

async function main() {
  const fixtures = loadFixtures();
  if (fixtures.length === 0) {
    console.error(`No fixtures found in ${FIXTURE_DIR}`);
    process.exit(2);
  }

  console.log(
    `${BOLD}Voice check${RESET} — ${fixtures.length} fixture${fixtures.length === 1 ? "" : "s"}\n`,
  );

  const results: CheckResult[] = [];
  for (const { path, fixture } of fixtures) {
    process.stdout.write(`  ${fixture.name} ${DIM}(${path})${RESET} ... `);
    try {
      const output = await runCleanup(fixture);
      const result = checkFixture(fixture, output);
      results.push(result);
      if (result.passed) {
        console.log(`${GREEN}pass${RESET}`);
      } else {
        console.log(`${RED}FAIL${RESET}`);
        for (const f of result.failures) console.log(f);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`${RED}ERROR${RESET}\n  ${msg}`);
      results.push({ fixture: fixture.name, passed: false, failures: [msg] });
    }
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  console.log(
    `\n${BOLD}${passed}/${results.length} passed${RESET}${failed > 0 ? `, ${RED}${failed} failed${RESET}` : ""}`,
  );
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
