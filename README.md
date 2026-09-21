# AoE III DE Field Notes

A curated public strategy guide for **Age of Empires III: Definitive Edition**.
Anyone can read civilization profiles and matchup guides. Only Discord users
explicitly approved in Supabase can edit and publish content.

## Run locally

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and add the Supabase project URL and
publishable/anon key. Without cloud credentials the bundled civilization
reference content remains readable, but public guide editing is unavailable.

## Set up Supabase

For a new project, run these files in order in the Supabase SQL Editor:

1. `supabase/migrations/202609210001_initial_schema.sql`
2. `supabase/migrations/202609210002_public_guide_admins.sql`

The second migration creates the public guide, admin allowlist, profile and
deck fields, public deck-image Storage bucket, and row-level security policies.
It preserves the original private guides as `personal_matchup_guides`.

Enable Discord in **Authentication → Providers** and add the Supabase callback
URL to the Discord application. Add local and production app URLs to the
Supabase redirect allow list.

## Grant admin access

1. Have the intended admin use **Admin sign in** once so the user appears under
   **Authentication → Users**.
2. Copy that user's UUID.
3. Run:

```sql
insert into public.guide_admins (user_id)
values ('USER_UUID_FROM_AUTH_USERS');
```

The user can then sign out and back in, select **Edit guide**, and manage
profiles, videos, shared matchups, decks, and screenshots. Signed-in users who
are not in `guide_admins` remain read-only.

To revoke access:

```sql
delete from public.guide_admins
where user_id = 'USER_UUID_FROM_AUTH_USERS';
```

## Content model

- `civilizations` stores public profile text, strengths, mechanics, and
  YouTube video IDs.
- `matchup_guides` stores one canonical directional guide per civilization
  pairing.
- `civilization_decks` stores ordered deck cards.
- The public `deck-images` Storage bucket contains admin-uploaded screenshots.
- `src/data/civilizations.ts` remains the offline fallback.

Routes are shareable:

- `/civilizations/british`
- `/civilizations/british/matchups/french`

## Scripts

- `npm run dev` — start the development server
- `npm run build` — type-check and create a production build
- `npm run lint` — run ESLint
- `npm run preview` — preview the production build
