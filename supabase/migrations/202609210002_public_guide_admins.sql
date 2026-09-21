-- Convert private notebooks into one public guide edited by approved admins.

create table public.guide_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.guide_admins enable row level security;

create policy "Users can check their own admin access"
  on public.guide_admins for select
  using (auth.uid() = user_id);

create or replace function public.is_guide_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.guide_admins
    where user_id = auth.uid()
  );
$$;

-- Keep existing private guides available for a future export, but stop using
-- them in the public guide application.
alter table public.matchup_guides rename to personal_matchup_guides;

create table public.matchup_guides (
  id uuid primary key default gen_random_uuid(),
  civilization_id text not null references public.civilizations(id) on delete cascade,
  opponent_id text not null references public.civilizations(id) on delete cascade,
  overview text not null default '',
  game_plan text not null default '',
  opening text not null default '',
  key_units text not null default '',
  timings text not null default '',
  threats text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint public_different_civilizations check (civilization_id <> opponent_id),
  constraint one_public_guide_per_matchup unique (civilization_id, opponent_id)
);

create index public_matchup_guides_pair_idx
  on public.matchup_guides(civilization_id, opponent_id);

alter table public.matchup_guides enable row level security;

create policy "Public matchup guides are readable by everyone"
  on public.matchup_guides for select
  using (true);

create policy "Admins can create matchup guides"
  on public.matchup_guides for insert
  with check (public.is_guide_admin());

create policy "Admins can update matchup guides"
  on public.matchup_guides for update
  using (public.is_guide_admin())
  with check (public.is_guide_admin());

create policy "Admins can delete matchup guides"
  on public.matchup_guides for delete
  using (public.is_guide_admin());

alter table public.civilizations
  add column playstyle text not null default '',
  add column economy text not null default '',
  add column military text not null default '',
  add column key_mechanics text[] not null default '{}',
  add column booming_video_id text;

update public.civilizations
set
  playstyle = summary,
  economy = strengths[1] || ' is the economic anchor. Protect the infrastructure that enables it and turn each resource spike into a deliberate timing.',
  military = array_to_string(strengths[2:3], ' and ') || ' define the strongest army shape. Scout before committing and transition before the counter mass is complete.',
  key_mechanics = strengths;

create policy "Admins can update civilizations"
  on public.civilizations for update
  using (public.is_guide_admin())
  with check (public.is_guide_admin());

create table public.civilization_decks (
  id uuid primary key default gen_random_uuid(),
  civilization_id text not null references public.civilizations(id) on delete cascade,
  slug text not null,
  title text not null,
  description text not null default '',
  image_path text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint one_deck_slug_per_civilization unique (civilization_id, slug)
);

create index civilization_decks_civilization_idx
  on public.civilization_decks(civilization_id, sort_order);

alter table public.civilization_decks enable row level security;

create policy "Civilization decks are readable by everyone"
  on public.civilization_decks for select
  using (true);

create policy "Admins can create civilization decks"
  on public.civilization_decks for insert
  with check (public.is_guide_admin());

create policy "Admins can update civilization decks"
  on public.civilization_decks for update
  using (public.is_guide_admin())
  with check (public.is_guide_admin());

create policy "Admins can delete civilization decks"
  on public.civilization_decks for delete
  using (public.is_guide_admin());

insert into public.civilization_decks
  (civilization_id, slug, title, description, sort_order)
select
  civilization.id,
  preset.slug,
  preset.title,
  preset.description,
  preset.sort_order
from public.civilizations as civilization
cross join (
  values
    ('standard', 'Standard supremacy', 'A flexible one-versus-one deck for open maps and unknown opponents.', 1),
    ('boom', 'Economic boom', 'A greedier deck focused on scaling the civilization''s core economy.', 2),
    ('team', 'Team game', 'A team-oriented deck with stronger scaling and shared-map utility.', 3)
) as preset(slug, title, description, sort_order);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'deck-images',
  'deck-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Deck images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'deck-images');

create policy "Admins can upload deck images"
  on storage.objects for insert
  with check (
    bucket_id = 'deck-images'
    and public.is_guide_admin()
  );

create policy "Admins can update deck images"
  on storage.objects for update
  using (
    bucket_id = 'deck-images'
    and public.is_guide_admin()
  )
  with check (
    bucket_id = 'deck-images'
    and public.is_guide_admin()
  );

create policy "Admins can delete deck images"
  on storage.objects for delete
  using (
    bucket_id = 'deck-images'
    and public.is_guide_admin()
  );
