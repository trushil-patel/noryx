begin;

create table if not exists public.collection_members (
  collection_id uuid not null references public.collections(id) on delete cascade,
  connection_id uuid not null references public.connections(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  added_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (collection_id, user_id)
);

alter table public.collection_members
add column if not exists connection_id uuid references public.connections(id) on delete cascade;

update public.collection_members cm
set connection_id = cn.id
from public.connections cn
where cm.connection_id is null
  and cn.status = 'accepted'
  and (
    (cn.requester_id = cm.added_by and cn.addressee_id = cm.user_id)
    or (cn.addressee_id = cm.added_by and cn.requester_id = cm.user_id)
  );

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.collection_members'::regclass
      and confrelid = 'public.collections'::regclass
      and contype = 'f'
  ) then
    alter table public.collection_members
    add constraint collection_members_collection_id_fkey
    foreign key (collection_id) references public.collections(id) on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.collection_members'::regclass
      and confrelid = 'public.profiles'::regclass
      and contype = 'f'
  ) then
    alter table public.collection_members
    add constraint collection_members_user_id_fkey
    foreign key (user_id) references public.profiles(user_id) on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.collection_members'::regclass
      and confrelid = 'public.connections'::regclass
      and contype = 'f'
  ) then
    alter table public.collection_members
    add constraint collection_members_connection_id_fkey
    foreign key (connection_id) references public.connections(id) on delete cascade;
  end if;
end
$$;

alter table public.collection_members enable row level security;

create or replace function public.is_collection_owner(p_collection_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.collections c
    where c.id = p_collection_id and c.owner_id = auth.uid()
  );
$$;

create or replace function public.is_collection_member(p_collection_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.collection_members cm
    where cm.collection_id = p_collection_id and cm.user_id = auth.uid()
  );
$$;

revoke all on function public.is_collection_owner(uuid) from public;
revoke all on function public.is_collection_member(uuid) from public;
grant execute on function public.is_collection_owner(uuid) to authenticated, service_role;
grant execute on function public.is_collection_member(uuid) to authenticated, service_role;

drop policy if exists "Collection owners manage members" on public.collection_members;
create policy "Collection owners manage members" on public.collection_members
for all using (public.is_collection_owner(collection_members.collection_id))
with check (
  auth.uid() = added_by
  and public.is_collection_owner(collection_members.collection_id)
  and exists (
    select 1 from public.connections cn
    where cn.id = collection_members.connection_id
      and cn.status = 'accepted'
      and (
        (cn.requester_id = auth.uid() and cn.addressee_id = collection_members.user_id)
        or (cn.addressee_id = auth.uid() and cn.requester_id = collection_members.user_id)
      )
  )
);

drop policy if exists "Members read own collection membership" on public.collection_members;
create policy "Members read own collection membership" on public.collection_members
for select using (auth.uid() = user_id);

drop policy if exists "Members read shared collections" on public.collections;
create policy "Members read shared collections" on public.collections
for select using (public.is_collection_member(collections.id));

drop policy if exists "Members read shared collection items" on public.collection_items;
create policy "Members read shared collection items" on public.collection_items
for select using (public.is_collection_member(collection_items.collection_id));

drop policy if exists "Members read shared knowledge" on public.knowledge_items;
create policy "Members read shared knowledge" on public.knowledge_items
for select using (
  exists (
    select 1
    from public.collection_items ci
    where ci.knowledge_item_id = knowledge_items.id
      and public.is_collection_member(ci.collection_id)
  )
);

drop policy if exists "Members read shared knowledge tags" on public.knowledge_tags;
create policy "Members read shared knowledge tags" on public.knowledge_tags
for select using (
  exists (
    select 1
    from public.collection_items ci
    where ci.knowledge_item_id = knowledge_tags.knowledge_item_id
      and public.is_collection_member(ci.collection_id)
  )
);

create index if not exists collection_members_user_idx
on public.collection_members (user_id, created_at desc);

notify pgrst, 'reload schema';

commit;
