'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  ReceiptText,
  Palette,
  BriefcaseBusiness,
  HardHat,
  AlertTriangle,
  Truck,
  FileText,
  Wallet,
  ExternalLink,
  Plus,
  Search,
  Bell,
  Menu,
  X,
  RefreshCw,
  Building,
  ShieldCheck,
  CheckCircle2,
  FilePlus,
  DollarSign,
  Trash2,
  Sliders,
  LogOut
} from 'lucide-react';
import { supabase } from '../lib/supabase';

/* ==========================================================================
   NAVIGATION CONFIGURATION (Clean Product Modules)
   ========================================================================== */
const navItems = [
  { key: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
  { key: 'crm', label: 'Sales & CRM', icon: Users },
  { key: 'quotations', label: 'Quotations & BOQ', icon: ReceiptText },
  { key: 'design', label: 'Design Studio', icon: Palette },
  { key: 'projects', label: 'Projects & Milestones', icon: BriefcaseBusiness },
  { key: 'site', label: 'Site Control', icon: HardHat },
  { key: 'labour', label: 'Labour Management', icon: Users },
  { key: 'procurement', label: 'Material & Procurement', icon: Truck },
  { key: 'snags', label: 'Issues & Snags', icon: AlertTriangle },
  { key: 'variations', label: 'BOQ & Variations', icon: FileText },
  { key: 'finance', label: 'Finance & P&L', icon: Wallet },
  { key: 'portal', label: 'Client Portal', icon: ExternalLink }
] as const;

/* Helper Formatter */
const money = (n: number) => {
  if (isNaN(n) || n === null) return '₹0';
  if (Math.abs(n) >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
};

function StatusBadge({ children }: { children: string }) {
  const good = ['On Track', 'Done', 'Completed', 'Approved', 'Client Approved', 'Delivered', 'Won', 'Active', 'Paid'].includes(children);
  const bad = ['Critical', 'Delayed', 'Overdue', 'At Risk', 'Lost', 'Rejected', 'High'].includes(children);
  const warn = ['In Progress', 'Action Taken', 'Open', 'Draft', 'Quotation', 'Design Discussion', 'Pending'].includes(children);

  return (
    <span className={`badge ${good ? 'good' : bad ? 'bad' : warn ? 'warn' : ''}`}>
      {children}
    </span>
  );
}

export default function App() {
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Global State fetched from Prisma APIs
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedProjectDetail, setSelectedProjectDetail] = useState<any>(null);
  const [siteReports, setSiteReports] = useState<any[]>([]);
  const [tradeWorkers, setTradeWorkers] = useState<any[]>([]);
  const [labourAssignments, setLabourAssignments] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [variations, setVariations] = useState<any[]>([]);
  const [financeEntries, setFinanceEntries] = useState<any[]>([]);
  const [financeSummary, setFinanceSummary] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [designData, setDesignData] = useState<any>({ designItems: [], moodboards: [] });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalType, setModalType] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Compute global live search results across all modules
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const results: any[] = [];

    // Search Projects
    projects.forEach(p => {
      if (p.name?.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q) || p.location?.toLowerCase().includes(q)) {
        results.push({ type: 'Project', title: p.name, subtitle: `${p.code} • ${p.location || 'Location N/A'}`, view: 'projects', item: p });
      }
    });

    // Search Leads & Clients
    leads.forEach(l => {
      if (l.contactName?.toLowerCase().includes(q) || l.companyName?.toLowerCase().includes(q) || l.phone?.includes(q)) {
        results.push({ type: 'Lead', title: l.contactName, subtitle: `${l.companyName || 'Client'} • ${l.stage}`, view: 'crm', item: l });
      }
    });

    // Search Quotations & BOQ
    quotations.forEach(quote => {
      if (quote.quoteNo?.toLowerCase().includes(q) || quote.title?.toLowerCase().includes(q)) {
        results.push({ type: 'Quotation', title: quote.quoteNo, subtitle: quote.title, view: 'quotations', item: quote });
      }
    });

    // Search Materials & Procurement
    materials.forEach(m => {
      if (m.name?.toLowerCase().includes(q) || m.code?.toLowerCase().includes(q) || m.category?.toLowerCase().includes(q)) {
        results.push({ type: 'Material', title: m.name, subtitle: `${m.code} • ${m.category}`, view: 'procurement', item: m });
      }
    });

    // Search Issues & Snags
    issues.forEach(i => {
      if (i.title?.toLowerCase().includes(q) || i.category?.toLowerCase().includes(q)) {
        results.push({ type: 'Issue/Snag', title: i.title, subtitle: `${i.category} • ${i.status}`, view: 'snags', item: i });
      }
    });

    return results.slice(0, 8);
  }, [searchQuery, projects, leads, quotations, materials, issues]);

  // Compute real-time system notifications for Bell icon popover
  const systemAlerts = useMemo(() => {
    const alerts: any[] = [];

    approvals.filter((a: any) => a.status === 'Pending').forEach((a: any) => {
      alerts.push({
        id: `app-${a.id}`,
        type: 'Approval',
        title: `Pending Client Approval: ${a.title}`,
        subtitle: `Requested for ${a.project?.name || 'Project'}`,
        badge: 'warn',
        view: 'portal'
      });
    });

    issues.filter((i: any) => i.status !== 'Resolved' && i.status !== 'Closed').forEach((i: any) => {
      alerts.push({
        id: `iss-${i.id}`,
        type: 'Snag',
        title: `Open Snag: ${i.title}`,
        subtitle: `Severity: ${i.severity} • ${i.project?.name || 'Site'}`,
        badge: i.severity === 'Critical' || i.severity === 'High' ? 'bad' : 'warn',
        view: 'snags'
      });
    });

    variations.filter((v: any) => v.status === 'Draft' || v.status === 'Submitted').forEach((v: any) => {
      alerts.push({
        id: `var-${v.id}`,
        type: 'Variation',
        title: `Variation Request ${v.variationNo}`,
        subtitle: `${v.title} (+₹${(v.priceImpact || 0).toLocaleString()})`,
        badge: 'warn',
        view: 'variations'
      });
    });

    return alerts;
  }, [approvals, issues, variations]);

  // Read current user profile from localStorage or redirect to /login
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('solusi_user') : null;
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u && u.name) {
          setCurrentUser(u);
        } else {
          window.location.href = '/login';
        }
      } catch (e) {
        window.location.href = '/login';
      }
    } else {
      window.location.href = '/login';
    }
  }, []);

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('solusi_user');
    }
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    window.location.href = '/login';
  };

  const handleDelete = async (resource: string, id: string, extraType?: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      let url = `/api/${resource}?id=${id}`;
      if (extraType) url += `&type=${extraType}`;
      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete record');
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error deleting record');
    }
  };

  // Load all module data on mount & refetch on action
  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    setError('');
    try {
      const [
        dashRes,
        clientRes,
        leadRes,
        projRes,
        siteRes,
        labourRes,
        procRes,
        issueRes,
        varRes,
        finRes,
        appRes,
        quoRes,
        desRes
      ] = await Promise.all([
        fetch('/api/dashboard').then(r => r.json()),
        fetch('/api/clients').then(r => r.json()),
        fetch('/api/leads').then(r => r.json()),
        fetch('/api/projects').then(r => r.json()),
        fetch('/api/site-reports').then(r => r.json()),
        fetch('/api/labour').then(r => r.json()),
        fetch('/api/procurement').then(r => r.json()),
        fetch('/api/issues').then(r => r.json()),
        fetch('/api/variations').then(r => r.json()),
        fetch('/api/finance').then(r => r.json()),
        fetch('/api/approvals').then(r => r.json()),
        fetch('/api/quotations').then(r => r.json()),
        fetch('/api/design').then(r => r.json())
      ]);

      setDashboardData(dashRes?.metrics ? dashRes : null);
      setClients(Array.isArray(clientRes) ? clientRes : []);
      setLeads(Array.isArray(leadRes) ? leadRes : []);
      setProjects(Array.isArray(projRes) ? projRes : []);
      setSiteReports(Array.isArray(siteRes) ? siteRes : []);
      if (labourRes && !labourRes.error) {
        setTradeWorkers(Array.isArray(labourRes.workers) ? labourRes.workers : []);
        setLabourAssignments(Array.isArray(labourRes.assignments) ? labourRes.assignments : []);
      } else {
        setTradeWorkers([]);
        setLabourAssignments([]);
      }
      if (procRes && !procRes.error) {
        setMaterials(Array.isArray(procRes.materials) ? procRes.materials : []);
        setPurchaseOrders(Array.isArray(procRes.purchaseOrders) ? procRes.purchaseOrders : []);
      } else {
        setMaterials([]);
        setPurchaseOrders([]);
      }
      setIssues(Array.isArray(issueRes) ? issueRes : []);
      setVariations(Array.isArray(varRes) ? varRes : []);
      if (finRes && !finRes.error) {
        setFinanceEntries(Array.isArray(finRes.entries) ? finRes.entries : []);
        setFinanceSummary(Array.isArray(finRes.summary) ? finRes.summary : []);
      } else {
        setFinanceEntries([]);
        setFinanceSummary([]);
      }
      setApprovals(Array.isArray(appRes) ? appRes : []);
      setQuotations(Array.isArray(quoRes) ? quoRes : []);
      if (desRes && !desRes.error) {
        setDesignData(desRes);
      }
    } catch (err: any) {
      console.error('Error loading Solusi OS Prisma data:', err);
      setError('Could not connect to database. Make sure Prisma API server is active.');
    } finally {
      setLoading(false);
    }
  }

  // Load deep single project detail when clicked
  async function openProjectDetail(proj: any) {
    setSelectedProject(proj);
    setLoading(true);
    try {
      const res = await fetch(`/api/projects?id=${proj.id}`).then(r => r.json());
      setSelectedProjectDetail(res);
    } catch (e: any) {
      console.error('Error loading project detail:', e);
    } finally {
      setLoading(false);
    }
  }

  const activeNavLabel = navItems.find(n => n.key === currentView)?.label || 'Command Center';

  if (!currentUser || (loading && !dashboardData)) {
    return (
      <div className="loadingScreen" style={{ position: 'fixed', inset: 0, zIndex: 99999, background: '#0b1220', color: '#fff' }}>
        <RefreshCw className="animate-spin" size={24} style={{ marginBottom: 12 }} />
        Authenticating Solusi OS...
      </div>
    );
  }

  return (
    <div className="app">
      {/* SIDEBAR NAVIGATION */}
      <aside className={`sidebar ${mobileNavOpen ? 'show' : ''}`}>
        <div className="brand">
          <div className="mark">S</div>
          <div>
            <b>solusi</b>
            <small>OPERATING SYSTEM</small>
          </div>
          <button className="mobileClose" onClick={() => setMobileNavOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="workspace">
          <small>COMMERCIAL INTERIOR OS</small>
          <b>Solusi Design</b>
          <span>Commercial Interiors</span>
        </div>

        <nav>
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                className={currentView === item.key ? 'active' : ''}
                onClick={() => {
                  setCurrentView(item.key);
                  setSelectedProject(null);
                  setSelectedProjectDetail(null);
                  setMobileNavOpen(false);
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="user">
          <div className="avatar">{currentUser?.avatar || 'SC'}</div>
          <div>
            <b>{currentUser?.name || 'Shubham Chaudhary'}</b>
            <small>{currentUser?.role || 'Commercial Director'}</small>
          </div>
          <button className="iconBtn dark" title="Refresh Data" onClick={loadAllData}>
            <RefreshCw size={14} />
          </button>
          <button className="iconBtn dark" title="Sign Out" onClick={handleLogout} style={{ color: '#ef4444' }}>
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main>
        <header>
          <div className="headerTitle">
            <button className="hamb" onClick={() => setMobileNavOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="eyebrow">SOLUSI DESIGN / {activeNavLabel.toUpperCase()}</div>
            <h1>{activeNavLabel}</h1>
          </div>

          <div className="headerTools">
            <div className="search" style={{ position: 'relative' }}>
              <Search size={15} />
              <input
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                placeholder="Search leads, projects, BOQ, site logs..."
              />
              {searchQuery.trim() !== '' && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchResults(false);
                  }}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}
                >
                  <X size={13} />
                </button>
              )}

              {/* SEARCH OVERLAY DROPDOWN */}
              {showSearchResults && searchQuery.trim() !== '' && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    right: 0,
                    minWidth: 320,
                    background: '#0f172a',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 12,
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5), 0 8px 10px -6px rgba(0,0,0,0.5)',
                    zIndex: 100,
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ padding: '8px 12px', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Search Results ({searchResults.length})</span>
                    <button
                      onClick={() => setShowSearchResults(false)}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 9 }}
                    >
                      Close
                    </button>
                  </div>
                  {searchResults.length === 0 ? (
                    <div style={{ padding: 16, fontSize: 12, color: '#64748b', textAlign: 'center' }}>
                      No records matching "{searchQuery}"
                    </div>
                  ) : (
                    <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                      {searchResults.map((res: any, idx: number) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setCurrentView(res.view);
                            if (res.view === 'projects' && res.item) {
                              openProjectDetail(res.item);
                            }
                            setShowSearchResults(false);
                            setSearchQuery('');
                          }}
                          style={{
                            padding: '10px 14px',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            cursor: 'pointer',
                            transition: 'background 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                          onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                          onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#f8fafc' }}>{res.title}</div>
                            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{res.subtitle}</div>
                          </div>
                          <span className="badge" style={{ fontSize: 9 }}>{res.type}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* NOTIFICATIONS BELL POP-OVER */}
            <div style={{ position: 'relative' }}>
              <button
                className="iconBtn"
                title="Alerts & Notifications"
                onClick={() => setShowNotifications(!showNotifications)}
                style={{ position: 'relative' }}
              >
                <Bell size={16} />
                {systemAlerts.length > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -2,
                      right: -2,
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: '#ef4444',
                      color: '#fff',
                      fontSize: 8,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {systemAlerts.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: 340,
                    background: '#0f172a',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 12,
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5), 0 8px 10px -6px rgba(0,0,0,0.5)',
                    zIndex: 100,
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <b style={{ fontSize: 12, color: '#f8fafc' }}>Alerts & Notifications ({systemAlerts.length})</b>
                    <button
                      style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 10, cursor: 'pointer' }}
                      onClick={() => setShowNotifications(false)}
                    >
                      Close
                    </button>
                  </div>

                  <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                    {systemAlerts.length === 0 ? (
                      <div style={{ padding: 20, fontSize: 12, color: '#64748b', textAlign: 'center' }}>
                        🎉 All system alerts clear! No pending notifications.
                      </div>
                    ) : (
                      systemAlerts.map((alt: any) => (
                        <div
                          key={alt.id}
                          onClick={() => {
                            setCurrentView(alt.view);
                            setShowNotifications(false);
                          }}
                          style={{
                            padding: '10px 14px',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            cursor: 'pointer',
                            transition: 'background 0.2s ease'
                          }}
                          onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                          onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <span className={`badge ${alt.badge}`} style={{ fontSize: 8 }}>{alt.type}</span>
                            <span style={{ fontSize: 9, color: '#64748b' }}>Action Needed</span>
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0' }}>{alt.title}</div>
                          <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>{alt.subtitle}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              className="iconBtn"
              title="Sign Out"
              onClick={handleLogout}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', fontSize: '11px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
            >
              <LogOut size={13} />
              <span>Log Out</span>
            </button>

            {/* TOP RIGHT ADD BUTTON FOR ANY VIEW */}
            <button className="primary" onClick={() => setModalType(currentView)}>
              <Plus size={15} />
              Add Record
            </button>
          </div>
        </header>

        <section className="page">
          {error && (
            <div className="authError pageAlert">
              <span>{error}</span>
              <button className="small" onClick={loadAllData}>
                <RefreshCw size={12} /> Retry
              </button>
            </div>
          )}

          {/* VIEW ROUTER */}
          {currentView === 'dashboard' && (
            <DashboardView
              metrics={dashboardData?.metrics}
              projects={projects}
              leads={leads}
              siteReports={siteReports}
              issues={issues}
              onNavigate={setCurrentView}
              onOpenProject={openProjectDetail}
              onAddRecord={() => setModalType('dashboard')}
            />
          )}

          {currentView === 'crm' && (
            <CrmView
              leads={leads}
              clients={clients}
              query={searchQuery}
              onRefresh={loadAllData}
              onAddLead={() => setModalType('crm')}
              onDelete={handleDelete}
            />
          )}

          {currentView === 'quotations' && (
            <QuotationsView
              quotations={quotations}
              projects={projects}
              leads={leads}
              clients={clients}
              query={searchQuery}
              onRefresh={loadAllData}
              onAddQuotation={() => setModalType('quotations')}
              onDelete={handleDelete}
            />
          )}

          {currentView === 'design' && (
            <DesignStudioView
              designItems={designData.designItems || []}
              moodboards={designData.moodboards || []}
              projects={projects}
              approvals={approvals}
              onRefresh={loadAllData}
              onAddDesign={() => setModalType('design')}
              onDelete={handleDelete}
            />
          )}

          {currentView === 'projects' && (
            selectedProjectDetail ? (
              <ProjectDetailView
                project={selectedProjectDetail}
                onBack={() => setSelectedProjectDetail(null)}
                onRefresh={() => openProjectDetail(selectedProject)}
              />
            ) : (
              <ProjectsMasterView
                projects={projects}
                clients={clients}
                query={searchQuery}
                onOpenProject={openProjectDetail}
                onAddProject={() => setModalType('projects')}
                onDelete={handleDelete}
              />
            )
          )}

          {currentView === 'site' && (
            <SiteControlView
              siteReports={siteReports}
              projects={projects}
              onAddReport={() => setModalType('site')}
              onDelete={handleDelete}
            />
          )}

          {currentView === 'labour' && (
            <LabourView
              workers={tradeWorkers}
              assignments={labourAssignments}
              projects={projects}
              onRefresh={loadAllData}
              onAddLabour={() => setModalType('labour')}
              onDelete={handleDelete}
            />
          )}

          {currentView === 'procurement' && (
            <ProcurementView
              materials={materials}
              purchaseOrders={purchaseOrders}
              projects={projects}
              onRefresh={loadAllData}
              onAddProcurement={() => setModalType('procurement')}
              onDelete={handleDelete}
            />
          )}

          {currentView === 'snags' && (
            <SnagsView
              issues={issues}
              projects={projects}
              onRefresh={loadAllData}
              onAddSnag={() => setModalType('snags')}
              onDelete={handleDelete}
            />
          )}

          {currentView === 'variations' && (
            <VariationsView
              variations={variations}
              projects={projects}
              onRefresh={loadAllData}
              onAddVariation={() => setModalType('variations')}
              onDelete={handleDelete}
            />
          )}

          {currentView === 'finance' && (
            <FinanceView
              summary={financeSummary}
              entries={financeEntries}
              projects={projects}
              onRefresh={loadAllData}
              onAddFinance={() => setModalType('finance')}
              onDelete={handleDelete}
            />
          )}

          {currentView === 'portal' && (
            <ClientPortalView
              projects={projects}
              approvals={approvals}
              siteReports={siteReports}
              onRefresh={loadAllData}
              onAddApproval={() => setModalType('portal')}
              onDelete={handleDelete}
            />
          )}
        </section>
      </main>

      {/* CREATION MODALS FOR ALL VIEWS */}
      {modalType === 'dashboard' && (
        <DashboardSelectorModal
          onSelect={(type: string) => setModalType(type)}
          onClose={() => setModalType(null)}
        />
      )}
      {(modalType === 'crm' || modalType === 'lead') && (
        <CreateLeadModal
          clients={clients}
          onClose={() => setModalType(null)}
          onSuccess={loadAllData}
        />
      )}
      {modalType === 'projects' && (
        <CreateProjectModal
          clients={clients}
          onClose={() => setModalType(null)}
          onSuccess={loadAllData}
        />
      )}
      {modalType === 'site' && (
        <CreateSiteReportModal
          projects={projects}
          onClose={() => setModalType(null)}
          onSuccess={loadAllData}
        />
      )}
      {modalType === 'quotations' && (
        <CreateQuotationModal
          projects={projects}
          clients={clients}
          onClose={() => setModalType(null)}
          onSuccess={loadAllData}
        />
      )}
      {modalType === 'design' && (
        <CreateDesignModal
          projects={projects}
          onClose={() => setModalType(null)}
          onSuccess={loadAllData}
        />
      )}
      {modalType === 'labour' && (
        <CreateLabourModal
          projects={projects}
          onClose={() => setModalType(null)}
          onSuccess={loadAllData}
        />
      )}
      {modalType === 'procurement' && (
        <CreateProcurementModal
          projects={projects}
          onClose={() => setModalType(null)}
          onSuccess={loadAllData}
        />
      )}
      {(modalType === 'snags' || modalType === 'issues') && (
        <CreateSnagModal
          projects={projects}
          onClose={() => setModalType(null)}
          onSuccess={loadAllData}
        />
      )}
      {modalType === 'variations' && (
        <CreateVariationModal
          projects={projects}
          onClose={() => setModalType(null)}
          onSuccess={loadAllData}
        />
      )}
      {modalType === 'finance' && (
        <CreateFinanceModal
          projects={projects}
          onClose={() => setModalType(null)}
          onSuccess={loadAllData}
        />
      )}
      {modalType === 'portal' && (
        <CreateApprovalModal
          projects={projects}
          onClose={() => setModalType(null)}
          onSuccess={loadAllData}
        />
      )}
    </div>
  );
}

/* ==========================================================================
   MODULE 1: DASHBOARD VIEW
   ========================================================================== */
function DashboardView({
  metrics,
  projects,
  leads,
  siteReports,
  issues,
  onNavigate,
  onOpenProject,
  onAddRecord
}: any) {
  return (
    <div>
      <div className="hero">
        <h2>Commercial Interior Design Operating System</h2>
        <p>
          Control center for Solusi Design. Management across Sales, CRM, Design Studio, 
          Milestone Checklists, Site Control, BOQ Variations, Procurement & P&L.
        </p>
        <div className="heroMetrics">
          <div>
            <small>TOTAL CONTRACT VALUE</small>
            <b>{money(metrics?.totalContractValue || 0)}</b>
          </div>
          <div>
            <small>TOTAL REVENUE COLLECTED</small>
            <b>{money(metrics?.totalRevenue || 0)}</b>
          </div>
          <div>
            <small>GROSS PROFIT MARGIN</small>
            <b>{metrics?.profitMargin || 0}%</b>
          </div>
        </div>
      </div>

      <div className="grid4" style={{ marginTop: 13 }}>
        <div className="card kpi">
          <div className="kpiTop">
            <span>ACTIVE PROJECTS</span>
            <Building size={16} />
          </div>
          <strong>{metrics?.projectsCount || 0}</strong>
          <small className="goodText">Project Execution</small>
        </div>

        <div className="card kpi">
          <div className="kpiTop">
            <span>CRM LEADS PIPELINE</span>
            <Users size={16} />
          </div>
          <strong>{metrics?.leadsCount || 0}</strong>
          <small>Sales Funnel</small>
        </div>

        <div className="card kpi">
          <div className="kpiTop">
            <span>OPEN SNAGS & ISSUES</span>
            <AlertTriangle size={16} />
          </div>
          <strong className={metrics?.openIssuesCount > 0 ? 'badText' : ''}>{metrics?.openIssuesCount || 0}</strong>
          <small>Site Quality</small>
        </div>

        <div className="card kpi">
          <div className="kpiTop">
            <span>CLIENT MASTERS</span>
            <ShieldCheck size={16} />
          </div>
          <strong>{metrics?.clientsCount || 0}</strong>
          <small className="goodText">Client Directory</small>
        </div>
      </div>

      <div className="twoCols">
        {/* Active Projects Tracker */}
        <div className="card">
          <div className="sectionHead">
            <div>
              <h3>Active Projects & Execution Progress</h3>
              <span>Project Execution & Progress</span>
            </div>
            <button className="small" onClick={() => onNavigate('projects')}>View All</button>
          </div>

          <div className="list">
            {projects.map((p: any) => (
              <div key={p.id} className="project" style={{ cursor: 'pointer' }} onClick={() => onOpenProject(p)}>
                <div className="projectTop">
                  <b>{p.name}</b>
                  <StatusBadge>{p.status}</StatusBadge>
                </div>
                <small>{p.location || 'Gurugram/Mumbai Office Fitout'} • Contract: {money(p.contractValue)}</small>
                <div className="bar">
                  <i style={{ width: `${p.progress}%` }} />
                </div>
                <div className="projectFoot">
                  <span>Progress: {p.progress}%</span>
                  <b>Cost Spent: {money(p.actualCost)}</b>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Site Stream */}
        <div className="card">
          <div className="sectionHead">
            <div>
              <h3>Daily Site Reports Stream</h3>
              <span>Supervisor Site Feed</span>
            </div>
            <button className="small" onClick={() => onNavigate('site')}>Site Control</button>
          </div>

          <div className="list">
            {siteReports.slice(0, 3).map((r: any) => (
              <div key={r.id} className="listItem" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <b>{r.project?.name}</b>
                  <small>{new Date(r.reportDate).toLocaleDateString()}</small>
                </div>
                <small style={{ margin: '4px 0', color: '#4a5568' }}>{r.workCompleted}</small>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span className="badge good">{r.labourPresent} Labour Present</span>
                  <span className="badge warn">Weather: {r.weather}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   MODULE 2: SALES & CRM VIEW
   ========================================================================== */
function CrmView({ leads, clients, query, onRefresh, onAddLead, onDelete }: any) {
  const stages = ['Lead', 'Prospect', 'Site Visit', 'Requirement', 'Design Discussion', 'Quotation', 'Negotiation', 'Won', 'Lost'];

  const filtered = useMemo(() => {
    return leads.filter((l: any) =>
      l.contactName.toLowerCase().includes(query.toLowerCase()) ||
      (l.companyName && l.companyName.toLowerCase().includes(query.toLowerCase()))
    );
  }, [leads, query]);

  async function updateStage(leadId: string, newStage: string) {
    await fetch('/api/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: leadId, stage: newStage })
    });
    onRefresh();
  }

  return (
    <div>
      <div className="sectionHead">
        <div>
          <h2>Sales & CRM Pipeline</h2>
          <span>Lead &gt; Prospect &gt; Site Visit &gt; Requirement &gt; Design Discussion &gt; Quotation &gt; Negotiation &gt; Won/Lost</span>
        </div>
        <button className="primary" onClick={onAddLead}><Plus size={14} /> New CRM Lead</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginTop: 15 }}>
        {stages.map(stage => {
          const stageLeads = filtered.filter((l: any) => l.stage === stage);
          return (
            <div key={stage} className="card" style={{ background: '#fafbfc', minHeight: 350 }}>
              <div className="sectionHead" style={{ borderBottom: '1px solid #e7ebf0', paddingBottom: 8 }}>
                <b style={{ fontSize: 11 }}>{stage}</b>
                <span className="badge">{stageLeads.length}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                {stageLeads.map((lead: any) => (
                  <div key={lead.id} className="card" style={{ background: '#fff', padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <b style={{ fontSize: 11, display: 'block' }}>{lead.contactName}</b>
                      {onDelete && (
                        <button
                          className="iconBtn"
                          style={{ padding: 2, color: '#ef4444' }}
                          title="Delete Lead"
                          onClick={() => onDelete('leads', lead.id)}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    <small style={{ color: '#68758a', display: 'block', margin: '2px 0' }}>{lead.companyName}</small>
                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0', fontSize: 10, fontWeight: 700 }}>
                      <span>{lead.projectType}</span>
                      <span className="goodText">{money(lead.estimatedBudget || 0)}</span>
                    </div>

                    <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                      <select
                        value={lead.stage}
                        onChange={e => updateStage(lead.id, e.target.value)}
                        style={{ fontSize: 9, padding: '4px 6px', width: '100%' }}
                      >
                        {stages.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                ))}

                {stageLeads.length === 0 && (
                  <div style={{ color: '#a0aec0', fontSize: 10, textAlign: 'center', padding: 20 }}>No leads in stage</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ==========================================================================
   MODULE 3: QUOTATIONS & BOQ VIEW
   ========================================================================== */
function QuotationsView({ quotations, projects, leads, clients, query, onRefresh, onAddQuotation, onDelete }: any) {
  const displayQuotations = quotations.length > 0 ? quotations : projects.map((p: any) => ({
    id: p.id,
    quoteNo: `QUO-2026-${p.code.substring(9)}`,
    title: p.name,
    clientName: p.client?.name,
    materialCost: p.contractValue * 0.45,
    labourCost: p.contractValue * 0.25,
    overheads: p.contractValue * 0.08,
    markupPct: 18,
    subtotal: p.contractValue * 0.82,
    tax: p.contractValue * 0.18,
    total: p.contractValue,
    status: 'Approved'
  }));

  return (
    <div>
      <div className="sectionHead">
        <div>
          <h2>Commercial Quotations & BOQ Engine</h2>
          <span>Requirement &gt; BOQ &gt; Material &gt; Labour &gt; Overheads &gt; Markup &gt; Quotation &gt; Approval &gt; Advance</span>
        </div>
        <button className="primary" onClick={onAddQuotation}><Plus size={14} /> Create Quotation</button>
      </div>

      <div className="card tableCard">
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Quote No</th>
                <th>Project / Title</th>
                <th>Material Cost</th>
                <th>Labour Cost</th>
                <th>Overheads</th>
                <th>Markup %</th>
                <th>Subtotal</th>
                <th>Tax</th>
                <th>Total Value</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayQuotations.map((q: any) => (
                <tr key={q.id}>
                  <td><b>{q.quoteNo}</b></td>
                  <td>
                    <b>{q.title}</b>
                    <div style={{ fontSize: 8, color: '#778397' }}>{q.clientName || q.client?.name}</div>
                  </td>
                  <td>{money(q.materialCost)}</td>
                  <td>{money(q.labourCost)}</td>
                  <td>{money(q.overheads)}</td>
                  <td>{q.markupPct}%</td>
                  <td>{money(q.subtotal)}</td>
                  <td>{money(q.tax)}</td>
                  <td><b className="goodText">{money(q.total)}</b></td>
                  <td><StatusBadge>{q.status}</StatusBadge></td>
                  <td>
                    {onDelete && (
                      <button
                        className="iconBtn"
                        style={{ padding: 4, color: '#ef4444' }}
                        title="Delete Quotation"
                        onClick={() => onDelete('quotations', q.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   MODULE 4: DESIGN STUDIO VIEW
   ========================================================================== */
function DesignStudioView({ designItems, moodboards, projects, approvals, onRefresh, onAddDesign, onDelete }: any) {
  return (
    <div>
      <div className="sectionHead">
        <div>
          <h2>Design Studio & Moodboard Approval</h2>
          <span>Measurements &gt; Concept &gt; Layout &gt; 3D &gt; Material selection &gt; Moodboard &gt; Approvals &gt; Working drawings</span>
        </div>
        <button className="primary" onClick={onAddDesign}><Plus size={14} /> New Design / Moodboard</button>
      </div>

      <div className="materialGrid">
        {designItems.map((item: any) => (
          <div key={item.id} className="card mood">
            <div
              className="moodVisual"
              style={{
                backgroundImage: `url(${item.fileUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <b style={{ flex: 1 }}>{item.title}</b>
              {onDelete && (
                <button
                  className="iconBtn"
                  style={{ padding: 4, color: '#ef4444' }}
                  title="Delete Design Item"
                  onClick={() => onDelete('design', item.id, 'design')}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
            <small>Project: {item.project?.name}</small>
            <div className="chips">
              <span>{item.type}</span>
              <span>v{item.version}</span>
            </div>
            <div className="rowButtons">
              <StatusBadge>{item.status}</StatusBadge>
            </div>
          </div>
        ))}

        {designItems.length === 0 && (
          <>
            <div className="card mood">
              <div className="moodVisual" style={{ background: 'linear-gradient(135deg,#2d3748,#4a5568,#1a202c)' }} />
              <b>Executive Boardroom 3D Visualization</b>
              <small>Approved by Client on June 24</small>
              <div className="chips">
                <span>3D Render</span>
                <span>Acoustic Felt</span>
                <span>Oak Veneer</span>
              </div>
              <div className="rowButtons">
                <StatusBadge>Approved</StatusBadge>
              </div>
            </div>

            <div className="card mood">
              <div className="moodVisual" style={{ background: 'linear-gradient(135deg,#c5a880,#e6dace,#2c2c2c)' }} />
              <b>Townhall Experience Center Palette</b>
              <small>Submitted for Client Sign-off</small>
              <div className="chips">
                <span>Moodboard</span>
                <span>Marble</span>
                <span>Brass Trim</span>
              </div>
              <div className="rowButtons">
                <StatusBadge>Pending Approval</StatusBadge>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   MODULE 5: PROJECTS MASTER & MILESTONE DETAIL
   ========================================================================== */
function ProjectsMasterView({ projects, clients, query, onOpenProject, onAddProject, onDelete }: any) {
  return (
    <div>
      <div className="sectionHead">
        <div>
          <h2>Project Master & Execution</h2>
          <span>Project plan &gt; Milestones &gt; Trade checklist &gt; Responsible person &gt; Milestone % &gt; Project %</span>
        </div>
        <button className="primary" onClick={onAddProject}><Plus size={14} /> New Project Master</button>
      </div>

      <div className="grid4" style={{ marginTop: 15 }}>
        {projects.map((p: any) => (
          <div key={p.id} className="card" style={{ cursor: 'pointer' }} onClick={() => onOpenProject(p)}>
            <div className="projectTop">
              <b style={{ fontSize: 13 }}>{p.name}</b>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <StatusBadge>{p.status}</StatusBadge>
                {onDelete && (
                  <button
                    className="iconBtn"
                    style={{ padding: 4, color: '#ef4444' }}
                    title="Delete Project"
                    onClick={(e) => { e.stopPropagation(); onDelete('projects', p.id); }}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
            <small>{p.location}</small>
            <div style={{ margin: '12px 0' }}>
              <div className="bar"><i style={{ width: `${p.progress}%` }} /></div>
              <div className="projectFoot">
                <span>Progress: {p.progress}%</span>
                <b>Contract: {money(p.contractValue)}</b>
              </div>
            </div>
            <button className="small" style={{ width: '100%', justifyContent: 'center' }}>Open Milestones & Checklist</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectDetailView({ project, onBack, onRefresh }: any) {
  const [updatingMilestone, setUpdatingMilestone] = useState<string | null>(null);
  const [showEditFinancials, setShowEditFinancials] = useState(false);

  async function updateMilestoneProgress(id: string, progress: number, status: string) {
    setUpdatingMilestone(id);
    await fetch('/api/milestones', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, progress, status })
    });
    setUpdatingMilestone(null);
    onRefresh();
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15 }}>
        <button className="small" onClick={onBack}>&larr; Back to Projects</button>
        <div>
          <h2 style={{ margin: 0 }}>{project.name}</h2>
          <span style={{ fontSize: 10, color: '#778397' }}>{project.code} • {project.location}</span>
        </div>
        <button
          className="primary"
          style={{ marginLeft: 'auto', padding: '6px 12px', fontSize: 10 }}
          onClick={() => setShowEditFinancials(true)}
        >
          <Sliders size={13} style={{ marginRight: 5 }} /> Edit Financials & Progress
        </button>
      </div>

      <div className="card" style={{ marginBottom: 15 }}>
        <div className="heroMetrics" style={{ marginTop: 0, justifyContent: 'space-between' }}>
          <div>
            <small>CONTRACT VALUE</small>
            <b>{money(project.contractValue)}</b>
          </div>
          <div>
            <small>APPROVED BUDGET</small>
            <b>{money(project.approvedBudget)}</b>
          </div>
          <div>
            <small>ACTUAL SPENT COST</small>
            <b className="goodText">{money(project.actualCost)}</b>
          </div>
          <div>
            <small>OVERALL PROGRESS</small>
            <b>{project.progress}%</b>
          </div>
        </div>
      </div>

      {showEditFinancials && (
        <EditProjectFinancialsModal
          project={project}
          onClose={() => setShowEditFinancials(false)}
          onSuccess={onRefresh}
        />
      )}

      <div className="card">
        <div className="sectionHead">
          <h3>Execution Milestones ({project.milestones?.length || 0})</h3>
        </div>

        <div className="list">
          {project.milestones?.map((m: any) => (
            <div key={m.id} className="listItem" style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr', gap: 10, alignItems: 'center' }}>
              <div>
                <b>{m.name}</b>
                <small>Phase: {m.phase} • Responsible: {m.responsiblePerson || 'Supervisor'}</small>
              </div>

              <div>
                <div className="bar"><i style={{ width: `${m.progress}%` }} /></div>
                <small>{m.progress}% complete</small>
              </div>

              <div>
                <StatusBadge>{m.status}</StatusBadge>
              </div>

              <div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={m.progress}
                  onChange={e => updateMilestoneProgress(m.id, parseInt(e.target.value), parseInt(e.target.value) === 100 ? 'Done' : 'In Progress')}
                />
              </div>

              <div style={{ textAlign: 'right' }}>
                {updatingMilestone === m.id ? 'Saving...' : <CheckCircle2 size={16} className="goodText" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   MODULE 6: SITE CONTROL VIEW
   ========================================================================== */
function SiteControlView({ siteReports, projects, onAddReport, onDelete }: any) {
  return (
    <div>
      <div className="sectionHead">
        <div>
          <h2>Daily Site Control & Supervisor Reporting</h2>
          <span>Daily site reports, labour present, completed work, material received, issues, photos & supervisor reporting</span>
        </div>
        <button className="primary" onClick={onAddReport}><Plus size={14} /> New Daily Site Report</button>
      </div>

      <div className="grid4" style={{ marginTop: 15 }}>
        {siteReports.map((r: any) => (
          <div key={r.id} className="card">
            <div className="sectionHead">
              <b>{r.project?.name}</b>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <StatusBadge>{new Date(r.reportDate).toLocaleDateString()}</StatusBadge>
                {onDelete && (
                  <button
                    className="iconBtn"
                    style={{ padding: 4, color: '#ef4444' }}
                    title="Delete Site Report"
                    onClick={() => onDelete('site-reports', r.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>

            <p style={{ margin: '8px 0', fontSize: 11 }}>{r.workCompleted}</p>

            {r.materialsRecd && (
              <small style={{ color: '#4a5568', display: 'block', margin: '4px 0' }}>
                <b>Materials Recd:</b> {r.materialsRecd}
              </small>
            )}

            <div style={{ display: 'flex', gap: 6, margin: '10px 0' }}>
              <span className="badge good">{r.labourPresent} Workers On Site</span>
              <span className="badge warn">{r.weather} Weather</span>
            </div>

            {r.photos?.map((photo: any) => (
              <div key={photo.id} style={{ marginTop: 8 }}>
                <img src={photo.imageUrl} alt="Site" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8 }} />
                <small style={{ fontSize: 9, color: '#718096' }}>{photo.caption}</small>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ==========================================================================
   MODULE 7: LABOUR MANAGEMENT VIEW
   ========================================================================== */
function LabourView({ workers, assignments, projects, onRefresh, onAddLabour, onDelete }: any) {
  return (
    <div>
      <div className="sectionHead">
        <div>
          <h2>Labour & Trade Management</h2>
          <span>People/trades &gt; Assigned tasks &gt; Due dates &gt; Completion &gt; Performance tracking</span>
        </div>
        <button className="primary" onClick={onAddLabour}><Plus size={14} /> Add Trade Worker / Task</button>
      </div>

      <div className="twoCols">
        <div className="card">
          <div className="sectionHead">
            <h3>Trade Contractors & Crews</h3>
          </div>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Trade Worker</th>
                  <th>Trade Specialization</th>
                  <th>Daily Rate</th>
                  <th>Rating</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((w: any) => (
                  <tr key={w.id}>
                    <td><b>{w.name}</b></td>
                    <td><span className="badge">{w.trade}</span></td>
                    <td>{money(w.dailyRate)}/day</td>
                    <td><b className="goodText">★ {w.rating}</b></td>
                    <td>
                      {onDelete && (
                        <button
                          className="iconBtn"
                          style={{ padding: 4, color: '#ef4444' }}
                          title="Delete Worker"
                          onClick={() => onDelete('labour', w.id, 'worker')}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="sectionHead">
            <h3>Active Task Assignments</h3>
          </div>
          <div className="list">
            {assignments.map((a: any) => (
              <div key={a.id} className="listItem">
                <div>
                  <b>{a.taskName}</b>
                  <small>Assigned: {a.worker?.name} ({a.worker?.trade})</small>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <StatusBadge>{a.status}</StatusBadge>
                  {onDelete && (
                    <button
                      className="iconBtn"
                      style={{ padding: 4, color: '#ef4444' }}
                      title="Delete Assignment"
                      onClick={() => onDelete('labour', a.id, 'assignment')}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   MODULE 8: MATERIAL & PROCUREMENT VIEW
   ========================================================================== */
function ProcurementView({ materials, purchaseOrders, projects, onRefresh, onAddProcurement, onDelete }: any) {
  return (
    <div>
      <div className="sectionHead">
        <div>
          <h2>Material & Procurement Engine</h2>
          <span>BOQ &gt; Material requirement &gt; Purchase request &gt; Vendor &gt; PO &gt; Ordered &gt; Received &gt; Store/Site &gt; Consumed</span>
        </div>
        <button className="primary" onClick={onAddProcurement}><Plus size={14} /> Add Material / PO</button>
      </div>

      <div className="twoCols">
        <div className="card">
          <div className="sectionHead">
            <h3>Material Master Catalog</h3>
          </div>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Material Name</th>
                  <th>Category</th>
                  <th>Unit Rate</th>
                  <th>Stock Qty</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((m: any) => (
                  <tr key={m.id}>
                    <td><b>{m.code}</b></td>
                    <td>{m.name}</td>
                    <td><span className="badge">{m.category}</span></td>
                    <td>{money(m.unitRate)} / {m.unit}</td>
                    <td><b>{m.stockQty} {m.unit}</b></td>
                    <td>
                      {onDelete && (
                        <button
                          className="iconBtn"
                          style={{ padding: 4, color: '#ef4444' }}
                          title="Delete Material"
                          onClick={() => onDelete('procurement', m.id, 'material')}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="sectionHead">
            <h3>Vendor Purchase Orders (PO)</h3>
          </div>
          <div className="list">
            {purchaseOrders.map((po: any) => (
              <div key={po.id} className="listItem" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <b>{po.poNo} — {po.vendorName}</b>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <StatusBadge>{po.status}</StatusBadge>
                    {onDelete && (
                      <button
                        className="iconBtn"
                        style={{ padding: 4, color: '#ef4444' }}
                        title="Delete PO"
                        onClick={() => onDelete('procurement', po.id, 'po')}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
                <small>Project: {po.project?.name}</small>
                <b className="goodText" style={{ marginTop: 4 }}>Total PO Amount: {money(po.totalAmount)}</b>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   MODULE 9: ISSUES & SNAGS VIEW
   ========================================================================== */
function SnagsView({ issues, projects, onRefresh, onAddSnag, onDelete }: any) {
  async function updateIssueStatus(id: string, status: string) {
    await fetch('/api/issues', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    });
    onRefresh();
  }

  return (
    <div>
      <div className="sectionHead">
        <div>
          <h2>Issues & Snag Tracker</h2>
          <span>Issue &gt; Category &gt; Photo &gt; Responsible person &gt; Deadline &gt; Action &gt; Resolved &gt; Verified &gt; Closed</span>
        </div>
        <button className="primary" onClick={onAddSnag}><Plus size={14} /> Log New Snag</button>
      </div>

      <div className="card tableCard">
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Issue Title</th>
                <th>Project</th>
                <th>Category</th>
                <th>Severity</th>
                <th>Action Plan</th>
                <th>Status</th>
                <th>Quick Action</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((i: any) => (
                <tr key={i.id}>
                  <td><b>{i.title}</b></td>
                  <td>{i.project?.name}</td>
                  <td><span className="badge">{i.category}</span></td>
                  <td><StatusBadge>{i.severity}</StatusBadge></td>
                  <td><small>{i.actionPlan || 'Under investigation'}</small></td>
                  <td><StatusBadge>{i.status}</StatusBadge></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {i.status !== 'Resolved' && (
                        <button className="small" onClick={() => updateIssueStatus(i.id, 'Resolved')}>
                          Mark Resolved
                        </button>
                      )}
                      {onDelete && (
                        <button
                          className="iconBtn"
                          style={{ padding: 4, color: '#ef4444' }}
                          title="Delete Issue"
                          onClick={() => onDelete('issues', i.id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   MODULE 10: BOQ & VARIATIONS VIEW
   ========================================================================== */
function VariationsView({ variations, projects, onRefresh, onAddVariation, onDelete }: any) {
  async function approveVariation(id: string) {
    await fetch('/api/variations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'Client Approved' })
    });
    onRefresh();
  }

  return (
    <div>
      <div className="sectionHead">
        <div>
          <h2>BOQ & Variation Engine</h2>
          <span>Original BOQ &gt; Addition/Deletion/Material change &gt; Variation request &gt; Cost calculation &gt; Client approval &gt; Revised contract</span>
        </div>
        <button className="primary" onClick={onAddVariation}><Plus size={14} /> Create Variation Request</button>
      </div>

      <div className="card tableCard">
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Variation No</th>
                <th>Project</th>
                <th>Title / Description</th>
                <th>Type</th>
                <th>Internal Cost Impact</th>
                <th>Client Price Impact</th>
                <th>Approval Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {variations.map((v: any) => (
                <tr key={v.id}>
                  <td><b>{v.variationNo}</b></td>
                  <td>{v.project?.name}</td>
                  <td>
                    <b>{v.title}</b>
                    <div style={{ fontSize: 8, color: '#778397' }}>{v.reason}</div>
                  </td>
                  <td><span className="badge">{v.type}</span></td>
                  <td>{money(v.costDifference)}</td>
                  <td><b className="goodText">+{money(v.priceImpact)}</b></td>
                  <td><StatusBadge>{v.status}</StatusBadge></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {v.status !== 'Client Approved' && (
                        <button className="primary" style={{ padding: '4px 8px', fontSize: 9 }} onClick={() => approveVariation(v.id)}>
                          Approve & Revise Contract
                        </button>
                      )}
                      {onDelete && (
                        <button
                          className="iconBtn"
                          style={{ padding: 4, color: '#ef4444' }}
                          title="Delete Variation"
                          onClick={() => onDelete('variations', v.id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   MODULE 11: FINANCE & P&L VIEW
   ========================================================================== */
function FinanceView({ summary, entries, projects, onRefresh, onAddFinance, onDelete }: any) {
  return (
    <div>
      <div className="sectionHead">
        <div>
          <h2>Finance & P&L Analysis</h2>
          <span>Contract value &gt; Approved variations &gt; Revenue &gt; Material/Labour/Subcontractor costs &gt; Gross profit &gt; Margin</span>
        </div>
        <button className="primary" onClick={onAddFinance}><Plus size={14} /> Log Finance Entry</button>
      </div>

      <div className="card tableCard" style={{ marginBottom: 15 }}>
        <div className="sectionHead">
          <h3>Project P&L Breakdown Table</h3>
        </div>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Contract Value</th>
                <th>Actual Spent Cost</th>
                <th>Gross Profit</th>
                <th>Profit Margin %</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((s: any) => (
                <tr key={s.id}>
                  <td><b>{s.name}</b></td>
                  <td>{money(s.contractValue)}</td>
                  <td>{money(s.actualCost)}</td>
                  <td><b className="goodText">{money(s.grossProfit)}</b></td>
                  <td><b className="goodText">{s.margin}%</b></td>
                  <td>
                    {onDelete && (
                      <button
                        className="iconBtn"
                        style={{ padding: 4, color: '#ef4444' }}
                        title="Delete Finance Entry"
                        onClick={() => onDelete('finance', s.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   MODULE 12: CLIENT PORTAL VIEW
   ========================================================================== */
function ClientPortalView({ projects, approvals, siteReports, onRefresh, onAddApproval, onDelete }: any) {
  async function updateApproval(id: string, status: string) {
    await fetch('/api/approvals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    });
    onRefresh();
  }

  return (
    <div>
      <div className="hero" style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)' }}>
        <h2>Solusi Design — Executive Client Portal</h2>
        <p>
          Welcome Aarav Mehta (TechCorp Solutions India). Real-time project progress timeline, 
          design 3D approvals, site photo feeds & payment schedule.
        </p>
      </div>

      <div className="twoCols" style={{ marginTop: 15 }}>
        <div className="card">
          <div className="sectionHead">
            <h3>Pending Client Approvals ({approvals.length})</h3>
            <button className="small" onClick={onAddApproval}><Plus size={12} /> New Approval Request</button>
          </div>
          <div className="list">
            {approvals.map((a: any) => (
              <div key={a.id} className="listItem" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <b>{a.title}</b>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <StatusBadge>{a.status}</StatusBadge>
                    {onDelete && (
                      <button
                        className="iconBtn"
                        style={{ padding: 4, color: '#ef4444' }}
                        title="Delete Approval Request"
                        onClick={() => onDelete('approvals', a.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
                <small>Type: {a.type} • Requested for {a.project?.name}</small>

                {a.status === 'Pending' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button className="primary" style={{ fontSize: 9, padding: '4px 10px' }} onClick={() => updateApproval(a.id, 'Approved')}>
                      Approve Request
                    </button>
                    <button className="small" style={{ fontSize: 9 }} onClick={() => updateApproval(a.id, 'Rejected')}>
                      Request Revision
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="sectionHead">
            <h3>Live Site Photos & Progress</h3>
          </div>
          {siteReports.slice(0, 2).map((r: any) => (
            <div key={r.id} style={{ marginBottom: 12 }}>
              <b>{r.project?.name} ({new Date(r.reportDate).toLocaleDateString()})</b>
              <p style={{ fontSize: 10, margin: '4px 0', color: '#4a5568' }}>{r.workCompleted}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {r.photos?.map((p: any) => (
                  <img key={p.id} src={p.imageUrl} alt="Site" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 8 }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   CREATION MODALS FOR ALL 12 MODULES
   ========================================================================== */

function DashboardSelectorModal({ onSelect, onClose }: any) {
  const options = [
    { key: 'crm', title: 'New CRM Lead', desc: 'Add new lead or sales opportunity' },
    { key: 'projects', title: 'New Project Master', desc: 'Initialize project & execution milestones' },
    { key: 'quotations', title: 'Create Commercial Quotation', desc: 'Build BOQ cost breakdown & price quote' },
    { key: 'design', title: 'Upload Design / Moodboard', desc: 'Add 3D render or material palette' },
    { key: 'site', title: 'Log Daily Site Report', desc: 'Record supervisor log & site photos' },
    { key: 'labour', title: 'Add Trade Worker / Assignment', desc: 'Assign worker to task' },
    { key: 'procurement', title: 'Add Material / Vendor PO', desc: 'Catalog material or create purchase order' },
    { key: 'snags', title: 'Log Issue or Site Snag', desc: 'Report defect or quality snag' },
    { key: 'variations', title: 'Create Variation Request', desc: 'Submit scope change or cost variation' },
    { key: 'finance', title: 'Log Finance Entry', desc: 'Record invoice, payment or expense' }
  ];

  return (
    <div className="modalBackdrop">
      <div className="modal" style={{ width: 'min(640px, 100%)' }}>
        <div className="modalHead">
          <div>
            <h2>Select Record Type to Create</h2>
            <small>SOLUSI OS QUICK ACTION</small>
          </div>
          <button onClick={onClose}>✕</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          {options.map(opt => (
            <div
              key={opt.key}
              className="card"
              style={{ cursor: 'pointer', padding: 12, border: '1px solid #e7ebf0' }}
              onClick={() => onSelect(opt.key)}
            >
              <b style={{ fontSize: 12, display: 'block', color: '#101827' }}>{opt.title}</b>
              <small style={{ fontSize: 9, color: '#778397' }}>{opt.desc}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CreateLeadModal({ clients, onClose, onSuccess }: any) {
  const [form, setForm] = useState({
    contactName: '',
    companyName: '',
    phone: '',
    email: '',
    projectType: 'Office Workspace',
    estimatedBudget: ''
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    onSuccess();
    onClose();
  }

  return (
    <div className="modalBackdrop">
      <div className="modal">
        <div className="modalHead">
          <div>
            <h2>Create New CRM Lead</h2>
            <small>SALES & CRM PIPELINE</small>
          </div>
          <button onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <label>Contact Name <input required value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} /></label>
          <label>Company Name <input value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} /></label>
          <div className="formGrid">
            <label>Phone <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></label>
            <label>Email <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
          </div>
          <label>Estimated Budget (₹) <input type="number" value={form.estimatedBudget} onChange={e => setForm({ ...form, estimatedBudget: e.target.value })} /></label>
          <button className="primary fullButton" type="submit">Create Lead</button>
        </form>
      </div>
    </div>
  );
}

function CreateProjectModal({ clients, onClose, onSuccess }: any) {
  const [form, setForm] = useState({
    name: '',
    location: '',
    contractValue: '',
    approvedBudget: '',
    clientId: clients[0]?.id || ''
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    onSuccess();
    onClose();
  }

  return (
    <div className="modalBackdrop">
      <div className="modal">
        <div className="modalHead">
          <div>
            <h2>Create New Project Master</h2>
            <small>PROJECT MASTER & EXECUTION</small>
          </div>
          <button onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <label>Project Name <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
          <label>Location <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></label>
          <div className="formGrid">
            <label>Contract Value (₹) <input type="number" value={form.contractValue} onChange={e => setForm({ ...form, contractValue: e.target.value })} /></label>
            <label>Approved Budget (₹) <input type="number" value={form.approvedBudget} onChange={e => setForm({ ...form, approvedBudget: e.target.value })} /></label>
          </div>
          <button className="primary fullButton" type="submit">Initialize Project & Milestones</button>
        </form>
      </div>
    </div>
  );
}

function EditProjectFinancialsModal({ project, onClose, onSuccess }: any) {
  const [form, setForm] = useState({
    contractValue: project?.contractValue || 0,
    approvedBudget: project?.approvedBudget || 0,
    actualCost: project?.actualCost || 0,
    progress: project?.progress || 0,
    status: project?.status || 'In Progress'
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/projects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: project.id,
        contractValue: form.contractValue,
        approvedBudget: form.approvedBudget,
        actualCost: form.actualCost,
        progress: form.progress,
        status: form.status
      })
    });
    onSuccess();
    onClose();
  }

  return (
    <div className="modalBackdrop">
      <div className="modal">
        <div className="modalHead">
          <div>
            <h2>Edit Project Metrics & Financials</h2>
            <small>CONTROL CONTRACT VALUE, BUDGET, SPENT COST & PROGRESS</small>
          </div>
          <button onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="formGrid">
            <label>
              Contract Value (₹)
              <span style={{ fontSize: 8, color: '#778397', display: 'block', fontWeight: 400 }}>Client contract price</span>
              <input type="number" step="any" value={form.contractValue} onChange={e => setForm({ ...form, contractValue: parseFloat(e.target.value) || 0 })} />
            </label>
            <label>
              Approved Budget (₹)
              <span style={{ fontSize: 8, color: '#778397', display: 'block', fontWeight: 400 }}>Internal cost budget</span>
              <input type="number" step="any" value={form.approvedBudget} onChange={e => setForm({ ...form, approvedBudget: parseFloat(e.target.value) || 0 })} />
            </label>
          </div>
          <div className="formGrid">
            <label>
              Actual Spent Cost (₹)
              <span style={{ fontSize: 8, color: '#778397', display: 'block', fontWeight: 400 }}>Total incurred spent cost</span>
              <input type="number" step="any" value={form.actualCost} onChange={e => setForm({ ...form, actualCost: parseFloat(e.target.value) || 0 })} />
            </label>
            <label>
              Overall Progress (%)
              <span style={{ fontSize: 8, color: '#778397', display: 'block', fontWeight: 400 }}>Site completion percentage</span>
              <input type="number" min="0" max="100" value={form.progress} onChange={e => setForm({ ...form, progress: parseInt(e.target.value) || 0 })} />
            </label>
          </div>
          <label>
            Project Execution Status
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="Planning">Planning</option>
              <option value="In Progress">In Progress</option>
              <option value="On Track">On Track</option>
              <option value="Delayed">Delayed</option>
              <option value="Completed">Completed</option>
            </select>
          </label>
          <button className="primary fullButton" type="submit">Save Changes</button>
        </form>
      </div>
    </div>
  );
}

function CreateQuotationModal({ projects, clients, onClose, onSuccess }: any) {
  const [form, setForm] = useState({
    title: '',
    projectId: projects[0]?.id || '',
    materialCost: '',
    labourCost: '',
    overheads: '',
    markupPct: '18'
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/quotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    onSuccess();
    onClose();
  }

  return (
    <div className="modalBackdrop">
      <div className="modal">
        <div className="modalHead">
          <div>
            <h2>Create Commercial Quotation</h2>
            <small>QUOTATIONS & BOQ ENGINE</small>
          </div>
          <button onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <label>Quotation Title <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Turnkey Fitout Commercial Package" /></label>
          <label>Project
            <select value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })}>
              {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <div className="formGrid">
            <label>Estimated Material Cost (₹) <input type="number" value={form.materialCost} onChange={e => setForm({ ...form, materialCost: e.target.value })} /></label>
            <label>Estimated Labour Cost (₹) <input type="number" value={form.labourCost} onChange={e => setForm({ ...form, labourCost: e.target.value })} /></label>
          </div>
          <div className="formGrid">
            <label>Overheads (₹) <input type="number" value={form.overheads} onChange={e => setForm({ ...form, overheads: e.target.value })} /></label>
            <label>Markup Target % <input type="number" value={form.markupPct} onChange={e => setForm({ ...form, markupPct: e.target.value })} /></label>
          </div>
          <button className="primary fullButton" type="submit">Generate Quotation</button>
        </form>
      </div>
    </div>
  );
}

function CreateDesignModal({ projects, onClose, onSuccess }: any) {
  const [form, setForm] = useState({
    title: '',
    projectId: projects[0]?.id || '',
    designType: '3D Render',
    fileUrl: '',
    notes: ''
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/design', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    onSuccess();
    onClose();
  }

  return (
    <div className="modalBackdrop">
      <div className="modal">
        <div className="modalHead">
          <div>
            <h2>Add Design Item or Moodboard</h2>
            <small>DESIGN STUDIO</small>
          </div>
          <button onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <label>Title <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Executive Boardroom 3D Render" /></label>
          <label>Project
            <select value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })}>
              {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label>Design Deliverable Type
            <select value={form.designType} onChange={e => setForm({ ...form, designType: e.target.value })}>
              <option value="3D Render">3D Render</option>
              <option value="Layout 2D">Layout 2D Floorplan</option>
              <option value="moodboard">Moodboard Material Palette</option>
              <option value="Working Drawing">Working Drawing Package</option>
            </select>
          </label>
          <label>Image or File URL <input value={form.fileUrl} onChange={e => setForm({ ...form, fileUrl: e.target.value })} placeholder="https://..." /></label>
          <label>Designer Notes <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></label>
          <button className="primary fullButton" type="submit">Submit to Design Studio</button>
        </form>
      </div>
    </div>
  );
}

function CreateSiteReportModal({ projects, onClose, onSuccess }: any) {
  const [form, setForm] = useState({
    projectId: projects[0]?.id || '',
    labourPresent: '20',
    workCompleted: '',
    materialsRecd: '',
    photoUrl: '',
    photoCaption: ''
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/site-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    onSuccess();
    onClose();
  }

  return (
    <div className="modalBackdrop">
      <div className="modal">
        <div className="modalHead">
          <div>
            <h2>Log Daily Site Report</h2>
            <small>SITE CONTROL</small>
          </div>
          <button onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <label>Project
            <select value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })}>
              {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label>Labour Count Present <input type="number" value={form.labourPresent} onChange={e => setForm({ ...form, labourPresent: e.target.value })} /></label>
          <label>Work Completed Today <textarea rows={3} style={{ width: '100%', marginTop: 5, padding: 8 }} required value={form.workCompleted} onChange={e => setForm({ ...form, workCompleted: e.target.value })} /></label>
          <label>Materials Received <input value={form.materialsRecd} onChange={e => setForm({ ...form, materialsRecd: e.target.value })} /></label>
          <label>Site Progress Image / Photo URL <input value={form.photoUrl} onChange={e => setForm({ ...form, photoUrl: e.target.value })} placeholder="https://images.unsplash.com/..." /></label>
          <label>Photo Caption <input value={form.photoCaption} onChange={e => setForm({ ...form, photoCaption: e.target.value })} placeholder="e.g. Partition framing completed in Zone A" /></label>
          <button className="primary fullButton" type="submit">Submit Site Report</button>
        </form>
      </div>
    </div>
  );
}

function CreateLabourModal({ projects, onClose, onSuccess }: any) {
  const [form, setForm] = useState({
    type: 'worker',
    name: '',
    trade: 'Carpentry',
    dailyRate: '',
    phone: '',
    projectId: projects[0]?.id || '',
    taskName: ''
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/labour', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    onSuccess();
    onClose();
  }

  return (
    <div className="modalBackdrop">
      <div className="modal">
        <div className="modalHead">
          <div>
            <h2>Add Trade Contractor / Assignment</h2>
            <small>LABOUR MANAGEMENT</small>
          </div>
          <button onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <label>Entry Type
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="worker">New Trade Contractor / Worker</option>
              <option value="assignment">New Task Assignment</option>
            </select>
          </label>

          {form.type === 'worker' ? (
            <>
              <label>Contractor / Worker Name <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
              <label>Trade Specialization
                <select value={form.trade} onChange={e => setForm({ ...form, trade: e.target.value })}>
                  <option value="Carpentry">Carpentry</option>
                  <option value="Electrician">Electrician</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Mason">Mason</option>
                  <option value="Painter">Painter</option>
                  <option value="False Ceiling">False Ceiling</option>
                  <option value="HVAC Specialist">HVAC Specialist</option>
                </select>
              </label>
              <div className="formGrid">
                <label>Daily Rate (₹) <input type="number" value={form.dailyRate} onChange={e => setForm({ ...form, dailyRate: e.target.value })} /></label>
                <label>Phone <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></label>
              </div>
            </>
          ) : (
            <>
              <label>Project
                <select value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })}>
                  {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
              <label>Task Description <input required value={form.taskName} onChange={e => setForm({ ...form, taskName: e.target.value })} /></label>
            </>
          )}

          <button className="primary fullButton" type="submit">Save Labour Record</button>
        </form>
      </div>
    </div>
  );
}

function CreateProcurementModal({ projects, onClose, onSuccess }: any) {
  const [form, setForm] = useState({
    type: 'material',
    name: '',
    category: 'Woodwork',
    unit: 'sqft',
    unitRate: '',
    stockQty: '',
    vendorName: '',
    projectId: projects[0]?.id || '',
    totalAmount: ''
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/procurement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    onSuccess();
    onClose();
  }

  return (
    <div className="modalBackdrop">
      <div className="modal">
        <div className="modalHead">
          <div>
            <h2>Add Material / Purchase Order</h2>
            <small>MATERIAL & PROCUREMENT</small>
          </div>
          <button onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <label>Entry Type
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="material">New Catalog Material</option>
              <option value="po">New Vendor Purchase Order (PO)</option>
            </select>
          </label>

          {form.type === 'material' ? (
            <>
              <label>Material Name <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
              <div className="formGrid">
                <label>Category <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></label>
                <label>Unit (sqft, rft, nos) <input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} /></label>
              </div>
              <div className="formGrid">
                <label>Unit Rate (₹) <input type="number" value={form.unitRate} onChange={e => setForm({ ...form, unitRate: e.target.value })} /></label>
                <label>Stock Qty <input type="number" value={form.stockQty} onChange={e => setForm({ ...form, stockQty: e.target.value })} /></label>
              </div>
            </>
          ) : (
            <>
              <label>Vendor / Supplier Name <input required value={form.vendorName} onChange={e => setForm({ ...form, vendorName: e.target.value })} /></label>
              <label>Project
                <select value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })}>
                  {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
              <label>Total PO Amount (₹) <input type="number" required value={form.totalAmount} onChange={e => setForm({ ...form, totalAmount: e.target.value })} /></label>
            </>
          )}

          <button className="primary fullButton" type="submit">Save Procurement Record</button>
        </form>
      </div>
    </div>
  );
}

function CreateSnagModal({ projects, onClose, onSuccess }: any) {
  const [form, setForm] = useState({
    title: '',
    projectId: projects[0]?.id || '',
    category: 'Quality',
    severity: 'Medium',
    description: '',
    actionPlan: ''
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    onSuccess();
    onClose();
  }

  return (
    <div className="modalBackdrop">
      <div className="modal">
        <div className="modalHead">
          <div>
            <h2>Log Issue or Site Snag</h2>
            <small>ISSUES & SNAG TRACKER</small>
          </div>
          <button onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <label>Issue Title <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Door frame alignment discrepancy" /></label>
          <label>Project
            <select value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })}>
              {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <div className="formGrid">
            <label>Category
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="Quality">Quality</option>
                <option value="Safety">Safety</option>
                <option value="Design Mismatch">Design Mismatch</option>
                <option value="Damage">Damage</option>
                <option value="Delay">Delay</option>
              </select>
            </label>
            <label>Severity
              <select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </label>
          </div>
          <label>Action Plan <input value={form.actionPlan} onChange={e => setForm({ ...form, actionPlan: e.target.value })} placeholder="Immediate steps to resolve" /></label>
          <button className="primary fullButton" type="submit">Submit Issue</button>
        </form>
      </div>
    </div>
  );
}

function CreateVariationModal({ projects, onClose, onSuccess }: any) {
  const [form, setForm] = useState({
    title: '',
    projectId: projects[0]?.id || '',
    type: 'Addition',
    reason: '',
    costDifference: '',
    priceImpact: ''
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/variations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    onSuccess();
    onClose();
  }

  return (
    <div className="modalBackdrop">
      <div className="modal">
        <div className="modalHead">
          <div>
            <h2>Create Variation Request</h2>
            <small>BOQ & VARIATION ENGINE</small>
          </div>
          <button onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <label>Variation Title <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Additional Acoustic Paneling in Main Bay" /></label>
          <label>Project
            <select value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })}>
              {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label>Variation Type
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="Addition">Scope Addition</option>
              <option value="Deletion">Scope Deletion</option>
              <option value="Material Change">Material Upgrade / Change</option>
            </select>
          </label>
          <div className="formGrid">
            <label>Internal Cost Impact (₹) <input type="number" value={form.costDifference} onChange={e => setForm({ ...form, costDifference: e.target.value })} /></label>
            <label>Client Price Impact (₹) <input type="number" value={form.priceImpact} onChange={e => setForm({ ...form, priceImpact: e.target.value })} /></label>
          </div>
          <label>Reason / Justification <input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></label>
          <button className="primary fullButton" type="submit">Submit Variation Request</button>
        </form>
      </div>
    </div>
  );
}

function CreateFinanceModal({ projects, onClose, onSuccess }: any) {
  const [form, setForm] = useState({
    type: 'Invoice',
    projectId: projects[0]?.id || '',
    category: 'Milestone Payment',
    referenceNo: '',
    amount: '',
    paymentMode: 'Bank Transfer',
    notes: ''
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/finance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    onSuccess();
    onClose();
  }

  return (
    <div className="modalBackdrop">
      <div className="modal">
        <div className="modalHead">
          <div>
            <h2>Log Finance Entry</h2>
            <small>FINANCE & P&L ANALYSIS</small>
          </div>
          <button onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <label>Transaction Type
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="Invoice">Client Invoice Generated</option>
              <option value="Client Payment">Client Payment Received</option>
              <option value="Material Cost">Material Expense</option>
              <option value="Labour Cost">Labour Payout</option>
              <option value="Subcontractor Cost">Subcontractor Payout</option>
              <option value="Overhead">Overhead Expense</option>
            </select>
          </label>
          <label>Project
            <select value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })}>
              {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <div className="formGrid">
            <label>Amount (₹) <input type="number" required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></label>
            <label>Reference / Inv No <input value={form.referenceNo} onChange={e => setForm({ ...form, referenceNo: e.target.value })} /></label>
          </div>
          <button className="primary fullButton" type="submit">Record Financial Transaction</button>
        </form>
      </div>
    </div>
  );
}

function CreateApprovalModal({ projects, onClose, onSuccess }: any) {
  const [form, setForm] = useState({
    title: '',
    projectId: projects[0]?.id || '',
    type: 'Design',
    clientNote: ''
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/approvals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    onSuccess();
    onClose();
  }

  return (
    <div className="modalBackdrop">
      <div className="modal">
        <div className="modalHead">
          <div>
            <h2>Request Client Approval</h2>
            <small>EXECUTIVE CLIENT PORTAL</small>
          </div>
          <button onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <label>Approval Title <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Boardroom Glass Specification Approval" /></label>
          <label>Project
            <select value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })}>
              {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label>Type
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="Design">Design Render</option>
              <option value="Moodboard">Material Moodboard</option>
              <option value="Quotation">BOQ Quotation</option>
              <option value="Variation">Variation Request</option>
            </select>
          </label>
          <button className="primary fullButton" type="submit">Send Approval Request to Client</button>
        </form>
      </div>
    </div>
  );
}
