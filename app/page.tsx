'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  LayoutDashboard,
  BriefcaseBusiness,
  Users,
  Palette,
  Images,
  CheckCircle2,
  ClipboardList,
  HardHat,
  AlertTriangle,
  Boxes,
  Truck,
  ReceiptText,
  Wallet,
  ExternalLink,
  Plus,
  Search,
  Bell,
  FileText,
  Menu,
  X,
  LogOut,
  UserPlus,
  RefreshCw
} from 'lucide-react';

type Client = {
  id: string;
  name: string;
  unit_building_name: string | null;
  unit_number: string | null;
  phone: string | null;
  email: string | null;
};

type Project = {
  id: string;
  name: string;
  client_id: string | null;
  contract_value: number;
  approved_budget: number;
  actual_cost: number;
  progress: number;
  status: string;
  start_date: string | null;
  due_date: string | null;
};

const nav = [
  ['Command Center', LayoutDashboard, 'home'],
  ['Sales & CRM', Users, 'sales'],
  ['Quotations', ReceiptText, 'quotations'],
  ['Design Studio', Palette, 'design'],
  ['Material Library', Images, 'library'],
  ['Moodboards', Images, 'moodboards'],
  ['Client Approvals', CheckCircle2, 'approvals'],
  ['Projects', BriefcaseBusiness, 'projects'],
  ['Tasks & SOP', ClipboardList, 'tasks'],
  ['Site Control', HardHat, 'site'],
  ['Labour', Users, 'labour'],
  ['Issues & Snags', AlertTriangle, 'issues'],
  ['Inventory', Boxes, 'inventory'],
  ['Procurement', Truck, 'procurement'],
  ['BOQ & Variations', FileText, 'boq'],
  ['Finance & P&L', Wallet, 'finance'],
  ['Client Portal', ExternalLink, 'portal']
] as const;

const money = (n: number) =>
  `₹${(Number(n || 0) / 100000).toFixed(1)}L`;

function Badge({ children }: { children: string }) {
  const good = [
    'On Track',
    'Done',
    'Paid',
    'Received',
    'Approved'
  ].includes(children);

  const bad = [
    'Critical',
    'Delayed',
    'Overdue',
    'At Risk'
  ].includes(children);

  return (
    <span
      className={`badge ${
        good ? 'good' : bad ? 'bad' : 'warn'
      }`}
    >
      {children}
    </span>
  );
}

function Card({
  children,
  className = '',
  onClick
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={`card ${className}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      {children}
    </div>
  );
}

function Section({
  title,
  sub,
  action
}: {
  title: string;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="sectionHead">
      <div>
        <h3>{title}</h3>
        {sub && <span>{sub}</span>}
      </div>

      {action}
    </div>
  );
}

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState('home');
  const [mobile, setMobile] = useState(false);
  const [query, setQuery] = useState('');

  const [modal, setModal] = useState<
    'client' | 'project' | null
  >(null);

  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [selectedProject, setSelectedProject] =
    useState<Project | null>(null);

  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data } =
      supabase.auth.onAuthStateChange((_event, s) => {
        setSession(s);
      });

    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      loadData();
    }
  }, [session]);

  async function loadData() {
    setError('');

    const [
      { data: c, error: ce },
      { data: p, error: pe }
    ] = await Promise.all([
      supabase
        .from('clients')
        .select('*')
        .order('created_at', {
          ascending: false
        }),

      supabase
        .from('projects')
        .select('*')
        .order('created_at', {
          ascending: false
        })
    ]);

    if (ce || pe) {
      setError(
        ce?.message ||
          pe?.message ||
          'Unable to load data'
      );
      return;
    }

    setClients(c || []);
    setProjects(p || []);
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  async function addClient(v: {
    name: string;
    unit_building_name: string;
    unit_number: string;
    phone: string;
    email: string;
  }) {
    const { data, error } = await supabase
      .from('clients')
      .insert(v)
      .select('*')
      .single();

    if (error) throw error;

    setClients(x => [data, ...x]);
    setModal(null);
  }

  async function addProject(v: {
    name: string;
    client_id: string;
    contract_value: number;
    approved_budget: number;
    start_date: string;
    due_date: string;
  }) {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        ...v,
        actual_cost: 0,
        progress: 0,
        status: 'On Track'
      })
      .select('*')
      .single();

    if (error) throw error;

    setProjects(x => [data, ...x]);
    setModal(null);
  }

  const totals = useMemo(
    () => ({
      book: projects.reduce(
        (a, p) =>
          a + Number(p.contract_value || 0),
        0
      ),

      cost: projects.reduce(
        (a, p) =>
          a + Number(p.actual_cost || 0),
        0
      )
    }),
    [projects]
  );

  if (loading) {
    return (
      <div className="loadingScreen">
        Loading Solusi OS…
      </div>
    );
  }

  if (!session) {
    if (typeof window !== 'undefined') {
      window.location.replace('/login');
    }

    return null;
  }

  const activeLabel =
    nav.find(x => x[2] === view)?.[0] ||
    'Command Center';

  return (
    <div className="app">

      {/* SIDEBAR */}

      <aside
        className={`sidebar ${
          mobile ? 'show' : ''
        }`}
      >
        <div className="brand">
          <div className="mark">S</div>

          <div>
            <b>solusi</b>
            <small>OPERATING SYSTEM</small>
          </div>

          <button
            className="mobileClose"
            onClick={() => setMobile(false)}
          >
            <X size={18} />
          </button>
        </div>

        <div className="workspace">
          <small>WORKSPACE</small>
          <b>Solusi Design</b>
          <span>Commercial Interiors</span>
        </div>

        <nav>
          {nav.map(
            ([label, Icon, key]) => (
              <button
                key={key}
                className={
                  view === key
                    ? 'active'
                    : ''
                }
                onClick={() => {
                  setView(key);
                  setSelectedProject(null);
                  setMobile(false);
                }}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            )
          )}
        </nav>

        <div className="user">
          <div className="avatar">SH</div>

          <div>
            <b>
              {session.user.email?.split('@')[0] ||
                'Owner'}
            </b>

            <small>
              Authenticated user
            </small>
          </div>

          <button
            className="iconBtn dark"
            title="Sign out"
            onClick={signOut}
          >
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* MAIN */}

      <main>

        <header>
          <div className="headerTitle">

            <button
              className="hamb"
              onClick={() => setMobile(true)}
            >
              <Menu size={20} />
            </button>

            <div className="eyebrow">
              SOLUSI DESIGN /{' '}
              {activeLabel.toUpperCase()}
            </div>

            <h1>{activeLabel}</h1>
          </div>

          <div className="headerTools">

            <div className="search">
              <Search size={15} />

              <input
                value={query}
                onChange={e =>
                  setQuery(e.target.value)
                }
                placeholder="Search clients, projects…"
              />
            </div>

            <button className="iconBtn">
              <Bell size={16} />
            </button>

            {(view === 'projects' ||
              view === 'home') && (
              <button
                className="primary"
                onClick={() =>
                  setModal(
                    view === 'projects'
                      ? 'project'
                      : 'client'
                  )
                }
              >
                <Plus size={15} />
                Create
              </button>
            )}
          </div>
        </header>

        <section className="page">

          {error && (
            <div className="authError pageAlert">
              {error}

              <button
                className="small"
                onClick={loadData}
              >
                <RefreshCw size={12} />
                Retry
              </button>
            </div>
          )}

          {view === 'home' ? (

            <Dashboard
              projects={projects}
              clients={clients}
              totals={totals}
            />

          ) : view === 'projects' ? (

            selectedProject ? (

              <ProjectDetail
                project={selectedProject}
                clients={clients}
                onBack={() =>
                  setSelectedProject(null)
                }
              />

            ) : (

              <Projects
                projects={projects}
                clients={clients}
                query={query}
                onAdd={() =>
                  setModal('project')
                }
                onOpen={setSelectedProject}
              />

            )

          ) : view === 'sales' ? (

            <Clients
              clients={clients}
              query={query}
              onAdd={() =>
                setModal('client')
              }
            />

          ) : (

            <Placeholder
              title={activeLabel}
            />

          )}

        </section>
      </main>

      {/* MODALS */}

      {modal === 'client' && (
        <ClientModal
          close={() => setModal(null)}
          save={addClient}
        />
      )}

      {modal === 'project' && (
        <ProjectModal
          clients={clients}
          close={() => setModal(null)}
          save={addProject}
        />
      )}

    </div>
  );
}


/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard({
  projects,
  clients,
  totals
}: {
  projects: Project[];
  clients: Client[];
  totals: {
    book: number;
    cost: number;
  };
}) {
  return (
    <>
      <div className="welcome">

        <div>
          <h2>
            Good evening, Shubh.
          </h2>

          <p>
            Your live operating view —
            connected to Supabase.
          </p>
        </div>

        <span className="date">
          Live data • {projects.length} projects •{' '}
          {clients.length} clients
        </span>

      </div>

      <div className="kpis grid5">

        <Kpi
          title="PROJECT BOOK"
          value={money(totals.book)}
          note={`${projects.length} active projects`}
        />

        <Kpi
          title="ACTUAL COST"
          value={money(totals.cost)}
          note="From project records"
        />

        <Kpi
          title="GROSS PROFIT"
          value={money(
            totals.book - totals.cost
          )}
          note="Contract value − actual cost"
          good
        />

        <Kpi
          title="CLIENTS"
          value={String(
            clients.length
          )}
          note="CRM records"
        />

        <Kpi
          title="PROJECTS"
          value={String(
            projects.length
          )}
          note="Live database"
        />

      </div>

      <div className="twoCols">

        <Card>

          <Section
            title="Project Command"
            sub="Live project records"
          />

          {projects.length === 0 ? (

            <Empty
              text="Create your first project."
            />

          ) : (

            projects
              .slice(0, 8)
              .map(p => (

                <div
                  className="project"
                  key={p.id}
                >

                  <div className="projectTop">
                    <b>{p.name}</b>
                    <Badge>
                      {p.status}
                    </Badge>
                  </div>

                  <small>
                    {clientNameLocal(
                      p.client_id,
                      clients
                    )}{' '}
                    • {p.progress}% complete
                  </small>

                  <div className="bar">
                    <i
                      style={{
                        width: `${p.progress}%`
                      }}
                    />
                  </div>

                  <div className="projectFoot">

                    <span>
                      Budget{' '}
                      {money(
                        Number(
                          p.approved_budget || 0
                        )
                      )}
                    </span>

                    <b>
                      {money(
                        Number(
                          p.contract_value || 0
                        ) -
                        Number(
                          p.actual_cost || 0
                        )
                      )}{' '}
                      GP
                    </b>

                  </div>

                </div>

              ))

          )}

        </Card>

        <Card>

          <Section
            title="System foundation"
            sub="Now connected"
          />

          <div className="list">

            <div className="listItem">
              <UserPlus size={14} />

              <div>
                <b>Clients</b>
                <small>
                  CRUD + search-ready
                </small>
              </div>
            </div>

            <div className="listItem">
              <BriefcaseBusiness size={14} />

              <div>
                <b>Projects</b>
                <small>
                  Linked to clients
                </small>
              </div>
            </div>

            <div className="listItem">
              <ShieldDot />

              <div>
                <b>Authentication</b>
                <small>
                  Supabase session
                </small>
              </div>
            </div>

          </div>

        </Card>

      </div>
    </>
  );
}


/* =========================================================
   CLIENT HELPERS
========================================================= */

function clientNameLocal(
  id: string | null,
  clients: Client[]
) {
  const c = clients.find(
    x => x.id === id
  );

  if (!c) {
    return 'Unassigned';
  }

  if (
    c.unit_building_name &&
    c.unit_number
  ) {
    return `${c.unit_building_name} • ${c.unit_number}`;
  }

  return (
    c.unit_building_name ||
    c.unit_number ||
    c.name ||
    'Unassigned'
  );
}


/* =========================================================
   KPI
========================================================= */

function Kpi({
  title,
  value,
  note,
  good,
  bad
}: {
  title: string;
  value: string;
  note: string;
  good?: boolean;
  bad?: boolean;
}) {
  return (
    <Card className="kpi">

      <div className="kpiTop">
        <span>{title}</span>
      </div>

      <strong>{value}</strong>

      <small
        className={
          good
            ? 'goodText'
            : bad
            ? 'badText'
            : ''
        }
      >
        {note}
      </small>

    </Card>
  );
}


/* =========================================================
   CLIENTS
========================================================= */

function Clients({
  clients,
  query,
  onAdd
}: {
  clients: Client[];
  query: string;
  onAdd: () => void;
}) {

  const list = clients.filter(c =>
    `
      ${c.name}
      ${c.unit_building_name || ''}
      ${c.unit_number || ''}
      ${c.email || ''}
      ${c.phone || ''}
    `
      .toLowerCase()
      .includes(
        query.toLowerCase()
      )
  );

  return (
    <>
      <Top
        title="Clients"
        sub="Your client master — one record feeding every project."
        action={
          <button
            className="primary"
            onClick={onAdd}
          >
            <Plus size={14} />
            New Client
          </button>
        }
      />

      <Card>

        <Table
          headers={[
            'Client',
            'Unit Building',
            'Unit Number',
            'Phone',
            'Email'
          ]}
          rows={list.map(c => [

            <b key="name">
              {c.name}
            </b>,

            c.unit_building_name ||
              '—',

            c.unit_number ||
              '—',

            c.phone ||
              '—',

            c.email ||
              '—'

          ])}
        />

        {list.length === 0 && (
          <Empty
            text="No clients yet. Create your first client."
          />
        )}

      </Card>
    </>
  );
}


/* =========================================================
   PROJECTS
========================================================= */

function Projects({
  projects,
  clients,
  query,
  onAdd,
  onOpen
}: {
  projects: Project[];
  clients: Client[];
  query: string;
  onAdd: () => void;
  onOpen: (p: Project) => void;
}) {

  const list = projects.filter(p =>
    `
      ${p.name}
      ${clientNameLocal(
        p.client_id,
        clients
      )}
    `
      .toLowerCase()
      .includes(
        query.toLowerCase()
      )
  );

  return (
    <>
      <Top
        title="Projects"
        sub="Live project records connected to your client master."
        action={
          <button
            className="primary"
            onClick={onAdd}
          >
            <Plus size={14} />
            New Project
          </button>
        }
      />

      <div className="threeCols">

        {list.map(p => (

          <Card
            key={p.id}
            onClick={() =>
              onOpen(p)
            }
          >

            <div className="sectionHead">

              <div>
                <h3>{p.name}</h3>

                <span>
                  {clientNameLocal(
                    p.client_id,
                    clients
                  )}
                </span>
              </div>

              <Badge>
                {p.status}
              </Badge>

            </div>

            <div className="bar bigbar">
              <i
                style={{
                  width: `${p.progress}%`
                }}
              />
            </div>

            <div className="projectFoot">

              <span>
                {p.progress}% complete
              </span>

              <b>
                {money(
                  Number(
                    p.contract_value || 0
                  ) -
                  Number(
                    p.actual_cost || 0
                  )
                )}{' '}
                GP
              </b>

            </div>

            <div className="miniStats">

              <div>
                <small>
                  Contract
                </small>

                <b>
                  {money(
                    Number(
                      p.contract_value || 0
                    )
                  )}
                </b>
              </div>

              <div>
                <small>
                  Budget
                </small>

                <b>
                  {money(
                    Number(
                      p.approved_budget || 0
                    )
                  )}
                </b>
              </div>

            </div>

            <small>
              Due {p.due_date || 'TBD'}
            </small>

          </Card>

        ))}

        {list.length === 0 && (
          <Empty
            text="No projects yet. Create your first project."
          />
        )}

      </div>
    </>
  );
}


/* =========================================================
   PROJECT DETAIL
========================================================= */

function ProjectDetail({
  project,
  clients,
  onBack
}: {
  project: Project;
  clients: Client[];
  onBack: () => void;
}) {

  const client = clients.find(
    c => c.id === project.client_id
  );

  const gp =
    Number(project.contract_value || 0) -
    Number(project.actual_cost || 0);

  const margin =
    Number(project.contract_value || 0) > 0
      ? (gp /
          Number(project.contract_value)) *
        100
      : 0;

  return (
    <>
      <Top
        title={project.name}
        sub={
          client
            ? `${client.name}${
                client.unit_building_name
                  ? ` • ${client.unit_building_name}`
                  : ''
              }${
                client.unit_number
                  ? ` • ${client.unit_number}`
                  : ''
              }`
            : 'Unassigned client'
        }
        action={
          <button
            className="secondary"
            onClick={onBack}
          >
            ← Back to Projects
          </button>
        }
      />

      {/* PROJECT HEADER */}

      <Card className="hero">

        <div className="sectionHead">

          <div>
            <h3>
              Project Overview
            </h3>

            <span>
              Core project operating information
            </span>
          </div>

          <Badge>
            {project.status}
          </Badge>

        </div>

        <div className="miniStats">

          <div>
            <small>
              Client
            </small>

            <b>
              {client?.name ||
                'Unassigned'}
            </b>
          </div>

          <div>
            <small>
              Building
            </small>

            <b>
              {client?.unit_building_name ||
                '—'}
            </b>
          </div>

          <div>
            <small>
              Unit
            </small>

            <b>
              {client?.unit_number ||
                '—'}
            </b>
          </div>

        </div>

        <div
          style={{
            marginTop: 24
          }}
        >

          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              marginBottom: 8
            }}
          >
            <small>
              Project Progress
            </small>

            <b>
              {project.progress}%
            </b>
          </div>

          <div className="bar bigbar">
            <i
              style={{
                width: `${project.progress}%`
              }}
            />
          </div>

        </div>

      </Card>


      {/* FINANCIAL SUMMARY */}

      <div className="threeCols">

        <Card>

          <small>
            Contract Value
          </small>

          <h2>
            {money(
              Number(
                project.contract_value || 0
              )
            )}
          </h2>

          <small>
            Total project revenue
          </small>

        </Card>

        <Card>

          <small>
            Approved Budget
          </small>

          <h2>
            {money(
              Number(
                project.approved_budget || 0
              )
            )}
          </h2>

          <small>
            Planned project cost
          </small>

        </Card>

        <Card>

          <small>
            Actual Cost
          </small>

          <h2>
            {money(
              Number(
                project.actual_cost || 0
              )
            )}
          </h2>

          <small>
            Recorded cost to date
          </small>

        </Card>

      </div>


      {/* PROFITABILITY */}

      <div className="threeCols">

        <Card>

          <small>
            Gross Profit
          </small>

          <h2>
            {money(gp)}
          </h2>

          <small className="goodText">
            Contract value − actual cost
          </small>

        </Card>

        <Card>

          <small>
            Gross Margin
          </small>

          <h2>
            {margin.toFixed(1)}%
          </h2>

          <small>
            Current project margin
          </small>

        </Card>

        <Card>

          <small>
            Budget Remaining
          </small>

          <h2>
            {money(
              Number(
                project.approved_budget || 0
              ) -
              Number(
                project.actual_cost || 0
              )
            )}
          </h2>

          <small>
            Approved budget − actual cost
          </small>

        </Card>

      </div>


      {/* DATES */}

      <Card className="hero">

        <Section
          title="Project Timeline"
          sub="Current project schedule"
        />

        <div className="miniStats">

          <div>
            <small>
              Start Date
            </small>

            <b>
              {project.start_date ||
                'TBD'}
            </b>
          </div>

          <div>
            <small>
              Due Date
            </small>

            <b>
              {project.due_date ||
                'TBD'}
            </b>
          </div>

          <div>
            <small>
              Status
            </small>

            <b>
              {project.status}
            </b>
          </div>

        </div>

      </Card>


      {/* NEXT MODULE PLACEHOLDER */}

      <Card className="hero">

        <Section
          title="Project Operations"
          sub="Operational modules will connect here"
        />

        <div className="heroMetrics">

          <div>
            <b>01</b>
            <small>
              Tasks & SOP
            </small>
          </div>

          <div>
            <b>02</b>
            <small>
              Site Control
            </small>
          </div>

          <div>
            <b>03</b>
            <small>
              Labour
            </small>
          </div>

          <div>
            <b>04</b>
            <small>
              Procurement
            </small>
          </div>

          <div>
            <b>05</b>
            <small>
              Finance
            </small>
          </div>

        </div>

      </Card>

    </>
  );
}


/* =========================================================
   PLACEHOLDER
========================================================= */

function Placeholder({
  title
}: {
  title: string;
}) {
  return (
    <>
      <Top
        title={title}
        sub="The navigation is in place. This module will be connected to the same project data layer next."
      />

      <Card className="hero">

        <h2>
          Production module queued
        </h2>

        <p>
          We are building this module on top
          of the live Clients + Projects
          foundation instead of demo-only
          state.
        </p>

        <div className="heroMetrics">

          <div>
            <b>LIVE</b>
            <small>
              Supabase connection
            </small>
          </div>

          <div>
            <b>AUTH</b>
            <small>
              Protected workspace
            </small>
          </div>

          <div>
            <b>READY</b>
            <small>
              For next workflow
            </small>
          </div>

        </div>

      </Card>
    </>
  );
}


/* =========================================================
   TOP
========================================================= */

function Top({
  title,
  sub,
  action
}: {
  title: string;
  sub: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="topLine">

      <div>
        <h2>{title}</h2>
        <p>{sub}</p>
      </div>

      {action}

    </div>
  );
}


/* =========================================================
   TABLE
========================================================= */

function Table({
  headers,
  rows
}: {
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="tableWrap">

      <table>

        <thead>
          <tr>
            {headers.map(h => (
              <th key={h}>
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>

          {rows.map((r, i) => (

            <tr key={i}>

              {r.map((c, j) => (
                <td key={j}>
                  {c}
                </td>
              ))}

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}


/* =========================================================
   EMPTY
========================================================= */

function Empty({
  text
}: {
  text: string;
}) {
  return (
    <div className="empty">
      {text}
    </div>
  );
}


/* =========================================================
   SHIELD
========================================================= */

function ShieldDot() {
  return (
    <div
      style={{
        width: 14,
        height: 14,
        borderRadius: 4,
        background: '#e8f6ee'
      }}
    />
  );
}


/* =========================================================
   CLIENT MODAL
========================================================= */

function ClientModal({
  close,
  save
}: {
  close: () => void;
  save: (v: {
    name: string;
    unit_building_name: string;
    unit_number: string;
    phone: string;
    email: string;
  }) => Promise<void>;
}) {

  const [v, setV] = useState({
    name: '',
    unit_building_name: '',
    unit_number: '',
    phone: '',
    email: ''
  });

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState('');

  return (
    <Modal
      title="New Client"
      close={close}
      busy={busy}
      error={error}
      onSave={async () => {

        if (!v.name) {
          setError(
            'Client name is required.'
          );
          return;
        }

        setBusy(true);

        try {
          await save(v);
        } catch (e: any) {
          setError(
            e.message ||
              'Unable to save client.'
          );
        } finally {
          setBusy(false);
        }

      }}
    >

      <Field
        label="Client name"
        value={v.name}
        onChange={x =>
          setV({
            ...v,
            name: x
          })
        }
        placeholder="e.g. Rajiv Sharma"
      />

      <Field
        label="Unit Building Name"
        value={
          v.unit_building_name
        }
        onChange={x =>
          setV({
            ...v,
            unit_building_name: x
          })
        }
        placeholder="e.g. EON Fairfox"
      />

      <Field
        label="Unit Number"
        value={v.unit_number}
        onChange={x =>
          setV({
            ...v,
            unit_number: x
          })
        }
        placeholder="e.g. 1914"
      />

      <Field
        label="Phone"
        value={v.phone}
        onChange={x =>
          setV({
            ...v,
            phone: x
          })
        }
        placeholder="+91 …"
      />

      <Field
        label="Email"
        value={v.email}
        onChange={x =>
          setV({
            ...v,
            email: x
          })
        }
        placeholder="client@example.com"
      />

    </Modal>
  );
}


/* =========================================================
   PROJECT MODAL
========================================================= */

function ProjectModal({
  clients,
  close,
  save
}: {
  clients: Client[];
  close: () => void;
  save: (v: {
    name: string;
    client_id: string;
    contract_value: number;
    approved_budget: number;
    start_date: string;
    due_date: string;
  }) => Promise<void>;
}) {

  const [v, setV] = useState({
    name: '',
    client_id:
      clients[0]?.id || '',
    contract_value: '',
    approved_budget: '',
    start_date: '',
    due_date: ''
  });

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState('');

  return (
    <Modal
      title="New Project"
      close={close}
      busy={busy}
      error={error}
      onSave={async () => {

        if (
          !v.name ||
          !v.client_id
        ) {
          setError(
            'Project name and client are required.'
          );
          return;
        }

        setBusy(true);

        try {

          await save({
            name: v.name,
            client_id: v.client_id,
            contract_value:
              Number(
                v.contract_value || 0
              ),
            approved_budget:
              Number(
                v.approved_budget || 0
              ),
            start_date:
              v.start_date,
            due_date:
              v.due_date
          });

        } catch (e: any) {

          setError(
            e.message ||
              'Unable to save project.'
          );

        } finally {

          setBusy(false);

        }

      }}
    >

      <Field
        label="Project name"
        value={v.name}
        onChange={x =>
          setV({
            ...v,
            name: x
          })
        }
        placeholder="e.g. Sector 18 Corporate Office"
      />

      <label>
        Client

        <select
          value={v.client_id}
          onChange={e =>
            setV({
              ...v,
              client_id:
                e.target.value
            })
          }
        >

          {clients.map(c => (

            <option
              key={c.id}
              value={c.id}
            >
              {c.name}
              {c.unit_building_name
                ? ` • ${c.unit_building_name}`
                : ''}
              {c.unit_number
                ? ` • ${c.unit_number}`
                : ''}
            </option>

          ))}

        </select>

      </label>

      <Field
        label="Contract value"
        value={
          v.contract_value
        }
        onChange={x =>
          setV({
            ...v,
            contract_value: x
          })
        }
        placeholder="3200000"
        type="number"
      />

      <Field
        label="Approved budget"
        value={
          v.approved_budget
        }
        onChange={x =>
          setV({
            ...v,
            approved_budget: x
          })
        }
        placeholder="2050000"
        type="number"
      />

      <div className="formGrid">

        <Field
          label="Start date"
          value={v.start_date}
          onChange={x =>
            setV({
              ...v,
              start_date: x
            })
          }
          type="date"
        />

        <Field
          label="Due date"
          value={v.due_date}
          onChange={x =>
            setV({
              ...v,
              due_date: x
            })
          }
          type="date"
        />

      </div>

    </Modal>
  );
}


/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text'
}: {
  label: string;
  value: string;
  onChange: (
    x: string
  ) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label>

      {label}

      <input
        type={type}
        value={value}
        onChange={e =>
          onChange(
            e.target.value
          )
        }
        placeholder={
          placeholder
        }
      />

    </label>
  );
}


/* =========================================================
   MODAL
========================================================= */

function Modal({
  title,
  close,
  onSave,
  busy,
  error,
  children
}: {
  title: string;
  close: () => void;
  onSave: () => Promise<void>;
  busy: boolean;
  error: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="modalBackdrop"
      onMouseDown={e =>
        e.target ===
          e.currentTarget &&
        close()
      }
    >

      <div className="modal">

        <div className="modalHead">

          <div>
            <small>
              SOLUSI OS
            </small>

            <h2>
              {title}
            </h2>
          </div>

          <button
            onClick={close}
          >
            <X size={18} />
          </button>

        </div>

        <div className="modalBody">
          {children}
        </div>

        {error && (
          <div className="authError">
            {error}
          </div>
        )}

        <button
          className="primary fullButton"
          disabled={busy}
          onClick={onSave}
        >
          {busy
            ? 'Saving…'
            : 'Save record'}
        </button>

      </div>

    </div>
  );
}
