-- Run this AFTER the original supabase/schema.sql.
-- Initial internal-workspace policies. We will tighten these by role before exposing the client portal.

create policy "authenticated users can read profiles" on profiles for select to authenticated using (true);
create policy "users can create their own profile" on profiles for insert to authenticated with check (id = auth.uid());
create policy "users can update their own profile" on profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "authenticated users can read clients" on clients for select to authenticated using (true);
create policy "authenticated users can create clients" on clients for insert to authenticated with check (true);
create policy "authenticated users can update clients" on clients for update to authenticated using (true) with check (true);
create policy "authenticated users can delete clients" on clients for delete to authenticated using (true);

create policy "authenticated users can read projects" on projects for select to authenticated using (true);
create policy "authenticated users can create projects" on projects for insert to authenticated with check (true);
create policy "authenticated users can update projects" on projects for update to authenticated using (true) with check (true);
create policy "authenticated users can delete projects" on projects for delete to authenticated using (true);

create policy "authenticated users can read tasks" on tasks for select to authenticated using (true);
create policy "authenticated users can create tasks" on tasks for insert to authenticated with check (true);
create policy "authenticated users can update tasks" on tasks for update to authenticated using (true) with check (true);
create policy "authenticated users can delete tasks" on tasks for delete to authenticated using (true);
