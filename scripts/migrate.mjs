import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.CHRONICLE_DB_PATH ?? path.join(process.cwd(), "data", "chronicle.db");
const MIGRATIONS_DIR = process.env.CHRONICLE_MIGRATIONS_DIR ?? path.resolve(__dirname, "../src/db/migrations");

console.log(`Migrating ${DB_PATH} from ${MIGRATIONS_DIR}`);

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const db = drizzle(sqlite);
migrate(db, { migrationsFolder: MIGRATIONS_DIR });

sqlite.close();
console.log("Migrations applied.");
