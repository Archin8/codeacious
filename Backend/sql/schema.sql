-- ---------- Cleanup existing tables & functions (if re-running schema) ----------
drop table if exists public.note_chunks cascade;
drop table if exists public.notes cascade;

create extension if not exists vector with schema extensions;

-- ---------- Tables ----------
create table public.notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  content     text not null check (char_length(content) between 1 and 10000),
  entry_date  date not null default current_date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index notes_user_date_idx on public.notes (user_id, entry_date desc, created_at desc);

create table public.note_chunks (
  id          uuid primary key default gen_random_uuid(),
  note_id     uuid not null references public.notes(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  chunk_index int  not null,
  content     text not null,
  embedding   extensions.vector(768) not null
);
create index note_chunks_user_idx on public.note_chunks (user_id);
create index note_chunks_note_idx on public.note_chunks (note_id);

-- ---------- Row Level Security (second layer) ----------
alter table public.notes       enable row level security;
alter table public.note_chunks enable row level security;

create policy notes_select on public.notes for select using (auth.uid() = user_id);
create policy notes_insert on public.notes for insert with check (auth.uid() = user_id);
create policy notes_update on public.notes for update using (auth.uid() = user_id);
create policy notes_delete on public.notes for delete using (auth.uid() = user_id);

create policy chunks_select on public.note_chunks for select using (auth.uid() = user_id);
create policy chunks_insert on public.note_chunks for insert with check (auth.uid() = user_id);
create policy chunks_delete on public.note_chunks for delete using (auth.uid() = user_id);

-- ---------- Atomic save (create or update) ----------
create or replace function public.save_note_with_chunks(
  p_user_id uuid, p_note_id uuid, p_content text, p_entry_date date, p_chunks jsonb
) returns uuid
language plpgsql
set search_path = public, extensions
as $$
declare v_note_id uuid;
begin
  if p_note_id is null then
    insert into notes (user_id, content, entry_date)
    values (p_user_id, p_content, p_entry_date)
    returning id into v_note_id;
  else
    update notes
       set content = p_content, entry_date = p_entry_date, updated_at = now()
     where id = p_note_id and user_id = p_user_id      -- ownership check
    returning id into v_note_id;
    if v_note_id is null then raise exception 'note_not_found'; end if;
    delete from note_chunks where note_id = v_note_id; -- drop stale vectors
  end if;

  insert into note_chunks (note_id, user_id, chunk_index, content, embedding)
  select v_note_id, p_user_id, (c->>'chunk_index')::int, c->>'content', (c->>'embedding')::vector
  from jsonb_array_elements(p_chunks) c;

  return v_note_id;
end $$;

-- ---------- Similarity search (always user-scoped) ----------
create or replace function public.match_chunks(
  query_embedding extensions.vector(768),
  match_user_id   uuid,
  match_count     int   default 5,
  min_similarity  float default 0.0,
  from_date       date  default null,
  to_date         date  default null
) returns table (chunk_id uuid, note_id uuid, content text, entry_date date, similarity float)
language sql stable
set search_path = public, extensions
as $$
  select c.id, c.note_id, c.content, n.entry_date,
         1 - (c.embedding <=> query_embedding) as similarity
  from note_chunks c
  join notes n on n.id = c.note_id
  where c.user_id = match_user_id
    and n.user_id = match_user_id
    and (from_date is null or n.entry_date >= from_date)
    and (to_date   is null or n.entry_date <= to_date)
    and 1 - (c.embedding <=> query_embedding) >= min_similarity
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

-- ---------- Lock the functions to the backend only ----------
revoke execute on function public.save_note_with_chunks(uuid,uuid,text,date,jsonb) from public, anon, authenticated;
revoke execute on function public.match_chunks(extensions.vector,uuid,int,float,date,date) from public, anon, authenticated;
grant  execute on function public.save_note_with_chunks(uuid,uuid,text,date,jsonb) to service_role;
grant  execute on function public.match_chunks(extensions.vector,uuid,int,float,date,date) to service_role;
