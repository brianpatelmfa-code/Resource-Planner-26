import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from './firebaseClient'; 

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@600;700&display=swap');
  
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  
  body {
    background: #000;
    color: #c9d1d9;
    font-family: 'Inter', sans-serif;
    overflow-x: hidden;
  }
  
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #484f58; }
  
  input[type=date]::-webkit-calendar-picker-indicator { filter: invert(1); cursor:pointer; opacity:0.6; }
  select option { background:#161b22; color:#c9d1d9; }
  
  /* --- BACKGROUND & EMBERS --- */
  .ambient-bg { position: fixed; inset: 0; z-index: -1; background: #000; overflow: hidden; }
  .ambient-glow-1 {
    position: absolute; width: 70vw; height: 70vw; border-radius: 50%;
    background: radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 60%);
    top: -20vh; left: -10vw; animation: float 20s infinite alternate ease-in-out;
  }
  .ambient-glow-2 {
    position: absolute; width: 60vw; height: 60vw; border-radius: 50%;
    background: radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 60%);
    bottom: -10vh; right: -10vw; animation: float 25s infinite alternate-reverse ease-in-out;
  }
  .ember {
    position: absolute; background: #f97316; border-radius: 50%;
    box-shadow: 0 0 8px #f97316, 0 0 16px #e11d48; opacity: 0; animation: rise linear infinite;
  }
  @keyframes float {
    0% { transform: translate(0, 0) scale(1); }
    100% { transform: translate(5vw, 5vh) scale(1.1); }
  }
  @keyframes rise {
    0% { bottom: -10px; transform: translateX(0); opacity: 0; }
    10% { opacity: 0.8; }
    90% { opacity: 0.8; }
    100% { bottom: 100vh; transform: translateX(-50px); opacity: 0; }
  }

  /* --- LOGO RINGS & TRAIL --- */
  .logo-container {
    position: relative; display: flex; align-items: center; justify-content: center;
    width: 100px; height: 100px; margin-bottom: 8px; border-radius: 50%; z-index: 5;
    cursor: default;
  }
  .logo-trail {
    position: absolute; top: 50%; right: 50%; transform: translateY(-50%);
    width: 0px; height: 40px; background: linear-gradient(90deg, transparent, rgba(249,115,22,0.8));
    filter: blur(8px); border-radius: 20px; z-index: -1;
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); opacity: 0; pointer-events: none;
  }
  .logo-container:hover .logo-trail { width: 160px; right: 50%; opacity: 1; }
  
  .logo-ring { position: absolute; inset: 0; border-radius: 50%; border: 2px solid transparent; }
  .ring-amber { border-left-color: rgba(249,115,22,0.9); border-top-color: rgba(249,115,22,0.4); animation: spin 8s linear infinite; }
  .ring-blue { inset: 5px; border-right-color: rgba(59,130,246,0.9); border-bottom-color: rgba(59,130,246,0.4); animation: spin 12s linear infinite reverse; }
  @keyframes spin { 100% { transform: rotate(360deg); } }

  /* --- DATA PANELS (Dark areas) --- */
  .sidebar { background: rgba(1, 4, 9, 0.88); backdrop-filter: blur(24px); border-right: 1px solid #30363d; }
  .main-panel { background: rgba(13, 17, 23, 0.88); backdrop-filter: blur(24px); }
  
  .card { background: #161b22; border: 1px solid #30363d; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.6); }
  
  .glow-border { position: relative; }
  .glow-border::before {
    content: ''; position: absolute; top: -1px; left: -1px; right: -1px; bottom: -1px;
    background: linear-gradient(45deg, #f97316, #3b82f6);
    z-index: -1; border-radius: 11px; opacity: 0.4; transition: opacity 0.3s;
  }
  .glow-border:hover::before { opacity: 0.8; }

  .ginput {
    background: #010409; border: 1px solid #30363d; border-radius: 6px;
    color: #c9d1d9; font-family: inherit; outline: none; transition: all .2s;
  }
  .ginput:focus { border-color: #f97316; box-shadow: 0 0 0 1px #f97316; }
  
  .rh { transition: background .2s ease; border-bottom: 1px solid #21262d; }
  .rh:hover { background: #1a1f27 !important; }
  
  .date-cell { transition: background 0.15s ease; cursor: pointer; border-radius: 4px; }
  .date-cell:hover { background: rgba(255,255,255,0.06); }

  .interactive-label { transition: all 0.2s ease; cursor: pointer; }
  .interactive-label:hover { background: rgba(255,255,255,0.05); transform: translateX(2px); }

  .brand-serif { font-family: 'Playfair Display', serif; }

  @keyframes su { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fi { from{opacity:0} to{opacity:1} }
`;

const INITIAL_FUNCTIONS = {
  "Tech lead": ["Stephen", "Ankit"],
  "Design":    ["Prajjwal","Sanjana Babu","Mohammed Hisham","Sneha Gupta"],
  "BE Dev":    ["Jahangir","Nabeel","Nabina Poudel","Sharad Raj"],
  "FE Dev":    ["Aman","Gaurav Rauthan","Jasjot Singh","Manish Moond","Prathmesh","Priyanshu","Riddhi","Rushikesh","Mohammed Arfaz","Vansh"],
  "PM":        ["Caleb","Midhu","Nishala","Roshna"],
  "Pre-sales": ["Ben"],
  "Ops":       ["Brian"],
  "QA":        ["Deon","Sourabh","Vebeesh"],
  "QC":        ["Jenny","Rebecca","Soso"],
};

const DEFAULT_PROJECTS = ["MTF","TL","DR","APEST","NSA","BCW","SC","SLINGSHOT","FREQUENCY","HIMALAYAN HAAT","DELIVA","GLASS"];
const DEFAULT_COLORS = {
  "MTF":"#3b82f6","TL":"#f97316","DR":"#10b981","APEST":"#ef4444",
  "NSA":"#8b5cf6","BCW":"#d946ef","SC":"#ec4899","SLINGSHOT":"#14b8a6",
  "FREQUENCY":"#f59e0b","HIMALAYAN HAAT":"#84cc16","DELIVA":"#06b6d4","GLASS":"#a855f7",
};
const CPOOL = ["#e11d48","#0891b2","#15803d","#b45309","#7c3aed","#be185d","#0369a1","#047857","#92400e","#065f46"];

function dStr(d){return d instanceof Date?d.toISOString().slice(0,10):d;}
function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x;}
function getMon(d){const x=new Date(d);x.setHours(0,0,0,0);const dy=x.getDay();x.setDate(x.getDate()+(dy===0?-6:1-dy));return x;}

function getDaysForWeekly(anchor) {
  const m = getMon(anchor);
  return Array.from({length: 7}, (_, i) => {
    const d = addDays(m, i);
    return { start: d, end: d, label: d.toLocaleDateString("en-GB",{weekday:"short", day:"numeric"}) };
  });
}
function getDaysForMonthly(anchor) {
  const y = anchor.getFullYear();
  const m = anchor.getMonth();
  const lastDay = new Date(y, m + 1, 0).getDate();
  return Array.from({length: lastDay}, (_, i) => {
    const d = new Date(y, m, i + 1);
    return { start: d, end: d, label: d.toLocaleDateString("en-GB",{day:"numeric", month:"short"}) };
  });
}

function active(e, period){return new Date(e.start) <= period.end && new Date(e.end) >= period.start;}
function allocW(entries, period){return (entries||[]).filter(e=>active(e,period)).reduce((s,e)=>s+Number(e.pct),0);}

function buildSeed(){
  const APR1 = dStr(new Date());
  const e=n=>dStr(addDays(new Date(),n*7));
  return {
    "Jahangir":        [{project:"MTF",pct:50,start:APR1,end:e(8)},{project:"NSA",pct:25,start:APR1,end:e(4)},{project:"BCW",pct:25,start:APR1,end:e(10)}],
    "Nabeel":          [{project:"APEST",pct:75,start:APR1,end:e(6)},{project:"TL",pct:25,start:APR1,end:e(4)}],
    "Nabina Poudel":   [{project:"SLINGSHOT",pct:100,start:APR1,end:e(12)}],
    "Sharad Raj":      [{project:"MTF",pct:50,start:APR1,end:e(6)},{project:"GLASS",pct:50,start:APR1,end:e(10)}],
    "Stephen":         [{project:"MTF",pct:25,start:APR1,end:e(12)},{project:"APEST",pct:25,start:APR1,end:e(12)},{project:"NSA",pct:25,start:APR1,end:e(8)},{project:"SC",pct:25,start:APR1,end:e(8)}],
    "Prajjwal":        [{project:"MTF",pct:50,start:APR1,end:e(6)},{project:"DR",pct:50,start:APR1,end:e(8)}],
    "Sanjana Babu":    [{project:"DELIVA",pct:60,start:APR1,end:e(8)},{project:"FREQUENCY",pct:40,start:APR1,end:e(6)}],
    "Mohammed Hisham": [{project:"HIMALAYAN HAAT",pct:75,start:APR1,end:e(8)},{project:"DELIVA",pct:25,start:APR1,end:e(4)}],
    "Sneha Gupta":     [{project:"SC",pct:100,start:APR1,end:e(8)}],
    "Aman":            [{project:"MTF",pct:100,start:APR1,end:e(10)}],
    "Gaurav Rauthan":  [{project:"TL",pct:50,start:APR1,end:e(4)},{project:"BCW",pct:50,start:APR1,end:e(6)}],
    "Jasjot Singh":    [{project:"APEST",pct:50,start:APR1,end:e(8)},{project:"HIMALAYAN HAAT",pct:50,start:APR1,end:e(6)}],
    "Manish Moond":    [{project:"SLINGSHOT",pct:75,start:APR1,end:e(6)},{project:"SC",pct:25,start:APR1,end:e(4)}],
    "Prathmesh":       [{project:"DELIVA",pct:100,start:APR1,end:e(8)}],
    "Priyanshu":       [{project:"NSA",pct:50,start:APR1,end:e(6)},{project:"MTF",pct:50,start:APR1,end:e(4)}],
    "Riddhi":          [{project:"FREQUENCY",pct:100,start:APR1,end:e(8)}],
    "Rushikesh":       [{project:"GLASS",pct:50,start:APR1,end:e(6)},{project:"BCW",pct:50,start:APR1,end:e(8)}],
    "Mohammed Arfaz":  [{project:"SLINGSHOT",pct:50,start:APR1,end:e(6)},{project:"FREQUENCY",pct:50,start:APR1,end:e(6)}],
    "Vansh":           [{project:"TL",pct:100,start:APR1,end:e(10)}],
    "Ankit":           [{project:"APEST",pct:50,start:APR1,end:e(6)},{project:"NSA",pct:50,start:APR1,end:e(6)}],
    "Brian":           [{project:"MTF",pct:25,start:APR1,end:e(8)},{project:"APEST",pct:25,start:APR1,end:e(8)},{project:"BCW",pct:25,start:APR1,end:e(8)},{project:"NSA",pct:25,start:APR1,end:e(8)}],
    "Caleb":           [{project:"MTF",pct:50,start:APR1,end:e(12)},{project:"TL",pct:50,start:APR1,end:e(6)}],
    "Midhu":           [{project:"APEST",pct:50,start:APR1,end:e(8)},{project:"HIMALAYAN HAAT",pct:50,start:APR1,end:e(6)}],
    "Nishala":         [{project:"SLINGSHOT",pct:60,start:APR1,end:e(8)},{project:"SC",pct:40,start:APR1,end:e(6)}],
    "Roshna":          [{project:"DELIVA",pct:75,start:APR1,end:e(8)},{project:"GLASS",pct:25,start:APR1,end:e(8)}],
    "Ben":             [{project:"MTF",pct:25,start:APR1,end:e(6)},{project:"APEST",pct:25,start:APR1,end:e(6)},{project:"NSA",pct:25,start:APR1,end:e(4)}],
    "Deon":            [{project:"MTF",pct:50,start:APR1,end:e(4)},{project:"SLINGSHOT",pct:50,start:APR1,end:e(8)}],
    "Sourabh":         [{project:"TL",pct:25,start:APR1,end:e(4)},{project:"APEST",pct:25,start:APR1,end:e(4)},{project:"FREQUENCY",pct:50,start:APR1,end:e(8)}],
    "Vebeesh":         [{project:"HIMALAYAN HAAT",pct:100,start:APR1,end:e(10)}],
    "Jenny":           [{project:"DELIVA",pct:50,start:APR1,end:e(6)},{project:"GLASS",pct:50,start:APR1,end:e(6)}],
    "Rebecca":         [{project:"BCW",pct:75,start:APR1,end:e(8)},{project:"SC",pct:25,start:APR1,end:e(6)}],
    "Soso":            [{project:"MTF",pct:50,start:APR1,end:e(4)},{project:"NSA",pct:50,start:APR1,end:e(4)}],
  };
}

// ── Embers Component ──
function Embers() {
  const embers = useMemo(() => Array.from({length: 20}).map(() => ({
    left: `${Math.random() * 100}%`,
    size: `${Math.random() * 3 + 2}px`,
    duration: `${Math.random() * 8 + 8}s`,
    delay: `${Math.random() * 5}s`
  })), []);
  return (
    <div className="ambient-bg">
      <div className="ambient-glow-1"/>
      <div className="ambient-glow-2"/>
      {embers.map((e, i) => (
        <div key={i} className="ember" style={{ left: e.left, width: e.size, height: e.size, animationDuration: e.duration, animationDelay: e.delay }}/>
      ))}
    </div>
  );
}

// ── Donut Chart ──
function DonutChart({ data, colors }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  let cumulativePercent = 0;
  if (total === 0) return <div style={{width: 100, height: 100, borderRadius: "50%", border: "6px solid #30363d", display:"flex", alignItems:"center", justifyContent:"center", color:"#8b949e", fontSize:11}}>No Data</div>;

  return (
    <div style={{position: "relative", width: 100, height: 100, flexShrink: 0}}>
      <svg viewBox="0 0 32 32" style={{transform: "rotate(-90deg)", borderRadius: "50%"}}>
        {data.map((slice) => {
          const pct = (slice.value / total) * 100;
          const strokeDasharray = `${pct} 100`;
          const strokeDashoffset = -cumulativePercent;
          cumulativePercent += pct;
          return (
            <circle key={slice.label} r="16" cx="16" cy="16" fill="none"
              stroke={colors[slice.label] || "#3b82f6"} strokeWidth="6"
              strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset}
              style={{transition: "stroke-dasharray 0.5s ease"}}
            />
          );
        })}
      </svg>
      <div style={{position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center"}}>
        <div style={{fontSize: 18, fontWeight: 800, color:"#f0f6fc"}}>{total}</div>
        <div style={{fontSize: 8, color:"#8b949e", textTransform:"uppercase", letterSpacing:"0.05em"}}>Items</div>
      </div>
    </div>
  );
}

// ── Water cell ──
function WaterCell({entries, period}){
  const act=entries.filter(e=>active(e, period));
  const tot=act.reduce((s,e)=>s+Number(e.pct),0);
  const over=tot > 100; 
  const cl=Math.min(tot,100);

  let wc = "transparent";
  if (tot >= 100) wc = "rgba(249, 115, 22, 0.85)"; // Amber
  else if (tot >= 75) wc = "rgba(59, 130, 246, 0.85)"; // Blue
  else if (tot > 0) wc = "rgba(16, 185, 129, 0.7)"; // Emerald

  return(
    <div style={{width: 50, height: 44, borderRadius: 6, overflow:"hidden", position:"relative", background:"#010409", border:`1px solid ${over?"rgba(249,115,22,.5)":"#30363d"}`, pointerEvents:"none"}}>
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:`${cl}%`,background:wc,transition:"height .5s cubic-bezier(.34,1.56,.64,1)"}}/>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2}}>
        <div style={{fontSize:10,fontWeight:700,color:tot>40?"#fff":"#8b949e"}}>{tot===0?"—":`${tot}%`}</div>
      </div>
    </div>
  );
}

// ── MODALS ──
function EditModal({person,fn,entries,defaultStart,onSave,onClose,onDelete,projects,getColor}){
  const [local,setLocal]=useState(entries.map(e=>({...e})));
  
  // Use the specific date cell clicked, otherwise default to today
  const initDate = defaultStart || dStr(new Date());
  const add=()=>setLocal(p=>[...p,{project:projects[0],pct:50,start:initDate,end:dStr(addDays(new Date(initDate),28))}]);
  const rm=i=>setLocal(p=>p.filter((_,j)=>j!==i));
  const upd=(i,f,v)=>setLocal(p=>p.map((e,j)=>j===i?{...e,[f]:f==="pct"?Math.min(100,Math.max(0,Number(v)||0)):v}:e));
  const activeErr = local.some(l => local.filter(e => e.start <= l.start && e.end >= l.start).reduce((s,e)=>s+Number(e.pct),0) > 100);

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,animation:"fi .2s ease"}} onClick={onClose}>
      <div className="card" style={{padding:26,width:490,maxHeight:"88vh",overflowY:"auto",animation:"su .22s ease"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
          <div>
            <div style={{fontSize:17,fontWeight:700,color:"#f0f6fc"}}>{person}</div>
            <div style={{fontSize:11,color:"#8b949e",marginTop:2}}>{fn}</div>
          </div>
          <button onClick={onClose} style={{background:"transparent",border:"1px solid #30363d",borderRadius:"50%",width:28,height:28,cursor:"pointer",color:"#8b949e",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        
        <div style={{display:"flex",flexDirection:"column",gap:9,marginBottom:12}}>
          {local.map((entry,i)=>(
            <div key={i} style={{background:"#010409", border:"1px solid #30363d", borderRadius:8,padding:13}}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:9}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:getColor(entry.project),flexShrink:0}}/>
                <select value={entry.project} onChange={e=>upd(i,"project",e.target.value)} className="ginput" style={{flex:1,padding:"6px 9px",fontSize:13}}>
                  {projects.map(p=><option key={p} value={p}>{p}</option>)}
                </select>
                <input type="number" min="0" max="100" step="5" value={entry.pct} onChange={e=>upd(i,"pct",e.target.value)} className="ginput" style={{width:60,padding:"6px 8px",fontSize:13,textAlign:"right"}}/>
                <span style={{fontSize:11,color:"#8b949e"}}>%</span>
                <button onClick={()=>rm(i)} style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",borderRadius:7,color:"#ef4444",cursor:"pointer",width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>×</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
                {["start","end"].map(f=>(
                  <div key={f}>
                    <div style={{fontSize:9,color:"#8b949e",marginBottom:3,textTransform:"uppercase",letterSpacing:".06em"}}>{f} date</div>
                    <input type="date" value={entry[f]} onChange={e=>upd(i,f,e.target.value)} className="ginput" style={{width:"100%",padding:"6px 8px",fontSize:12}}/>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button onClick={add} style={{width:"100%",background:"transparent",border:"1.5px dashed #30363d",borderRadius:8,padding:"8px",color:"#3b82f6",cursor:"pointer",fontSize:13,marginBottom:12,fontFamily:"inherit"}}>+ Add assignment for {initDate}</button>
        {activeErr&&<div style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",borderRadius:6,padding:"9px 13px",fontSize:12,color:"#ff7b72",marginBottom:11}}>⚠ Simultaneous allocations exceed 100%.</div>}
        
        <div style={{display:"flex",gap:9,justifyContent:"space-between", alignItems:"center"}}>
          <button onClick={()=>{ if(window.confirm(`Are you sure you want to delete ${person} from the team?`)) onDelete(person, fn); }} style={{background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.3)", borderRadius:6,padding:"8px 16px",color:"#ff7b72",cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>Delete Person</button>
          
          <div style={{display:"flex",gap:9}}>
            <button onClick={onClose} style={{background:"transparent", border:"1px solid #30363d", borderRadius:6,padding:"8px 16px",color:"#8b949e",cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>Cancel</button>
            <button onClick={()=>{if(!activeErr)onSave(local);}} disabled={activeErr} style={{background:activeErr?"#30363d":"#3b82f6",border:"none",borderRadius:6,padding:"8px 20px",color:activeErr?"#8b949e":"#fff",cursor:activeErr?"not-allowed":"pointer",fontSize:13,fontWeight:600}}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddProjectModal({onAdd,onClose,existing}){
  const [name,setName]=useState(""); const [color,setColor]=useState(CPOOL[0]);
  const t=name.trim().toUpperCase(); const ex=existing.includes(t);
  const allColors=[...Object.values(DEFAULT_COLORS).slice(0,8),...CPOOL.slice(0,6)];
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,animation:"fi .2s ease"}} onClick={onClose}>
      <div className="card" style={{padding:26,width:340,animation:"su .22s ease"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:16,fontWeight:700,color:"#f0f6fc",marginBottom:4}}>New Project</div>
        <div style={{fontSize:12,color:"#8b949e",marginBottom:18}}>Short code, e.g. ORBIT, NOVA, PULSE</div>
        <input value={name} onChange={e=>setName(e.target.value.toUpperCase())} placeholder="PROJECT CODE" className="ginput" style={{width:"100%",padding:"10px 13px",fontSize:14,marginBottom:7,letterSpacing:".06em"}}/>
        {ex&&<div style={{fontSize:11,color:"#ff7b72",marginBottom:8}}>Already exists.</div>}
        <div style={{fontSize:9,color:"#8b949e",marginBottom:7,textTransform:"uppercase",letterSpacing:".05em"}}>Colour</div>
        <div style={{display:"flex",gap:7,marginBottom:20,flexWrap:"wrap"}}>
          {allColors.map(c=><div key={c} onClick={()=>setColor(c)} style={{width:22,height:22,borderRadius:"50%",background:c,cursor:"pointer",border:`2px solid ${color===c?"#c9d1d9":"transparent"}`,boxShadow:color===c?"0 0 0 2px rgba(0,0,0,1)":"none",transform:color===c?"scale(1.18)":"scale(1)",transition:"transform .12s"}}/>)}
        </div>
        <div style={{display:"flex",gap:9,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{background:"transparent",border:"1px solid #30363d",borderRadius:6,padding:"8px 15px",color:"#8b949e",cursor:"pointer",fontSize:13}}>Cancel</button>
          <button onClick={()=>{if(t&&!ex){onAdd(t,color);onClose();}}} disabled={!t||ex} style={{background:!t||ex?"#30363d":"#3b82f6",border:"none",borderRadius:6,padding:"8px 18px",color:!t||ex?"#8b949e":"#fff",cursor:!t||ex?"not-allowed":"pointer",fontSize:13,fontWeight:600}}>Add</button>
        </div>
      </div>
    </div>
  );
}

function AddMemberModal({onAdd, onClose, teams}){
  const [name, setName] = useState("");
  const [team, setTeam] = useState(teams[0]);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,animation:"fi .2s ease"}} onClick={onClose}>
      <div className="card" style={{padding:26,width:340,animation:"su .22s ease"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:16,fontWeight:700,color:"#f0f6fc",marginBottom:18}}>Add New Member</div>
        <div style={{fontSize:9,color:"#8b949e",marginBottom:7,textTransform:"uppercase"}}>Full Name</div>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Jane Doe" className="ginput" style={{width:"100%",padding:"10px 13px",fontSize:14,marginBottom:15}}/>
        <div style={{fontSize:9,color:"#8b949e",marginBottom:7,textTransform:"uppercase"}}>Assign to Team</div>
        <select value={team} onChange={e=>setTeam(e.target.value)} className="ginput" style={{width:"100%",padding:"10px 13px",fontSize:14,marginBottom:20}}>
          {teams.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <div style={{display:"flex",gap:9,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{background:"transparent",border:"1px solid #30363d",borderRadius:6,padding:"8px 15px",color:"#8b949e",cursor:"pointer",fontSize:13}}>Cancel</button>
          <button onClick={()=>{if(name.trim()){onAdd(name.trim(), team); onClose();}}} disabled={!name.trim()} style={{background:!name.trim()?"#30363d":"#3b82f6",border:"none",borderRadius:6,padding:"8px 18px",color:!name.trim()?"#8b949e":"#fff",cursor:!name.trim()?"not-allowed":"pointer",fontSize:13,fontWeight:600}}>Add Member</button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN DASHBOARD ──
export default function Dashboard(){
  const [projects, setProjects] = useState([]);
  const [allocations, setAllocations] = useState({});
  const [pColors, setPColors] = useState({});
  const [functions, setFunctions] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const docRef = doc(db, "planner", "state");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProjects(data.projects?.length > 0 ? data.projects : DEFAULT_PROJECTS);
          setAllocations(Object.keys(data.allocations || {}).length > 0 ? data.allocations : buildSeed());
          setPColors(Object.keys(data.p_colors || {}).length > 0 ? data.p_colors : DEFAULT_COLORS);
          setFunctions(Object.keys(data.functions || {}).length > 0 ? data.functions : INITIAL_FUNCTIONS);
        } else {
          const initialData = { projects: DEFAULT_PROJECTS, allocations: buildSeed(), p_colors: DEFAULT_COLORS, functions: INITIAL_FUNCTIONS };
          await setDoc(docRef, initialData);
          setProjects(initialData.projects); setAllocations(initialData.allocations);
          setPColors(initialData.p_colors); setFunctions(initialData.functions);
        }
      } catch (error) { console.error("Error loading data:", error); }
      setLoading(false);
    }
    loadData();
  }, []);

  async function syncToDatabase(newProjects, newAllocations, newColors, newFunctions) {
    try {
      await setDoc(doc(db, "planner", "state"), {
        projects: newProjects, allocations: newAllocations, p_colors: newColors, functions: newFunctions
      }, { merge: true });
    } catch (error) { console.error("Error syncing to DB:", error); }
  }

  const [timeView, setTimeView] = useState("weekly"); 
  const [offset, setOffset] = useState(0); 
  const [search,setSearch]=useState("");
  const [filterProj,setFilterProj]=useState(null);
  const [editing,setEditing]=useState(null);
  const [addingProj,setAddingProj]=useState(false);
  const [addingMember, setAddingMember] = useState(false);
  
  const anchor=useMemo(()=>{
    if(timeView === "weekly") return addDays(new Date(), offset*7);
    const d = new Date(); d.setMonth(d.getMonth() + offset); return d;
  },[offset, timeView]);

  const periods=useMemo(()=>timeView === "weekly" ? getDaysForWeekly(anchor) : getDaysForMonthly(anchor), [anchor, timeView]);
  const allPeople=useMemo(()=>Object.entries(functions).flatMap(([fn,pp])=>pp.map(n=>({name:n,fn}))), [functions]);
  const getColor=useCallback(p=>pColors[p]||DEFAULT_COLORS[p]||CPOOL[projects.indexOf(p)%CPOOL.length],[pColors,projects]);

  const dialLabel = useMemo(() => {
    if(timeView === "weekly") {
      const s = periods[0].start; const e = periods[periods.length-1].start;
      return `${s.toLocaleDateString("en-GB",{day:"numeric", month:"short"})} - ${e.toLocaleDateString("en-GB",{day:"numeric", month:"short", year:"numeric"})}`;
    }
    return anchor.toLocaleDateString("en-GB",{month:"long", year:"numeric"});
  }, [periods, timeView, anchor]);

  const filteredPeople = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allPeople.filter(p => {
      const nameMatch = p.name.toLowerCase().includes(q);
      const matchProj = !filterProj || (allocations[p.name] || []).some(e => e.project === filterProj);
      return (!q || nameMatch) && matchProj;
    });
  }, [search, filterProj, allocations, allPeople]);

  const teamViewData = useMemo(() => {
    return Object.entries(functions).map(([fn]) => {
      return { fn, people: filteredPeople.filter(p => p.fn === fn).map(p => p.name) };
    }).filter(t => t.people.length > 0);
  }, [functions, filteredPeople]);

  // WIDGET DATA: Project distribution
  const chartData = useMemo(() => {
    const projCounts = {};
    Object.values(allocations).flat().forEach(entry => {
      projCounts[entry.project] = (projCounts[entry.project] || 0) + 1;
    });
    return Object.entries(projCounts).map(([label, value]) => ({label, value})).sort((a,b)=>b.value-a.value);
  }, [allocations]);

  // WIDGET DATA: Team Workload (Average max allocation per function)
  const teamWorkloadList = useMemo(() => {
    return Object.entries(functions).map(([teamName, members]) => {
      if (!members.length) return { name: teamName, load: 0 };
      let totalLoad = 0;
      members.forEach(pName => {
        const entries = allocations[pName] || [];
        totalLoad += Math.max(...periods.map(d => allocW(entries, d)), 0);
      });
      return { name: teamName, load: Math.round(totalLoad / members.length) };
    }).sort((a,b) => b.load - a.load).filter(t => t.load > 0).slice(0, 6);
  }, [functions, allocations, periods]);

  // WIDGET DATA: Member Workload (Top 6 individuals)
  const memberWorkloadList = useMemo(() => {
    return allPeople.map(p => {
      const entries = allocations[p.name] || [];
      const maxAlloc = Math.max(...periods.map(d => allocW(entries, d)), 0);
      return { name: p.name, load: maxAlloc };
    }).sort((a,b) => b.load - a.load).slice(0, 6);
  }, [allPeople, allocations, periods]);

  function saveAlloc(name, entries){
    const newAlloc = {...allocations, [name]: entries};
    setAllocations(newAlloc); syncToDatabase(projects, newAlloc, pColors, functions); setEditing(null);
  }

  function addProject(name, color){
    const newProj = [...projects, name];
    const newColors = {...pColors, [name]: color};
    setProjects(newProj); setPColors(newColors); syncToDatabase(newProj, allocations, newColors, functions);
  }

  function addMember(name, team){
    const newFuncs = {...functions, [team]: [...(functions[team] || []), name]};
    setFunctions(newFuncs); syncToDatabase(projects, allocations, pColors, newFuncs);
  }

  function deleteMember(targetMember, targetTeam) {
    const newFunctions = { ...functions };
    if (newFunctions[targetTeam]) newFunctions[targetTeam] = newFunctions[targetTeam].filter(n => n !== targetMember);
    const newAllocations = { ...allocations }; delete newAllocations[targetMember];
    setFunctions(newFunctions); setAllocations(newAllocations);
    syncToDatabase(projects, newAllocations, pColors, newFunctions); setEditing(null); 
  }

  function deleteTeam(targetTeam) {
    if(!window.confirm(`Are you sure you want to delete the "${targetTeam}" team?`)) return;
    const newFunctions = { ...functions };
    const membersToRemove = newFunctions[targetTeam] || []; delete newFunctions[targetTeam];
    const newAllocations = { ...allocations };
    membersToRemove.forEach(member => delete newAllocations[member]);
    setFunctions(newFunctions); setAllocations(newAllocations);
    syncToDatabase(projects, newAllocations, pColors, newFunctions);
  }

  if (loading) return <div style={{height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0d1117", color:"#f97316"}}>Booting Systems...</div>;

  return(
    <div style={{display:"flex", minHeight:"100vh", position:"relative"}}>
      <style>{STYLE}</style>
      <Embers />

      {/* --- LEFT SIDEBAR (PROJECTS) --- */}
      <div className="sidebar" style={{width: 260, display:"flex", flexDirection:"column", zIndex:10}}>
        
        {/* SMALLER LOGO & TRAIL */}
        <div style={{padding: "36px 20px 30px", borderBottom: "1px solid #30363d", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center"}}>
          <div className="logo-container">
             <div className="logo-trail" />
             <div className="logo-ring ring-amber" />
             <div className="logo-ring ring-blue" />
             <div style={{textAlign:"center", zIndex:2}}>
               <div style={{fontFamily:"'Inter', sans-serif", fontWeight:800, fontSize:15, color:"#fff", letterSpacing:1}}>STUDIO<span style={{color:"#8b949e", fontWeight:300}}>137</span></div>
             </div>
          </div>
          <div style={{fontSize:8, color:"#f97316", textTransform:"uppercase", letterSpacing:2, fontWeight:700, textAlign:"center"}}>Digital Media Solutions</div>
        </div>
        
        <div style={{padding: "20px", flex: 1, overflowY: "auto"}}>
          <div style={{fontSize: 12, fontWeight: 600, color: "#8b949e", marginBottom: 12, textTransform: "uppercase"}}>Active Projects</div>
          <div style={{display:"flex", flexDirection:"column", gap: 6}}>
            <button onClick={()=>setFilterProj(null)} style={{textAlign:"left", background: !filterProj ? "#21262d" : "transparent", border:"none", padding:"8px 12px", borderRadius: 6, color: !filterProj ? "#fff" : "#8b949e", cursor:"pointer", fontSize: 13, fontWeight: !filterProj ? 600 : 400, transition:"all 0.2s"}}>
              All Projects
            </button>
            {projects.map(proj => (
              <button key={proj} onClick={()=>setFilterProj(filterProj===proj ? null : proj)} style={{
                textAlign:"left", display:"flex", alignItems:"center", gap: 8,
                background: filterProj===proj ? "#21262d" : "transparent", border:"none", padding:"8px 12px", borderRadius: 6,
                color: filterProj===proj ? "#fff" : "#c9d1d9", cursor:"pointer", fontSize: 13, transition:"all 0.2s"
              }}>
                <span style={{width: 8, height: 8, borderRadius: "50%", background: getColor(proj), boxShadow: filterProj===proj ? `0 0 8px ${getColor(proj)}` : 'none'}}/>
                {proj}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- MAIN DASHBOARD AREA --- */}
      <div className="main-panel" style={{flex: 1, display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden", zIndex:10}}>
        
        {/* Top Header */}
        <div style={{padding: "20px 30px", borderBottom: "1px solid #30363d", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search resources..." className="ginput" style={{padding: "10px 16px", fontSize: 14, width: 280, background:"rgba(1,4,9,0.5)"}}/>
          <div style={{display:"flex", gap: 12}}>
             <button onClick={()=>setAddingMember(true)} className="card" style={{padding:"8px 16px", color:"#f0f6fc", cursor:"pointer", fontSize:13, fontWeight:600}}>+ Add Member</button>
             <button onClick={()=>setAddingProj(true)} className="card glow-border" style={{padding:"8px 16px", color:"#f0f6fc", cursor:"pointer", fontSize:13, fontWeight:600, border:"none"}}>+ Add Project</button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div style={{padding: "24px 30px", overflowY:"auto", flex: 1}}>
          
          {/* 3-COLUMN WIDGET ROW */}
          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 24}}>
            
            {/* 1. Status Overview */}
            <div className="card" style={{padding: 24, display:"flex", flexDirection:"column", height: 210}}>
              <div style={{fontSize: 14, fontWeight: 600, color: "#f0f6fc", marginBottom: 16}}>Status overview</div>
              <div style={{display:"flex", alignItems:"center", gap: 20, flex: 1}}>
                <DonutChart data={chartData} colors={pColors} />
                <div style={{display:"grid", gridTemplateColumns:"1fr", gap: "8px", flex: 1, maxHeight: 120, overflowY:"auto"}} className="hide-scroll">
                  {chartData.map(d => (
                    <div key={d.label} onClick={() => setFilterProj(filterProj === d.label ? null : d.label)} className="interactive-label" style={{
                       display:"flex", alignItems:"center", justifyContent:"space-between", fontSize:11, padding:"6px 10px", borderRadius:6,
                       background: filterProj === d.label ? `${getColor(d.label)}22` : "transparent",
                       border: filterProj === d.label ? `1px solid ${getColor(d.label)}` : "1px solid transparent"
                     }}>
                      <div style={{display:"flex", alignItems:"center", gap: 8}}>
                        <span style={{width:8, height:8, borderRadius:"2px", background: getColor(d.label), boxShadow: filterProj === d.label ? `0 0 8px ${getColor(d.label)}` : "none"}}/>
                        <span style={{color: filterProj === d.label ? "#fff" : "#c9d1d9", fontWeight: filterProj === d.label ? 600 : 400}}>{d.label}</span>
                      </div>
                      <span style={{color:"#8b949e", fontWeight:600}}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Team Workload */}
            <div className="card" style={{padding: 24, display:"flex", flexDirection:"column", height: 210}}>
               <div style={{fontSize: 14, fontWeight: 600, color: "#f0f6fc", marginBottom: 16}}>Team workload</div>
               <div style={{display:"flex", flexDirection:"column", gap: 14, flex:1, overflowY:"auto"}} className="hide-scroll">
                  {teamWorkloadList.map(tw => (
                     <div key={tw.name} style={{display:"flex", alignItems:"center", gap: 14}}>
                        <div style={{width: 26, height: 26, borderRadius:"4px", background:"#21262d", color:"#3b82f6", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, flexShrink:0}}>
                           {tw.name.substring(0,2).toUpperCase()}
                        </div>
                        <div style={{flex: 1}}>
                           <div style={{display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:5}}>
                              <span style={{color:"#c9d1d9"}}>{tw.name}</span>
                              <span style={{color: tw.load>100 ? "#ff7b72" : "#8b949e", fontWeight:600}}>{tw.load}%</span>
                           </div>
                           <div style={{height: 6, background:"#010409", borderRadius:3, overflow:"hidden", border:"1px solid #30363d"}}>
                              <div style={{height:"100%", width:`${Math.min(tw.load, 100)}%`, background: tw.load > 100 ? "#e11d48" : tw.load >= 75 ? "#f97316" : "#3b82f6", borderRadius:3}} />
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
            
            {/* 3. Member Workload */}
            <div className="card" style={{padding: 24, display:"flex", flexDirection:"column", height: 210}}>
               <div style={{fontSize: 14, fontWeight: 600, color: "#f0f6fc", marginBottom: 16}}>Member workload</div>
               <div style={{display:"flex", flexDirection:"column", gap: 14, flex:1, overflowY:"auto"}} className="hide-scroll">
                  {memberWorkloadList.map(mw => (
                     <div key={mw.name} style={{display:"flex", alignItems:"center", gap: 14}}>
                        <div style={{width: 26, height: 26, borderRadius:"50%", background:"#21262d", color:"#f97316", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, flexShrink:0}}>
                           {mw.name.split(" ").map(w=>w[0]).slice(0,2).join("")}
                        </div>
                        <div style={{flex: 1}}>
                           <div style={{display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:5}}>
                              <span style={{color:"#c9d1d9"}}>{mw.name}</span>
                              <span style={{color: mw.load>100 ? "#ff7b72" : "#8b949e", fontWeight:600}}>{mw.load}%</span>
                           </div>
                           <div style={{height: 6, background:"#010409", borderRadius:3, overflow:"hidden", border:"1px solid #30363d"}}>
                              <div style={{height:"100%", width:`${Math.min(mw.load, 100)}%`, background: mw.load > 100 ? "#e11d48" : mw.load >= 75 ? "#f97316" : "#3b82f6", borderRadius:3}} />
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>

          </div>

          {/* TIMELINE CONTROLS */}
          <div className="card" style={{padding: "16px 20px", marginBottom: 16, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div style={{display:"flex", alignItems:"center", gap: 16}}>
              <button onClick={()=>setOffset(w=>w-1)} style={{background:"#21262d", border:"1px solid #30363d", color:"#f0f6fc", width:32, height:32, borderRadius:6, cursor:"pointer", transition:"all 0.2s"}}>‹</button>
              <div style={{fontSize: 15, fontWeight: 600, color:"#f97316", width: 200, textAlign:"center"}}>{dialLabel}</div>
              <button onClick={()=>setOffset(w=>w+1)} style={{background:"#21262d", border:"1px solid #30363d", color:"#f0f6fc", width:32, height:32, borderRadius:6, cursor:"pointer", transition:"all 0.2s"}}>›</button>
              {offset !== 0 && <button onClick={()=>setOffset(0)} style={{background:"transparent", border:"none", color:"#3b82f6", fontSize:12, cursor:"pointer", textDecoration:"underline"}}>Today</button>}
            </div>
            
            <div style={{display:"flex", background:"#010409", border:"1px solid #30363d", borderRadius: 8, padding: 4}}>
              <button onClick={()=>{setTimeView("weekly"); setOffset(0);}} style={{background: timeView==="weekly"?"#21262d":"transparent", color: timeView==="weekly"?"#f0f6fc":"#8b949e", border:"none", borderRadius:6, padding:"6px 16px", fontSize:12, fontWeight:600, cursor:"pointer", transition:"all 0.2s"}}>Weekly</button>
              <button onClick={()=>{setTimeView("monthly"); setOffset(0);}} style={{background: timeView==="monthly"?"#21262d":"transparent", color: timeView==="monthly"?"#f0f6fc":"#8b949e", border:"none", borderRadius:6, padding:"6px 16px", fontSize:12, fontWeight:600, cursor:"pointer", transition:"all 0.2s"}}>Monthly</button>
            </div>
          </div>

          {/* TIMELINE GRID */}
          <div className="card" style={{overflow: "hidden"}}>
            <div style={{display:"flex", background:"rgba(33, 38, 45, 0.5)", borderBottom:"1px solid #30363d", padding:"12px 0"}}>
              <div style={{width: 240, paddingLeft: 20, fontSize: 11, fontWeight:600, color:"#8b949e", textTransform:"uppercase", flexShrink: 0}}>Resource</div>
              <div style={{display:"flex", overflowX:"auto", flex: 1}} className="hide-scroll">
                 {periods.map((d, i) => (
                   <div key={i} style={{width: 58, flexShrink: 0, textAlign:"center", fontSize: 11, color:"#c9d1d9"}}>{d.label}</div>
                 ))}
              </div>
            </div>
            
            <div style={{display:"flex", flexDirection:"column"}}>
              {teamViewData.map(({fn,people}) => (
                <div key={fn}>
                  <div style={{padding:"10px 20px", background:"rgba(26, 31, 39, 0.5)", borderBottom:"1px solid #30363d", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                    <div>
                      <span style={{fontSize:12, fontWeight:700, color:"#3b82f6", textTransform:"uppercase"}}>{fn}</span>
                      <span style={{background:"#010409", padding:"2px 8px", borderRadius:12, marginLeft:8, fontSize:10, color:"#8b949e"}}>{people.length}</span>
                    </div>
                    <button onClick={(e)=>{ e.stopPropagation(); deleteTeam(fn); }} style={{background:"transparent", border:"none", color:"#8b949e", cursor:"pointer", fontSize:12}}>🗑️</button>
                  </div>
                  {people.map(name => {
                    const entries = allocations[name]||[];
                    return (
                      <div key={name} className="rh" style={{display:"flex", alignItems:"center"}}>
                        
                        <div onClick={()=>setEditing({name,fn})} style={{width: 240, padding:"12px 20px", display:"flex", alignItems:"center", gap: 12, flexShrink: 0, cursor:"pointer"}}>
                          <div style={{width:28, height:28, borderRadius:"50%", background:"#21262d", border:"1px solid #30363d", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:"#f97316"}}>
                            {name.split(" ").map(w=>w[0]).slice(0,2).join("")}
                          </div>
                          <div style={{fontSize:13, fontWeight:500, color:"#f0f6fc"}}>{name}</div>
                        </div>
                        
                        <div style={{display:"flex", overflowX:"auto", flex: 1, padding:"8px 0"}} className="hide-scroll">
                          {periods.map((d, i) => (
                            <div key={i} onClick={()=>setEditing({name, fn, defaultStart: dStr(d.start)})} className="date-cell" style={{width: 58, flexShrink: 0, display:"flex", justifyContent:"center"}}>
                              <WaterCell entries={entries} period={d} />
                            </div>
                          ))}
                        </div>
                        
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </div>

      {editing&&<EditModal person={editing.name} fn={editing.fn} defaultStart={editing.defaultStart} entries={allocations[editing.name]||[]} onDelete={(p, f) => deleteMember(p, f)} onSave={e=>saveAlloc(editing.name,e)} onClose={()=>setEditing(null)} projects={projects} getColor={getColor}/>}
      {addingProj&&<AddProjectModal onAdd={addProject} onClose={()=>setAddingProj(false)} existing={projects}/>}
      {addingMember && <AddMemberModal onAdd={addMember} onClose={()=>setAddingMember(false)} teams={Object.keys(functions)} />}
    </div>
  );
}