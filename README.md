# Solusi OS — Production Starter v2

This version adds the first real production foundation:

- Supabase authentication gate
- Live Clients CRUD
- Live Projects CRUD linked to Clients
- Live Command Center KPIs from Supabase
- GitHub → Vercel compatible deployment

## Required Supabase setup

1. Keep the original `supabase/schema.sql` already run.
2. Run `supabase/migrations/001_auth_and_clients_projects.sql` in Supabase SQL Editor.
3. In Supabase → Authentication → Users, create the first user.
4. Sign in at `/login`.

Do not expose the Supabase secret/service-role key to the browser.
