import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://dzhulqjqnysujmyeptbt.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "sb_publishable_hKzrIq90ERcmpta123WcJw_1Z5lTA1k"
);

const sql = `
create table if not exists hosted_files (
  id text primary key,
  user_id bigint references users(id) on delete cascade,
  kind text not null default 'media' check (kind in ('media', 'file')),
  filename text,
  content_type text,
  size integer,
  path text not null,
  views bigint default 0,
  created_at timestamptz default now()
);

create index if not exists idx_hosted_files_user on hosted_files (user_id);

alter table hosted_files enable row level security;

revoke all on hosted_files from anon;

drop policy if exists "service role can manage hosted_files" on hosted_files;
create policy "service role can manage hosted_files" on hosted_files for all to service_role using (true);

insert into hosted_files (id, user_id, kind, filename, content_type, size, path, views, created_at)
select id, user_id, 'media', filename, content_type, size, path, views, created_at
from hosted_images
on conflict (id) do nothing;
`;

const { error } = await supabase.rpc('exec_sql', { query: sql });
if (error) console.error("RPC error:", error);

const { data, error: e2 } = await supabase.from("users").select("*").limit(1);
console.log("Users:", data, "Error:", e2);