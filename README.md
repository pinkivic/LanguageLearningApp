# Korean SRS (MVP)

Minimal web app to practice Korean vocabulary using Supabase as the database.

## 1) Create the database table (Supabase)

In Supabase → **SQL Editor**, run:

- `supabase/schema.sql`

Then insert a few rows:

```sql
insert into public.cards (french, korean) values
  ('bonjour', '안녕하세요'),
  ('merci', '감사합니다');
```

## 2) Configure env vars

Copy `.env.example` → `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 3) Run locally

```bash
npm install
npm run dev
```

## 4) Deploy to Vercel

Create a new Vercel project from this repo and add the same env vars in Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Notes

- Mode **SRS** prioritizes cards with `due_at <= now()` (and fills remaining slots with the soonest upcoming).
- Mode **Lowest streak** picks the lowest `streak` first.
- French → Korean is auto-graded (exact match after normalization). Korean → French is self-graded (Yes/No).
- Security: the provided `schema.sql` keeps RLS disabled for easiest setup; if you deploy publicly, consider enabling Supabase Auth + RLS before sharing the URL.
