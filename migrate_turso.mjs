import "dotenv/config";
import { readFileSync } from "node:fs";
import { createClient as CreateSupa } from "@supabase/supabase-js";
import { createClient as CreateTurso } from "@libsql/client";

const SupaUrl = process.env.SUPABASE_URL;
const SupaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TursoUrl = process.env.TURSO_DATABASE_URL;
const TursoToken = process.env.TURSO_AUTH_TOKEN;

if (!SupaUrl || !SupaKey) { console.error("Missing SUPABASE_URL / SERVICE_ROLE_KEY"); process.exit(1); }
if (!TursoUrl || !TursoToken) { console.error("Missing TURSO_DATABASE_URL / TURSO_AUTH_TOKEN"); process.exit(1); }

const Supa = CreateSupa(SupaUrl, SupaKey);
const Db = CreateTurso({ url: TursoUrl, authToken: TursoToken });

const Schema = readFileSync(new URL("./turso_schema.sql", import.meta.url), "utf8");
const Statements = Schema.split(";").map((S) => S.trim()).filter((S) => S && !S.startsWith("PRAGMA"));

console.log("Applying Turso schema...");
await Db.execute("PRAGMA foreign_keys=ON");
for (const Stmt of Statements) await Db.execute(Stmt);
console.log("Schema ok");

async function CopyTable(Table, BatchSize = 500) {
  let Offset = 0;
  let Total = 0;
  for (;;) {
    const { data, error } = await Supa.from(Table).select("*").range(Offset, Offset + BatchSize - 1);
    if (error) throw error;
    if (!data || !data.length) break;
    for (const Row of data) {
      const Clean = {};
      for (const [K, V] of Object.entries(Row)) {
        if (V === null || V === undefined) { Clean[K] = null; continue; }
        if (typeof V === "boolean") { Clean[K] = V ? 1 : 0; continue; }
        if (typeof V === "object") { Clean[K] = JSON.stringify(V); continue; }
        Clean[K] = V;
      }
      const Cols = Object.keys(Clean);
      const Place = Cols.map(() => "?").join(",");
      await Db.execute({ sql: `INSERT OR REPLACE INTO ${Table} (${Cols.join(",")}) VALUES (${Place})`, args: Cols.map((C) => Clean[C]) });
    }
    Total += data.length;
    console.log(`${Table}: ${Total} rows`);
    if (data.length < BatchSize) break;
    Offset += BatchSize;
  }
  return Total;
}

const Order = ["users", "templates", "links", "badges", "page_views"];
for (const T of Order) {
  try { await CopyTable(T, T === "page_views" ? 1000 : 500); }
  catch (Err) { console.error(`Skip ${T}:`, Err.message); }
}
console.log("Done. Verify counts in Turso dashboard, then truncate Supabase page_views to reclaim egress.");
