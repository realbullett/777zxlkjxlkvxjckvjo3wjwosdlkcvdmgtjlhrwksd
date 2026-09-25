import 'dotenv/config';
import { GetTurso } from './api/_lib/turso.js';
import fs from 'fs';
const c = GetTurso();
if (!c) { console.log('NO_TURSO_ENV'); process.exit(1); }
const sql = fs.readFileSync('turso_schema.sql','utf8');
const stmts = sql.split(';').map(s=>s.trim()).filter(s=>s && !s.startsWith('PRAGMA'));
let ok=0;
for (const s of stmts) { try { await c.execute(s); ok++; } catch(e){ console.log('ERR', String(e.message||e).slice(0,150)); } }
console.log('SCHEMA_OK', ok);
const r = await c.execute("SELECT name FROM sqlite_master WHERE type='table'");
console.log('TABLES:'+r.rows.map(x=>x.name).join(','));
