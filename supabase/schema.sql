-- Solusi OS production schema (Supabase/PostgreSQL)
create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('owner','admin','pm','designer','supervisor','purchase','accounts','client')),
  created_at timestamptz default now()
);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  phone text,
  email text,
  created_at timestamptz default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  client_id uuid references clients(id),
  contract_value numeric(14,2) default 0,
  approved_budget numeric(14,2) default 0,
  actual_cost numeric(14,2) default 0,
  progress numeric(5,2) default 0,
  status text default 'On Track',
  project_manager uuid references profiles(id),
  supervisor uuid references profiles(id),
  start_date date,
  due_date date,
  created_at timestamptz default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  owner uuid references profiles(id),
  priority text default 'Medium',
  status text default 'Open',
  due_date date,
  sop_step text,
  created_at timestamptz default now(),
  completed_at timestamptz
);

create table if not exists materials (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  category text,
  unit text,
  supplier text,
  rate numeric(14,2) default 0,
  image_url text,
  created_at timestamptz default now()
);

create table if not exists inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  material_id uuid references materials(id),
  project_id uuid references projects(id),
  type text check (type in ('stock_in','reserve','issue','return','adjustment')),
  quantity numeric(14,2) not null,
  unit_rate numeric(14,2) default 0,
  reference text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table if not exists moodboards (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id),
  name text not null,
  version integer default 1,
  status text default 'Draft',
  share_token text unique default encode(gen_random_bytes(16),'hex'),
  created_at timestamptz default now()
);

create table if not exists moodboard_items (
  id uuid primary key default gen_random_uuid(),
  moodboard_id uuid references moodboards(id) on delete cascade,
  material_id uuid references materials(id),
  label text,
  position integer default 0
);

create table if not exists approvals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id),
  moodboard_id uuid references moodboards(id),
  type text not null,
  title text not null,
  status text default 'Pending',
  client_note text,
  decided_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists issues (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id),
  title text not null,
  description text,
  severity text default 'Medium',
  owner uuid references profiles(id),
  status text default 'Open',
  due_date date,
  created_at timestamptz default now(),
  resolved_at timestamptz
);

create table if not exists site_reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id),
  supervisor uuid references profiles(id),
  labour_present integer default 0,
  work_completed text,
  remarks text,
  report_date date default current_date,
  created_at timestamptz default now()
);

create table if not exists site_photos (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references site_reports(id) on delete cascade,
  storage_path text not null,
  caption text,
  created_at timestamptz default now()
);

create table if not exists quotations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id),
  quote_no text unique not null,
  subtotal numeric(14,2) default 0,
  discount numeric(14,2) default 0,
  tax numeric(14,2) default 0,
  total numeric(14,2) default 0,
  margin_target numeric(5,2),
  status text default 'Draft',
  created_at timestamptz default now()
);

create table if not exists boq_lines (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id),
  item text not null,
  category text,
  quantity numeric(14,2) default 0,
  unit text,
  rate numeric(14,2) default 0,
  actual_cost numeric(14,2) default 0
);

create table if not exists procurement (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id),
  material_id uuid references materials(id),
  supplier text,
  quantity numeric(14,2) default 0,
  required_date date,
  estimated_value numeric(14,2) default 0,
  status text default 'Pending',
  po_no text,
  created_at timestamptz default now()
);

create table if not exists finance_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id),
  type text check (type in ('Invoice','Receipt','Expense')),
  reference text,
  amount numeric(14,2) not null,
  entry_date date default current_date,
  status text default 'Pending',
  created_at timestamptz default now()
);

create table if not exists sop_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  module text not null,
  created_at timestamptz default now()
);

create table if not exists sop_steps (
  id uuid primary key default gen_random_uuid(),
  sop_id uuid references sop_templates(id) on delete cascade,
  step_no integer not null,
  instruction text not null
);

create index if not exists idx_tasks_project on tasks(project_id);
create index if not exists idx_inventory_material on inventory_transactions(material_id);
create index if not exists idx_boq_project on boq_lines(project_id);
create index if not exists idx_finance_project on finance_entries(project_id);
create index if not exists idx_issues_project on issues(project_id);

-- Enable RLS. Add role-specific policies in production after creating auth users.
alter table profiles enable row level security;
alter table clients enable row level security;
alter table projects enable row level security;
alter table tasks enable row level security;
alter table materials enable row level security;
alter table inventory_transactions enable row level security;
alter table moodboards enable row level security;
alter table moodboard_items enable row level security;
alter table approvals enable row level security;
alter table issues enable row level security;
alter table site_reports enable row level security;
alter table site_photos enable row level security;
alter table quotations enable row level security;
alter table boq_lines enable row level security;
alter table procurement enable row level security;
alter table finance_entries enable row level security;
alter table sop_templates enable row level security;
alter table sop_steps enable row level security;
