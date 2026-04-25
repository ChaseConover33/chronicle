import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

type AvailableDomain = { id: string; name: string };

type Fixture = {
  name: string;
  notes?: string;
  raw_text: string;
  available_domains: AvailableDomain[];
  must_contain: string[];
  must_not_contain: string[];
  must_contain_domains?: string[];
  must_not_contain_domains?: string[];
};

const FIXTURE_DIR = join(process.cwd(), "tests", "voice-fixtures");
const ENDPOINT =
  process.env.CHRONICLE_URL ?? "http://localhost:3000/api/process/cleanup";

function parseModelArg(): string | undefined {
  const flag = process.argv.find((a) => a.startsWith("--model="));
  if (flag) return flag.slice("--model=".length);
  const idx = process.argv.indexOf("--model");
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return undefined;
}

const MODEL_OVERRIDE = parseModelArg();

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

type CleanupResponse = {
  formatted_content: string;
  suggested_domain_ids: string[];
};

async function runCleanup(f: Fixture): Promise<CleanupResponse> {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      raw_text: f.raw_text,
      available_domains: f.available_domains,
      ...(MODEL_OVERRIDE ? { model_id: MODEL_OVERRIDE } : {}),
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`HTTP ${response.status}: ${body}`);
  }
  return (await response.json()) as CleanupResponse;
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

function checkFixture(f: Fixture, response: CleanupResponse): CheckResult {
  const failures: string[] = [];
  const output = response.formatted_content;
  const domainSet = new Set(response.suggested_domain_ids);

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
  for (const id of f.must_contain_domains ?? []) {
    if (!domainSet.has(id)) {
      failures.push(
        `  ${RED}✗${RESET} expected domain not suggested: ${JSON.stringify(id)} (got: ${JSON.stringify([...domainSet])})`,
      );
    }
  }
  for (const id of f.must_not_contain_domains ?? []) {
    if (domainSet.has(id)) {
      failures.push(
        `  ${RED}✗${RESET} unexpected domain suggested: ${JSON.stringify(id)}`,
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
    `${BOLD}Voice check${RESET} — ${fixtures.length} fixture${fixtures.length === 1 ? "" : "s"}${MODEL_OVERRIDE ? ` ${DIM}(model=${MODEL_OVERRIDE})${RESET}` : ""}\n`,
  );

  const results: CheckResult[] = [];
  for (const { path, fixture } of fixtures) {
    process.stdout.write(`  ${fixture.name} ${DIM}(${path})${RESET} ... `);
    try {
      const response = await runCleanup(fixture);
      const result = checkFixture(fixture, response);
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
