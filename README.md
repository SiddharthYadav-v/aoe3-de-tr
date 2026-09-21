# AoE III DE Field Notes

A local-first matchup notebook for **Age of Empires III: Definitive Edition**, rebuilt as a React and TypeScript application. Each civilization pairing has an independent strategy guide, with optional Supabase cloud sync through Discord sign-in.

## Run locally

```bash
npm install
npm run dev
```

The app works without cloud credentials and saves guides in browser storage.

## Enable Supabase and Discord

1. Create a Supabase project.
2. Run the migration in `supabase/migrations/202609210001_initial_schema.sql` using the Supabase CLI or SQL editor.
3. Copy `.env.example` to `.env.local` and add the project URL and anon key.
4. In Supabase Authentication, enable the Discord provider and add its client ID and secret.
5. Add `http://localhost:5173` and the production site URL to the Supabase redirect URL allow list.
6. In the Discord developer portal, set the OAuth redirect URL to the callback URL shown by Supabase.

Row-level security limits every matchup guide to its owner. Civilization reference data is publicly readable and is seeded by the migration.

## Scripts

- `npm run dev` — start the development server
- `npm run build` — type-check and create a production build
- `npm run lint` — run ESLint
- `npm run preview` — preview the production build
