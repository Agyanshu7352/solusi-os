 "use client";
import { useMemo, useState } from "react";
import {
  LayoutDashboard, BriefcaseBusiness, Users, Palette, Images, CheckCircle2,
  ClipboardList, HardHat, AlertTriangle, Boxes, Truck, ReceiptText, Wallet,
  ExternalLink, Plus, Search, Bell, ChevronRight, ArrowUpRight, PackagePlus,
  FileText, Menu, X, Settings
} from "lucide-react";

type Project = {id:number;name:string;client:string;value:number;cost:number;progress:number;status:string;pm:string;sup:string;due:string};
type Lead = {name:string;stage:string;value:number;owner:string};
type Task = {name:string;project:string;owner:string;due:string;priority:string;status:string};
type Issue = {name:string;project:string;owner:string;severity:string;status:string};
type Material = {code:string;name:string;category:string;unit:string;stock:number;reserved:number;rate:number};

const initialProjects:Project[]=[
 {id:1,name:"Eon Fairfox — Unit 1914",client:"ABC Corporate",value:3200000,cost:2050000,progress:64,status:"On Track",pm:"Aman",sup:"Ravi",due:"10 Sep 2026"},
 {id:2,name:"Sector 18 Corporate Office",client:"Northstar Pvt Ltd",value:1850000,cost:1320000,progress:48,status:"At Risk",pm:"Neha",sup:"Suresh",due:"05 Sep 2026"},
 {id:3,name:"Noida Tech Office",client:"Vertex Systems",value:4200000,cost:2480000,progress:82,status:"On Track",pm:"Aman",sup:"Imran",due:"25 Aug 2026"}
];
const initialLeads:Lead[]=[
 {name:"Vertex Healthcare",stage:"Proposal",value:4500000,owner:"Neha"},
 {name:"Apex Legal",stage:"Site Visit",value:1800000,owner:"Aman"},
 {name:"Nova Tech",stage:"Negotiation",value:3200000,owner:"Neha"},
 {name:"Orbit Finance",stage:"New",value:2700000,owner:"Aman"}
];
const initialTasks:Task[]=[
 {name:"Complete ceiling grid — zone B",project:"Eon Fairfox — Unit 1914",owner:"Ravi",due:"14 Aug",priority:"High",status:"Open"},
 {name:"Resolve waterproofing snag",project:"Sector 18 Corporate Office",owner:"Suresh",due:"13 Aug",priority:"Critical",status:"Open"},
 {name:"Final electrical testing",project:"Noida Tech Office",owner:"Imran",due:"16 Aug",priority:"Medium",status:"Done"},
 {name:"Approve workstation hardware",project:"Eon Fairfox — Unit 1914",owner:"Aman",due:"14 Aug",priority:"High",status:"Open"}
];
const initialIssues:Issue[]=[
 {name:"Waterproofing snag",project:"Sector 18 Corporate Office",owner:"Suresh",severity:"Critical",status:"Open"},
 {name:"Light points pending",project:"Eon Fairfox — Unit 1914",owner:"Ravi",severity:"Medium",status:"Open"},
 {name:"Drawing approval pending",project:"Noida Tech Office",owner:"Aman",severity:"High",status:"Open"}
];
const initialMaterials:Material[]=[
 {code:"MAT-001",name:"18mm MDF — Prelam Oak",category:"Board",unit:"Sheet",stock:42,reserved:12,rate:1400},
 {code:"MAT-014",name:"Natural Oak Laminate",category:"Laminate",unit:"Sheet",stock:85,reserved:20,rate:1150},
 {code:"EL-041",name:"12W LED Downlight 4000K",category:"Electrical",unit:"Nos",stock:126,reserved:40,rate:598},
 {code:"CE-009",name:"GI Ceiling Channel",category:"Ceiling",unit:"M",stock:240,reserved:80,rate:200},
 {code:"FAB-018",name:"Charcoal Acoustic Fabric",category:"Acoustic",unit:"M",stock:64,reserved:12,rate:780}
];

const nav = [
 ["Command Center",LayoutDashboard,"home"],["Sales & CRM",Users,"sales"],["Quotations",ReceiptText,"quotations"],
 ["Design Studio",Palette,"design"],["Material Library",Images,"library"],["Moodboards",Images,"moodboards"],["Client Approvals",CheckCircle2,"approvals"],
 ["Projects",BriefcaseBusiness,"projects"],["Tasks & SOP",ClipboardList,"tasks"],["Site Control",HardHat,"site"],["Labour",Users,"labour"],["Issues & Snags",AlertTriangle,"issues"],
 ["Inventory",Boxes,"inventory"],["Procurement",Truck,"procurement"],["BOQ & Variations",FileText,"boq"],["Finance & P&L",Wallet,"finance"],["Client Portal",ExternalLink,"portal"]
] as const;

const money=(n:number)=>`₹${(n/100000).toFixed(1)}L`;
function Badge({children}:{children:string}) {
 const good=["On Track","Done","Paid","Received","Approved"].includes(children);
 const bad=["Critical","Delayed","Overdue"].includes(children);
 return <span className={`badge ${good?"good":bad?"bad":"warn"}`}>{children}</span>
}
function Card({children,className=""}:{children:React.ReactNode,className?:string}){return <div className={`card ${className}`}>{children}</div>}
function Section({title,sub,action}:{title:string;sub?:string;action?:React.ReactNode}){return <div className="sectionHead"><div><h3>{title}</h3>{sub&&<span>{sub}</span>}</div>{action}</div>}

export default function Home(){
 const [view,setView]=useState("home"); const [mobile,setMobile]=useState(false);
 const [projects,setProjects]=useState(initialProjects); const [leads,setLeads]=useState(initialLeads);
 const [tasks,setTasks]=useState(initialTasks); const [issues,setIssues]=useState(initialIssues);
 const [materials,setMaterials]=useState(initialMaterials); const [query,setQuery]=useState("");
 const [modal,setModal]=useState<string|null>(null);

 const projectBook=projects.reduce((a,p)=>a+p.value,0);
 const cost=projects.reduce((a,p)=>a+p.cost,0);
 const pipeline=leads.reduce((a,l)=>a+l.value,0);
 const openIssues=issues.filter(i=>i.status==="Open").length;

 const addProject=()=>{
   const name=prompt("Project name"); if(!name)return;
   setProjects(p=>[...p,{id:Date.now(),name,client:"New Client",value:0,cost:0,progress:0,status:"On Track",pm:"Unassigned",sup:"Unassigned",due:"TBD"}]);
 };
 const addLead=()=>{
   const name=prompt("Lead / company"); if(!name)return;
   setLeads(l=>[...l,{name,stage:"New",value:0,owner:"Unassigned"}]);
 };
 const addMaterial=()=>{
   const name=prompt("Material name"); if(!name)return;
   setMaterials(m=>[{code:`MAT-${String(Date.now()).slice(-3)}`,name,category:"General",unit:"Nos",stock:0,reserved:0,rate:0},...m]);
 };
 const toggleTask=(idx:number)=>setTasks(t=>t.map((x,i)=>i===idx?{...x,status:x.status==="Done"?"Open":"Done"}:x));
 const resolveIssue=(idx:number)=>setIssues(i=>i.map((x,n)=>n===idx?{...x,status:x.status==="Open"?"Resolved":"Open"}:x));

 const content=useMemo(()=>({
  home:<Dashboard projects={projects} tasks={tasks} issues={issues} projectBook={projectBook} cost={cost} pipeline={pipeline} openIssues={openIssues}/>,
  sales:<Sales leads={leads} onAdd={addLead}/>,
  quotations:<Quotations/>,
  design:<Design onLibrary={()=>setView("library")} onMood={()=>setView("moodboards")}/>,
  library:<Library materials={materials} onAdd={addMaterial}/>,
  moodboards:<Moodboards/>,
  approvals:<Approvals/>,
  projects:<Projects projects={projects} onAdd={addProject}/>,
  tasks:<Tasks tasks={tasks} toggle={toggleTask} onAdd={()=>setModal("task")}/>,
  site:<Site/>,
  labour:<Labour/>,
  issues:<Issues issues={issues} resolve={resolveIssue} onAdd={()=>setModal("issue")}/>,
  inventory:<Inventory materials={materials} onAdd={addMaterial}/>,
  procurement:<Procurement/>,
  boq:<BOQ/>,
  finance:<Finance/>,
  portal:<Portal/>
 } as Record<string,React.ReactNode>)[view],[view,projects,tasks,issues,materials,leads,projectBook,cost,pipeline,openIssues]);

 return <div className="app">
   <aside className={`sidebar ${mobile?"show":""}`}>
    <div className="brand"><div className="mark">S</div><div><b>solusi</b><small>OPERATING SYSTEM</small></div><button className="mobileClose" onClick={()=>setMobile(false)}><X size={18}/></button></div>
    <div className="workspace"><small>WORKSPACE</small><b>Solusi Design</b><span>Commercial Interiors</span></div>
    <nav>{nav.map(([label,Icon,key])=><button key={key} className={view===key?"active":""} onClick={()=>{setView(key);setMobile(false)}}><Icon size={16}/><span>{label}</span>{key==="issues"&&openIssues>0?<em>{openIssues}</em>:null}</button>)}</nav>
    <div className="user"><div className="avatar">SH</div><div><b>Shubh</b><small>Owner</small></div><Settings size={15}/></div>
   </aside>
   <main>
    <header><div className="headerTitle"><button className="hamb" onClick={()=>setMobile(true)}><Menu size={20}/></button><div className="eyebrow">SOLUSI DESIGN / {nav.find(x=>x[2]===view)?.[0].toUpperCase()}</div><h1>{nav.find(x=>x[2]===view)?.[0]}</h1></div>
     <div className="headerTools"><div className="search"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search projects, tasks, materials…"/></div><button className="iconBtn"><Bell size={16}/><i/></button><button className="primary" onClick={()=>setModal(view)}> <Plus size={15}/> Create</button></div>
    </header>
    <section className="page">{content}</section>
   </main>
   {modal&&<Modal type={modal} close={()=>setModal(null)} addTask={(t)=>{setTasks(x=>[t,...x]);setModal(null)}} addIssue={(i)=>{setIssues(x=>[i,...x]);setModal(null)}}/>}
 </div>
}

function Dashboard({projects,tasks,issues,projectBook,cost,pipeline,openIssues}:{projects:Project[];tasks:Task[];issues:Issue[];projectBook:number;cost:number;pipeline:number;openIssues:number}){
 return <><div className="welcome"><div><h2>Good evening, Shubh.</h2><p>Everything that needs your attention, in one operating view.</p></div><span className="date">Thursday • 13 August 2026</span></div>
 <div className="kpis grid5">
  <Kpi title="PROJECT BOOK" value={money(projectBook)} note={`${projects.length} active projects`}/>
  <Kpi title="EST. GROSS PROFIT" value={money(projectBook-cost)} note={`${Math.round((projectBook-cost)/Math.max(projectBook,1)*100)}% blended margin`} good/>
  <Kpi title="RECEIVABLES" value="₹15.1L" note="Collection queue" bad/>
  <Kpi title="OPEN PIPELINE" value={money(pipeline)} note={`${4} opportunities`} good/>
  <Kpi title="ACTION ITEMS" value={String(openIssues+tasks.filter(t=>t.status!=="Done").length)} note={`${openIssues} escalations`} bad/>
 </div>
 <div className="twoCols">
  <Card><Section title="Project Command" sub="Progress • margin • risk"/>{projects.map(p=><div className="project" key={p.id}><div className="projectTop"><b>{p.name}</b><Badge>{p.status}</Badge></div><small>{p.client} • PM {p.pm} • Supervisor {p.sup}</small><div className="bar"><i style={{width:`${p.progress}%`}}/></div><div className="projectFoot"><span>{p.progress}% complete • due {p.due}</span><b>{money(p.value-p.cost)} est. GP</b></div></div>)}</Card>
  <Card><Section title="CEO Action Queue" sub="Priority first"/><div className="list">{issues.slice(0,3).map((i,n)=><div className="listItem" key={n}><AlertTriangle size={15} className="redIcon"/><div><b>{i.name}</b><small>{i.project} • {i.owner}</small></div><Badge>{i.severity}</Badge></div>)}{tasks.filter(t=>t.status!=="Done").slice(0,3).map((t,n)=><div className="listItem" key={"t"+n}><ClipboardList size={15} className="amberIcon"/><div><b>{t.name}</b><small>{t.owner} • due {t.due}</small></div><Badge>{t.priority}</Badge></div>)}</div></Card>
 </div>
 <div className="threeCols"><Card><Section title="Inventory Health"/><strong className="big">557</strong><small>tracked units on hand</small><div className="stockBar"><i/><b/></div><div className="tinyRow"><span>Available</span><span>Reserved</span></div></Card><Card><Section title="Site Workforce"/><strong className="big">40</strong><small>workers reported today</small><div className="tinyRow"><span>Plan 46</span><span className="badText">6 shortage</span></div></Card><Card><Section title="Client Decisions"/><strong className="big">4</strong><small>materials / drawings awaiting approval</small><div className="tinyRow"><span>2 due today</span><span>Open portal →</span></div></Card></div>
 </>}
function Kpi({title,value,note,good,bad}:{title:string;value:string;note:string;good?:boolean;bad?:boolean}){return <Card className="kpi"><div className="kpiTop">{title}<ArrowUpRight size={13}/></div><strong>{value}</strong><small className={bad?"badText":good?"goodText":""}>{note}</small></Card>}

function Sales({leads,onAdd}:{leads:Lead[];onAdd:()=>void}){return <><Top title="Sales & CRM" sub="Turn enquiries into predictable project revenue." action={<button className="primary" onClick={onAdd}><Plus size={14}/> New Lead</button>}/><Card><Table headers={["Lead","Stage","Value","Owner","Next Action"]} rows={leads.map(l=>[<b>{l.name}</b>,<Badge>{l.stage}</Badge>,money(l.value),l.owner,"Follow up today"])}/></Card></>}
function Quotations(){return <><Hero title="Quotations, without the chaos." text="Build proposals from your BOQ, apply margin rules, capture revisions and convert an approved quote directly into a project."/><div className="threeCols"><Card><Section title="Commercial Templates"/><List items={["Turnkey Interior","Design Consultancy","Fit-out Execution"]}/></Card><Card><Section title="Approval Rules"/><List items={["Discount > 5% → Owner approval","Margin < 25% → Escalate","Variation > ₹1L → Client approval"]}/></Card><Card><Section title="Recent Proposals"/><List items={["Nova Tech • ₹32L • Negotiation","Vertex Healthcare • ₹45L • Proposal"]}/></Card></div></>}
function Design({onLibrary,onMood}:{onLibrary:()=>void;onMood:()=>void}){return <><Top title="Design Studio" sub="Bring design decisions into the same system as execution."/><Hero title="Design → Selection → BOQ" text="Every selected finish carries a material code, approved rate, supplier and inventory status." actions={<><button onClick={onLibrary}>Browse Materials</button><button onClick={onMood}>Build Moodboard</button></>}/><div className="threeCols"><Card><h3>Design Deliverables</h3><p>Floor plans • ceiling plans • elevations • 3D renders • material schedules • furniture layouts.</p></Card><Card><h3>Selection Control</h3><p>Versioned selections with client approval and substitution history.</p></Card><Card><h3>Commercial Link</h3><p>Approved selections flow into BOQ and procurement requirements.</p></Card></div></>}
function Library({materials,onAdd}:{materials:Material[];onAdd:()=>void}){return <><Top title="Material Library" sub="Your private catalogue of finishes, products and suppliers." action={<button className="primary" onClick={onAdd}><Plus size={14}/> Add Material</button>}/><div className="materialGrid">{materials.map((m,i)=><div className="material" key={m.code}><div className={`materialVisual v${i%4}`}/><div className="materialInfo"><b>{m.name}</b><small>{m.code} • {m.category} • {m.unit}</small></div></div>)}</div></>}
function Moodboards(){return <><Top title="Moodboards" sub="Present curated concepts and let clients choose with confidence." action={<button className="primary"><Plus size={14}/> New Moodboard</button>}/><div className="threeCols"><Mood name="Warm Contemporary" project="Eon Fairfox — Unit 1914" tags={["Natural Oak","Sandstone Beige","Charcoal Carpet","Black Metal"]}/><Mood name="Modern Executive" project="Sector 18 Corporate Office" tags={["Graphite Grey","Walnut","Dark Carpet","Brushed Metal"]}/><Mood name="Minimal Tech" project="Noida Tech Office" tags={["White Oak","Light Grey","Acoustic Fabric","Black"]}/></div></>}
function Mood({name,project,tags}:{name:string;project:string;tags:string[]}){return <Card className="mood"><div className="moodVisual"/><b>{name}</b><small>{project}</small><div className="chips">{tags.map(t=><span key={t}>{t}</span>)}</div><div className="rowButtons"><button className="small">Share with Client</button><button className="small">Export PDF</button></div></Card>}
function Approvals(){return <><Top title="Client Approvals" sub="One place for material, drawing, variation and design decisions."/><Card><div className="list">{["Natural Oak — LAM-024 • Eon Fairfox","Ceiling Detail — Rev 04 • Sector 18","Additional Conference Room • VO-07 ₹1.1L","Task Chair Selection • Noida Tech"].map(x=><div className="listItem" key={x}><CheckCircle2 size={15}/><div><b>{x}</b><small>Waiting for client decision</small></div><Badge>Pending</Badge><button className="small">Remind</button></div>)}</div></Card></>}
function Projects({projects,onAdd}:{projects:Project[];onAdd:()=>void}){return <><Top title="Projects" sub="From mobilisation to handover — one source of truth." action={<button className="primary" onClick={onAdd}><Plus size={14}/> New Project</button>}/><div className="threeCols">{projects.map(p=><Card key={p.id}><div className="sectionHead"><h3>{p.name}</h3><Badge>{p.status}</Badge></div><small>{p.client}</small><div className="bar bigbar"><i style={{width:`${p.progress}%`}}/></div><div className="projectFoot"><span>{p.progress}% complete</span><b>{money(p.value-p.cost)} GP</b></div><div className="miniStats"><div><small>Value</small><b>{money(p.value)}</b></div><div><small>Cost</small><b>{money(p.cost)}</b></div></div><small>PM {p.pm} • Supervisor {p.sup} • Due {p.due}</small></Card>)}</div></>}
function Tasks({tasks,toggle,onAdd}:{tasks:Task[];toggle:(i:number)=>void;onAdd:()=>void}){return <><Top title="Tasks & SOP" sub="Accountability is built into every repeatable process." action={<button className="primary" onClick={onAdd}><Plus size={14}/> Assign Task</button>}/><Card><Table headers={["Task","Project","Owner","Due","Priority","Status",""]} rows={tasks.map((t,i)=>[<b>{t.name}</b>,t.project,t.owner,t.due,<Badge>{t.priority}</Badge>,<Badge>{t.status}</Badge>,<button className="small" onClick={()=>toggle(i)}>{t.status==="Done"?"Reopen":"Complete"}</button>])}/></Card></>}
function Site(){return <><Top title="Site Control" sub="See what is happening at every site without calling everyone." action={<button className="primary"><Plus size={14}/> Daily Report</button>}/><div className="threeCols">{["Eon Fairfox — Unit 1914","Sector 18 Corporate Office","Noida Tech Office"].map((p,i)=><Card key={p}><Section title={p} sub={`Supervisor: ${["Ravi","Suresh","Imran"][i]}`}/><div className="sitePhoto"/><p><b>Work completed:</b> {["Ceiling + electrical","Gypsum + paint","Electrical + furniture"][i]}</p><small>Labour reported: {[14,9,17][i]} • Photos: 6</small><p><b>Issue:</b> {i===1?"Waterproofing snag":"None"}</p></Card>)}</div></>}
function Labour(){return <><div className="kpis grid4"><Kpi title="TODAY'S LABOUR" value="40" note="6 below plan" bad/><Kpi title="ATTENDANCE" value="87%" note="Across active sites" good/><Kpi title="LABOUR COST / DAY" value="₹38K" note="Within project budgets"/><Kpi title="PRODUCTIVITY" value="92%" note="vs planned output" good/></div><Card className="tableCard"><Section title="Site Manpower" sub="Daily labour control"/><Table headers={["Project","Trade","Plan","Present","Contractor","Cost"]} rows={[["Eon Fairfox","Carpenter","6","5","Ravi Team","₹4,500"],["Eon Fairfox","Electrician","4","4","PowerPro","₹3,800"],["Sector 18","Painter","5","3","Colour Crew","₹2,550"]]}/></Card></>}
function Issues({issues,resolve,onAdd}:{issues:Issue[];resolve:(i:number)=>void;onAdd:()=>void}){return <><Top title="Issues & Snags" sub="Every problem gets an owner, severity and closure." action={<button className="primary" onClick={onAdd}><Plus size={14}/> Report Issue</button>}/><Card><Table headers={["Issue","Project","Owner","Severity","Status",""]} rows={issues.map((x,i)=>[<b>{x.name}</b>,x.project,x.owner,<Badge>{x.severity}</Badge>,<Badge>{x.status}</Badge>,<button className="small" onClick={()=>resolve(i)}>{x.status==="Open"?"Resolve":"Reopen"}</button>])}/></Card></>}
function Inventory({materials,onAdd}:{materials:Material[];onAdd:()=>void}){let value=materials.reduce((a,m)=>a+m.stock*m.rate,0),units=materials.reduce((a,m)=>a+m.stock,0);return <><Top title="Inventory" sub="Know what you own, where it is reserved, and what each project consumed." action={<button className="primary" onClick={onAdd}><PackagePlus size={14}/> Stock In</button>}/><div className="kpis grid4"><Kpi title="STOCK VALUE" value={money(value)} note="Tracked inventory"/><Kpi title="UNITS ON HAND" value={String(units)} note="Across materials"/><Kpi title="RESERVED" value={String(materials.reduce((a,m)=>a+m.reserved,0))} note="For active projects"/><Kpi title="LOW STOCK" value={String(materials.filter(m=>m.stock-m.reserved<15).length)} note="Reorder attention" bad/></div><Card className="tableCard"><Section title="Stock Register" sub="Available = on hand − reserved"/><Table headers={["Code","Material","Category","Unit","On Hand","Reserved","Available","Value"]} rows={materials.map(m=>[m.code,<b>{m.name}</b>,m.category,m.unit,m.stock,m.reserved,m.stock-m.reserved,money(m.stock*m.rate)])}/></Card></>}
function Procurement(){return <><Top title="Procurement" sub="Requirement → approval → PO → delivery → receipt → project issue." action={<button className="primary"><Plus size={14}/> Material Request</button>}/><Card><Table headers={["Material","Project","Supplier","Qty","Required","Value","Status"]} rows={[["Workstation hardware","Eon Fairfox","ABC Hardware","1 lot","15 Aug",money(185000),"Ordered"],["Gypsum boards","Sector 18","XYZ Buildmart","120 sheets","14 Aug",money(72000),"Received"],["Task chairs","Noida Tech","OfficeFit","42 nos","18 Aug",money(168000),"Pending"]].map(r=>[r[0],r[1],r[2],r[3],r[4],r[5],<Badge>{r[6] as string}</Badge>])}/></Card></>}
function BOQ(){return <><div className="kpis grid4"><Kpi title="BOQ BUDGET" value="₹116.1L" note="Approved scope"/><Kpi title="ACTUAL" value="₹101.2L" note="Recorded costs"/><Kpi title="VARIANCE" value="₹14.9L" note="Under budget" good/><Kpi title="VARIATIONS" value="7" note="₹4.2L pending approval"/></div><Card className="tableCard"><Section title="BOQ vs Actual" action={<button className="primary"><Plus size={14}/> BOQ Line</button>}/><Table headers={["Project","Item","Category","Qty","Rate","Budget","Actual","Variance"]} rows={[["Eon Fairfox","False ceiling","Ceiling","4500 sqft","₹85","₹3.8L","₹3.6L","₹0.2L"],["Eon Fairfox","Electrical points","Electrical","160 point","₹650","₹1.0L","₹0.9L","₹0.1L"],["Sector 18","Gypsum partition","Partition","1800 sqft","₹95","₹1.7L","₹1.9L","-₹0.2L"]].map(r=>r)}/></Card></>}
function Finance(){return <><div className="kpis grid4"><Kpi title="INVOICED" value="₹21.1L" note="Current active projects"/><Kpi title="COLLECTED" value="₹15.5L" note="73% collected" good/><Kpi title="OUTSTANDING" value="₹5.6L" note="Collection queue" bad/><Kpi title="EXPENSES" value="₹8.2L" note="This month"/></div><Card className="tableCard"><Section title="Cash & Billing" action={<button className="primary"><Plus size={14}/> Entry</button>}/><Table headers={["Type","Project","Reference","Amount","Date","Status"]} rows={[["Invoice","Eon Fairfox","RA-02",money(640000),"01 Aug",<Badge>Pending</Badge>],["Invoice","Eon Fairfox","ADV-01",money(960000),"05 Jul",<Badge>Paid</Badge>],["Expense","Sector 18","PUR-44",money(121000),"05 Aug",<Badge>Paid</Badge>] ]}/></Card></>}
function Portal(){return <><Hero title="Client Portal" text="A polished client experience that keeps internal cost, margin and operational controls private." actions={<><button>Generate Client Link</button><button>Preview as Client</button></>}/><div className="threeCols"><Card><h3>Project Progress</h3><p>Milestones, photos and approved programme.</p></Card><Card><h3>Design Selections</h3><p>Moodboards, material cards and one-click approvals.</p></Card><Card><h3>Documents</h3><p>Drawings, quotations, invoices and handover documents.</p></Card></div></>}

function Top({title,sub,action}:{title:string;sub:string;action?:React.ReactNode}){return <div className="topLine"><div><h2>{title}</h2><p>{sub}</p></div>{action}</div>}
function Hero({title,text,actions}:{title:string;text:string;actions?:React.ReactNode}){return <div className="hero"><h2>{title}</h2><p>{text}</p>{actions&&<div className="heroActions">{actions}</div>}<div className="heroMetrics"><div><b>₹1.29Cr</b><small>quoted this quarter</small></div><div><b>38%</b><small>average target margin</small></div><div><b>6</b><small>active proposals</small></div></div></div>}
function List({items}:{items:string[]}){return <div className="list">{items.map(x=><div className="listItem" key={x}><ChevronRight size={14}/><div><b>{x}</b><small>Workflow configured</small></div></div>)}</div>}
function Table({headers,rows}:{headers:string[];rows:(React.ReactNode[])[]}){return <div className="tableWrap"><table><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((c,j)=><td key={j}>{c}</td>)}</tr>)}</tbody></table></div>}

function Modal({type,close,addTask,addIssue}:{type:string;close:()=>void;addTask:(t:Task)=>void;addIssue:(i:Issue)=>void}){
 const [name,setName]=useState(""); const [project,setProject]=useState("Eon Fairfox — Unit 1914"); const [owner,setOwner]=useState("Unassigned");
 const task=type==="tasks"||type==="task"; const issue=type==="issues"||type==="issue";
 return <div className="modalBackdrop" onMouseDown={e=>e.target===e.currentTarget&&close()}><div className="modal"><div className="modalHead"><div><small>SOLUSI OS</small><h2>{task?"Assign Task":issue?"Report Issue":"Create Record"}</h2></div><button onClick={close}><X size={18}/></button></div>
 {task||issue?<><label>{task?"Task":"Issue"}<input value={name} onChange={e=>setName(e.target.value)} placeholder={task?"e.g. Complete ceiling grid":"e.g. Waterproofing snag"}/></label><label>Project<select value={project} onChange={e=>setProject(e.target.value)}><option>Eon Fairfox — Unit 1914</option><option>Sector 18 Corporate Office</option><option>Noida Tech Office</option></select></label><label>Owner<input value={owner} onChange={e=>setOwner(e.target.value)} /></label><button className="primary fullButton" onClick={()=>{if(!name)return;if(task)addTask({name,project,owner,due:"15 Aug",priority:"High",status:"Open"});else addIssue({name,project,owner,severity:"High",status:"Open"})}}>Save</button></>:<div className="modalText">This module is ready for the next production workflow. Connect it to the database and role permissions to make it live.</div>}
 </div></div>
}