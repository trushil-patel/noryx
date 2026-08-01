alter table public.knowledge_items
add column if not exists custom_tags text[] not null default '{}';

create index if not exists knowledge_items_custom_tags_idx
on public.knowledge_items using gin (custom_tags);

notify pgrst, 'reload schema';
