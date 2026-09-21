create extension if not exists "pgcrypto";

create table public.civilizations (
  id text primary key,
  name text not null,
  short_name text not null,
  region text not null check (region in ('European', 'Native American', 'Asian', 'African', 'Federal')),
  accent text not null,
  summary text not null default '',
  strengths text[] not null default '{}',
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table public.matchup_guides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
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
  constraint different_civilizations check (civilization_id <> opponent_id),
  constraint one_guide_per_matchup unique (user_id, civilization_id, opponent_id)
);

create index matchup_guides_user_id_idx on public.matchup_guides(user_id);
create index matchup_guides_pair_idx on public.matchup_guides(civilization_id, opponent_id);

alter table public.civilizations enable row level security;
alter table public.matchup_guides enable row level security;

create policy "Civilizations are readable by everyone"
  on public.civilizations for select
  using (true);

create policy "Users can read their own guides"
  on public.matchup_guides for select
  using (auth.uid() = user_id);

create policy "Users can create their own guides"
  on public.matchup_guides for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own guides"
  on public.matchup_guides for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own guides"
  on public.matchup_guides for delete
  using (auth.uid() = user_id);

insert into public.civilizations (id, name, short_name, region, accent, summary, strengths, sort_order) values
  ('american', 'United States', 'US', 'Federal', '#315d91', 'Flexible federal age-ups and shipment-driven tempo.', array['Federal states', 'Militia', 'Shipment tempo'], 1),
  ('aztec', 'Aztec', 'AZ', 'Native American', '#a94e34', 'Explosive infantry pressure backed by warrior priests.', array['Infantry mass', 'Warrior dance', 'Early pressure'], 2),
  ('british', 'British', 'BR', 'European', '#9e3d36', 'A manor-fueled economy supporting durable armies.', array['Manor boom', 'Longbows', 'Musketeers'], 3),
  ('chinese', 'Chinese', 'CH', 'Asian', '#b34c38', 'Banner armies and villages create broad strategic options.', array['Banner armies', 'Villages', 'Unit variety'], 4),
  ('danes', 'Danes', 'DA', 'European', '#9c443c', 'A mobile Nordic roster with flexible economic tools.', array['Mobility', 'Mercenaries', 'Flexible economy'], 5),
  ('dutch', 'Dutch', 'DU', 'European', '#c57832', 'Banks turn a compact economy into a strong midgame.', array['Banks', 'Skirmishers', 'Population efficiency'], 6),
  ('ethiopian', 'Ethiopians', 'ET', 'African', '#94723a', 'Alliance age-ups and influence enable adaptive armies.', array['Influence', 'Mountain monasteries', 'Alliance units'], 7),
  ('french', 'French', 'FR', 'European', '#365f97', 'Strong settlers and cavalry provide a resilient core.', array['Coureurs', 'Cuirassiers', 'Flexible tempo'], 8),
  ('german', 'Germans', 'GE', 'European', '#806547', 'Free Uhlans and powerful shipments reward clean macro.', array['Uhlans', 'Settler wagons', 'Shipments'], 9),
  ('hausa', 'Hausa', 'HA', 'African', '#6e7041', 'Influence, cattle, and alliances support tactical variety.', array['Cattle economy', 'Influence', 'Mixed armies'], 10),
  ('incan', 'Inca', 'IN', 'Native American', '#a66b32', 'Map control and durable infantry anchor expansion.', array['Kancha houses', 'Strongholds', 'Infantry'], 11),
  ('indian', 'Indians', 'ID', 'Asian', '#a56239', 'Villager shipments and specialized units scale smoothly.', array['Free villagers', 'Camels', 'Elephants'], 12),
  ('italian', 'Italians', 'IT', 'European', '#477254', 'Architects and technology rewards enable greedy play.', array['Architects', 'Lombards', 'Technology boom'], 13),
  ('iroquois', 'Haudenosaunee', 'HAU', 'Native American', '#6d6041', 'Fast age-ups and siege pressure create sharp timings.', array['Travois', 'Siege', 'Fast tempo'], 14),
  ('japanese', 'Japanese', 'JA', 'Asian', '#9a4742', 'Shrines and upgrade-rich armies scale efficiently.', array['Shrines', 'Daimyo', 'Upgrades'], 15),
  ('maltese', 'Maltese', 'MA', 'European', '#a6463d', 'Fixed defenses and specialists excel in prepared fights.', array['Fortifications', 'Fire throwers', 'Commanderies'], 16),
  ('mexican', 'Mexico', 'MX', 'Federal', '#557047', 'Revolts and federal states unlock unusual power spikes.', array['Revolts', 'Haciendas', 'Federal states'], 17),
  ('ottoman', 'Ottomans', 'OT', 'European', '#477458', 'Automatic villager production enables relentless tempo.', array['Free villagers', 'Artillery', 'Tempo'], 18),
  ('polish', 'Poles', 'PL', 'European', '#a54348', 'A cavalry-forward roster built around decisive momentum.', array['Cavalry', 'Tempo', 'Map presence'], 19),
  ('portuguese', 'Portuguese', 'PT', 'European', '#4e7657', 'Free town centers and range bonuses reward positioning.', array['Town centers', 'Range', 'Water maps'], 20),
  ('russian', 'Russians', 'RU', 'European', '#697a62', 'Batch production floods the map with cost-efficient units.', array['Batch training', 'Map control', 'Attrition'], 21),
  ('sioux', 'Lakota', 'LA', 'Native American', '#8b633e', 'Exceptional mobility punishes exposed armies and economies.', array['Cavalry', 'Mobility', 'Map control'], 22),
  ('spanish', 'Spanish', 'SP', 'European', '#a97835', 'Fast shipments and a broad roster support crisp timings.', array['Shipments', 'Lancers', 'Flexible openings'], 23),
  ('swedish', 'Swedes', 'SW', 'European', '#426d8a', 'Torps fuel a strong economy and mercenary transitions.', array['Torps', 'Caroleans', 'Mercenaries'], 24);
