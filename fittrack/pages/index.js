import { useState, useCallback, useEffect } from "react";
import Head from "next/head";

// ── helpers ───────────────────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, "0");
const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const TODAY = new Date();
const todayKey = dateKey(TODAY);
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
function getDaysInMonth(y,m){return new Date(y,m+1,0).getDate();}

function useLS(key, init) {
  const [v, setV] = useState(init);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem(key);
      if (s) setV(JSON.parse(s));
    } catch {}
    setLoaded(true);
  }, [key]);

  const set = useCallback((val) => {
    setV(prev => {
      const n = typeof val==="function" ? val(prev) : val;
      try { localStorage.setItem(key, JSON.stringify(n)); } catch {}
      return n;
    });
  }, [key]);

  return [v, set, loaded];
}

// ── BMI ───────────────────────────────────────────────────────────────────────
function bmi(weight,height){
  if(!weight||!height) return null;
  const h=height/100;
  return (weight/(h*h)).toFixed(1);
}
function bmiLabel(b){
  if(!b) return "";
  const n=parseFloat(b);
  if(n<18.5) return "Underweight";
  if(n<25)   return "Healthy";
  if(n<30)   return "Overweight";
  return "Obese";
}
function bmiColor(b){
  if(!b) return "#8b8fa8";
  const n=parseFloat(b);
  if(n<18.5) return "#60b4ff";
  if(n<25)   return "#22d97a";
  if(n<30)   return "#ffb340";
  return "#ff5c5c";
}

// ── Wolf Logo SVG (transparent bg) ───────────────────────────────────────────
function WolfLogo({ size = 36 }) {
  return (
    <img
      src="/logo.png"
      alt="FitTrack"
      width={size}
      height={size}
      style={{ objectFit: "contain", display: "block" }}
    />
  );
}

// ── Calorie ring ──────────────────────────────────────────────────────────────
function CalorieRing({ consumed, goal, dark, size=160, mode="lose" }) {
  const R = size/2 - 10, SW = 9;
  const circ = 2*Math.PI*R;
  const pct = Math.min(consumed/Math.max(goal,1),1);
  const isLose = mode==="lose";
  const met = goal>0 && (isLose ? consumed>0 && consumed<=goal : consumed>=goal);
  const over = isLose && consumed>goal;
  const ringColor = over ? "#ff5c5c" : met ? "#22d97a" : "#7c6ef7";
  const mainNumber = isLose ? Math.max(0, goal - consumed) : consumed;
  const topLabel = isLose ? "Remaining" : "Consumed";
  const statusLabel = over
    ? `${(consumed-goal).toLocaleString()} kcal over`
    : met ? (isLose ? "✓ Under budget" : "✓ Goal reached") : null;

  return (
    <div style={{position:"relative",width:size,height:size,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)",position:"absolute",top:0,left:0}}>
        <circle cx={size/2} cy={size/2} r={R} fill="none" stroke={dark?"#1e2233":"#e8eaf0"} strokeWidth={SW}/>
        <circle cx={size/2} cy={size/2} r={R} fill="none"
          stroke={ringColor} strokeWidth={SW} strokeLinecap="round"
          strokeDasharray={`${circ*pct} ${circ}`}
          style={{transition:"stroke-dasharray 0.7s cubic-bezier(.4,0,.2,1)",opacity:pct===0?0.2:1}}/>
      </svg>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",zIndex:1}}>
        <span style={{fontSize:10,color:dark?"#8b8fa8":"#9ca3b0",letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:600}}>{topLabel}</span>
        <span style={{fontSize:size>=160?32:26,fontWeight:800,color:over?"#ff5c5c":dark?"#f0f2ff":"#1a1d2e",lineHeight:1.1,fontVariantNumeric:"tabular-nums"}}>{mainNumber.toLocaleString()}</span>
        <span style={{fontSize:11,color:dark?"#8b8fa8":"#9ca3b0",fontVariantNumeric:"tabular-nums"}}>/ {Number(goal).toLocaleString()} kcal</span>
        {statusLabel && <span style={{fontSize:9,color:over?"#ff5c5c":"#22d97a",marginTop:2,fontWeight:700,letterSpacing:"0.1em"}}>{statusLabel}</span>}
      </div>
    </div>
  );
}

// ── Week strip ────────────────────────────────────────────────────────────────
function WeekStrip({selectedKey,onSelect,dayData,goal,dark,T,mode}) {
  const base=new Date(TODAY); base.setDate(TODAY.getDate()-TODAY.getDay());
  const isLose=mode==="lose";
  const days=Array.from({length:7},(_,i)=>{
    const d=new Date(base); d.setDate(base.getDate()+i);
    const k=dateKey(d);
    const c=(dayData[k]?.meals||[]).reduce((s,m)=>s+(Number(m.calories)||0),0);
    const met=isLose?(c>0&&c<=goal):(goal>0&&c>=goal);
    return {d,k,day:DAY_NAMES[d.getDay()],num:d.getDate(),met,isToday:k===todayKey,isSel:k===selectedKey};
  });
  return (
    <div style={{display:"flex",justifyContent:"space-between",gap:4}}>
      {days.map(({d,k,day,num,met,isToday,isSel})=>(
        <button key={k} onClick={()=>onSelect(k,d)} style={{
          flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,
          padding:"10px 4px",borderRadius:14,border:"none",cursor:"pointer",transition:"all 0.2s",
          background:isSel?T.accent:isToday?(dark?"#1e2233":"#f0eeff"):"transparent",
          boxShadow:isSel?"0 4px 12px rgba(124,110,247,0.4)":"none",
        }}>
          <span style={{fontSize:9,fontWeight:700,letterSpacing:"0.06em",color:isSel?"#fff":dark?"#8b8fa8":"#9ca3b0"}}>{day}</span>
          <span style={{fontSize:15,fontWeight:800,color:isSel?"#fff":dark?"#f0f2ff":"#1a1d2e",fontVariantNumeric:"tabular-nums"}}>{num}</span>
          <span style={{width:5,height:5,borderRadius:"50%",background:met?"#22d97a":(dark?"#2a2d3e":"#dde0ea"),transition:"background 0.3s"}}/>
        </button>
      ))}
    </div>
  );
}

// ── Month calendar ────────────────────────────────────────────────────────────
function MonthCal({selectedKey,onSelect,dayData,goal,dark,month,year,onPrev,onNext,T,mode}) {
  const isLose=mode==="lose";
  const first=new Date(year,month,1).getDay();
  const dim=getDaysInMonth(year,month);
  const cells=[];
  for(let i=0;i<first;i++) cells.push(null);
  for(let d=1;d<=dim;d++){
    const date=new Date(year,month,d);
    const k=dateKey(date);
    const c=(dayData[k]?.meals||[]).reduce((s,m)=>s+(Number(m.calories)||0),0);
    const met=isLose?(c>0&&c<=goal):(goal>0&&c>=goal);
    cells.push({d,k,met,isToday:k===todayKey,isSel:k===selectedKey});
  }
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <button onClick={onPrev} style={{background:"none",border:"none",cursor:"pointer",color:dark?"#8b8fa8":"#9ca3b0",padding:"6px 10px",fontSize:18}}>‹</button>
        <span style={{fontWeight:700,fontSize:15,color:dark?"#f0f2ff":"#1a1d2e"}}>{MONTH_NAMES[month]} {year}</span>
        <button onClick={onNext} style={{background:"none",border:"none",cursor:"pointer",color:dark?"#8b8fa8":"#9ca3b0",padding:"6px 10px",fontSize:18}}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:6}}>
        {DAY_NAMES.map(d=><div key={d} style={{textAlign:"center",fontSize:10,color:dark?"#8b8fa8":"#9ca3b0",fontWeight:700,padding:"2px 0"}}>{d[0]}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
        {cells.map((c,i)=>!c?<div key={`e${i}`}/>:(
          <button key={c.k} onClick={()=>onSelect(c.k,new Date(year,month,c.d))} style={{
            aspectRatio:"1",borderRadius:10,border:"none",cursor:"pointer",
            fontSize:13,fontWeight:700,position:"relative",transition:"all 0.15s",
            background:c.isSel?T.accent:c.isToday?(dark?"#1e2233":"#f0eeff"):"transparent",
            color:c.isSel?"#fff":c.isToday?T.accent:(dark?"#f0f2ff":"#1a1d2e"),
            boxShadow:c.isSel?"0 2px 8px rgba(124,110,247,0.4)":"none",
          }}>
            {c.d}
            {c.met && <span style={{position:"absolute",bottom:3,left:"50%",transform:"translateX(-50%)",width:4,height:4,borderRadius:"50%",background:c.isSel?"rgba(255,255,255,0.8)":"#22d97a"}}/>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
function FInput({label,value,onChange,type="text",placeholder,suffix,dark,T}){
  return (
    <div style={{marginBottom:14}}>
      {label && <label style={{display:"block",fontSize:11,fontWeight:700,color:dark?"#8b8fa8":"#9ca3b0",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>{label}</label>}
      <div style={{position:"relative"}}>
        <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
          style={{width:"100%",background:dark?"#0e1020":"#f5f6fa",border:`1.5px solid ${dark?"#1e2233":"#e2e4f0"}`,
          borderRadius:12,color:dark?"#f0f2ff":"#1a1d2e",fontSize:15,padding:suffix?"12px 44px 12px 14px":"12px 14px",
          outline:"none",boxSizing:"border-box",fontWeight:500,transition:"border 0.2s",
          fontVariantNumeric:type==="number"?"tabular-nums":"normal"}}
          onFocus={e=>e.target.style.borderColor=T.accent}
          onBlur={e=>e.target.style.borderColor=dark?"#1e2233":"#e2e4f0"}
        />
        {suffix && <span style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",fontSize:12,color:dark?"#8b8fa8":"#9ca3b0",fontWeight:600,pointerEvents:"none"}}>{suffix}</span>}
      </div>
    </div>
  );
}

// ── Segment ───────────────────────────────────────────────────────────────────
function Segment({options,value,onChange,dark,T}){
  return (
    <div style={{display:"flex",background:dark?"#0e1020":"#f0f2fa",borderRadius:12,padding:3,gap:3}}>
      {options.map(({k,label})=>(
        <button key={k} onClick={()=>onChange(k)} style={{
          flex:1,padding:"9px 0",borderRadius:9,fontSize:13,fontWeight:700,border:"none",cursor:"pointer",transition:"all 0.2s",
          background:value===k?T.accent:"transparent",
          color:value===k?"#fff":(dark?"#8b8fa8":"#9ca3b0"),
          boxShadow:value===k?"0 2px 8px rgba(124,110,247,0.35)":"none",
        }}>{label}</button>
      ))}
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
function Card({children,dark,style={}}){
  return (
    <div style={{background:dark?"#131525":"#ffffff",borderRadius:20,padding:18,marginBottom:12,
      boxShadow:dark?"0 2px 16px rgba(0,0,0,0.25)":"0 2px 12px rgba(0,0,0,0.06)",...style}}>
      {children}
    </div>
  );
}

// ── StatPill ──────────────────────────────────────────────────────────────────
function StatPill({icon,label,value,dark,color}){
  return (
    <div style={{background:dark?"#131525":"#fff",borderRadius:16,padding:"14px 12px",
      textAlign:"center",boxShadow:dark?"0 2px 12px rgba(0,0,0,0.2)":"0 2px 10px rgba(0,0,0,0.05)"}}>
      <div style={{fontSize:20,marginBottom:4}}>{icon}</div>
      <div style={{fontSize:20,fontWeight:800,color:color||"#7c6ef7",fontVariantNumeric:"tabular-nums"}}>{value||"—"}</div>
      <div style={{fontSize:10,color:dark?"#8b8fa8":"#9ca3b0",fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase"}}>{label}</div>
    </div>
  );
}

// ── Meal row ──────────────────────────────────────────────────────────────────
const rInput=(dark)=>({
  background:dark?"#0e1020":"#f5f6fa",border:`1.5px solid ${dark?"#1e2233":"#e2e4f0"}`,
  borderRadius:10,color:dark?"#f0f2ff":"#1a1d2e",fontSize:13,padding:"8px 10px",
  outline:"none",boxSizing:"border-box",
});
const delBtn=(dark)=>({
  background:"none",border:"none",color:dark?"#3a3d50":"#c8cad8",
  cursor:"pointer",fontSize:14,padding:"4px 6px",borderRadius:8,flexShrink:0,
});

function MealRow({meal,onChange,onDelete,dark,T}){
  return (
    <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
      <div style={{flex:"0 0 28px",height:28,borderRadius:8,background:dark?"#1e1a3a":"#f0eeff",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontSize:13}}>🍽️</span>
      </div>
      <input value={meal.name} onChange={e=>onChange({...meal,name:e.target.value})} placeholder="Meal name" style={{flex:1,...rInput(dark)}}/>
      <input type="number" min="0" value={meal.calories} onChange={e=>onChange({...meal,calories:e.target.value})} placeholder="kcal"
        style={{width:78,textAlign:"right",...rInput(dark),fontVariantNumeric:"tabular-nums"}}/>
      <button onClick={onDelete} style={{...delBtn(dark)}}>✕</button>
    </div>
  );
}

function ExRow({ex,onChange,onDelete,dark}){
  return (
    <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:8}}>
      <div style={{flex:"0 0 28px",height:28,borderRadius:8,background:dark?"#1e1a3a":"#f0eeff",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontSize:13}}>💪</span>
      </div>
      <input value={ex.name} onChange={e=>onChange({...ex,name:e.target.value})} placeholder="Exercise" style={{flex:1,...rInput(dark)}}/>
      <input type="number" min="0" value={ex.sets} onChange={e=>onChange({...ex,sets:e.target.value})} placeholder="Sets"
        style={{width:52,textAlign:"center",...rInput(dark),fontVariantNumeric:"tabular-nums",padding:"8px 4px"}}/>
      <span style={{color:dark?"#8b8fa8":"#9ca3b0",fontSize:13,fontWeight:700}}>×</span>
      <input type="number" min="0" value={ex.reps} onChange={e=>onChange({...ex,reps:e.target.value})} placeholder="Reps"
        style={{width:52,textAlign:"center",...rInput(dark),fontVariantNumeric:"tabular-nums",padding:"8px 4px"}}/>
      <button onClick={onDelete} style={{...delBtn(dark)}}>✕</button>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({msg,onDone}){
  useEffect(()=>{const t=setTimeout(onDone,2200);return()=>clearTimeout(t);},[onDone]);
  return (
    <div style={{position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",
      background:"#22d97a",color:"#0a2015",borderRadius:50,padding:"10px 22px",
      fontWeight:700,fontSize:14,zIndex:999,boxShadow:"0 4px 16px rgba(34,217,122,0.4)",
      whiteSpace:"nowrap",animation:"fadeup 0.3s ease"}}>
      {msg}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function Home() {
  const [dark, setDark, darkLoaded] = useLS("ft_dark", true);
  const [profile, setProfile, profileLoaded] = useLS("ft_profile", {
    name:"", age:"", weight:"", height:"", goal:"lose", calorieTarget:2200
  });
  const [dayData, setDayData, dataLoaded] = useLS("ft_days", {});
  const [view, setView] = useState("dashboard");
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [calMonth, setCalMonth] = useState(TODAY.getMonth());
  const [calYear, setCalYear] = useState(TODAY.getFullYear());
  const [toast, setToast] = useState("");
  const [profileDraft, setProfileDraft] = useState({name:"",age:"",weight:"",height:"",goal:"lose",calorieTarget:2200});

  useEffect(() => {
    if (profileLoaded) setProfileDraft(profile);
  }, [profileLoaded]);

  const T = {
    accent: "#7c6ef7",
    accentSoft: dark ? "#1e1a3a" : "#f0eeff",
    bg: dark ? "#0a0c1a" : "#f2f3f8",
    surface: dark ? "#131525" : "#ffffff",
    border: dark ? "#1e2233" : "#e2e4f0",
    text: dark ? "#f0f2ff" : "#1a1d2e",
    muted: dark ? "#8b8fa8" : "#9ca3b0",
  };

  const goal = profile.calorieTarget || 2200;
  const isLose = profile.goal === "lose";
  const data = dayData[selectedKey] || { meals:[], exercises:[] };
  const totalConsumed = data.meals.reduce((s,m)=>s+(Number(m.calories)||0),0);

  const streak = (() => {
    let count=0; const d=new Date(TODAY);
    while(true){
      const k=dateKey(d);
      const c=(dayData[k]?.meals||[]).reduce((s,m)=>s+(Number(m.calories)||0),0);
      const met=isLose?(c>0&&c<=goal):(goal>0&&c>=goal);
      if(met){count++;d.setDate(d.getDate()-1);}else break;
    }
    return count;
  })();

  const setDay=(update)=>setDayData(prev=>({...prev,[selectedKey]:{meals:[],exercises:[],...prev[selectedKey],...update}}));
  const addMeal=()=>setDay({meals:[...data.meals,{id:Date.now(),name:"",calories:""}]});
  const updMeal=(id,v)=>setDay({meals:data.meals.map(m=>m.id===id?v:m)});
  const delMeal=(id)=>setDay({meals:data.meals.filter(m=>m.id!==id)});
  const addEx=()=>setDay({exercises:[...data.exercises,{id:Date.now(),name:"",sets:"",reps:""}]});
  const updEx=(id,v)=>setDay({exercises:data.exercises.map(e=>e.id===id?v:e)});
  const delEx=(id)=>setDay({exercises:data.exercises.filter(e=>e.id!==id)});

  const handleDaySelect=(k,d)=>{setSelectedKey(k);setSelectedDate(d);setView("log");};
  const fmtDate=(d)=>`${DAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()].slice(0,3)} ${d.getDate()}`;
  const greet=()=>{const h=new Date().getHours();return h<12?"Good morning":h<17?"Good afternoon":"Good evening";};

  const saveProfile=()=>{
    const n={...profileDraft,calorieTarget:Number(profileDraft.calorieTarget)||2200};
    setProfile(n);
    setToast("Profile saved ✓");
  };

  const b = bmi(profile.weight, profile.height);
  const daysLogged = Object.keys(dayData).length;
  const goalsMet = Object.entries(dayData).filter(([,v])=>{
    const c=(v.meals||[]).reduce((s,m)=>s+(Number(m.calories)||0),0);
    return isLose?(c>0&&c<=goal):(goal>0&&c>=goal);
  }).length;

  // Don't render until LS is loaded (avoid hydration flash)
  if (!darkLoaded || !profileLoaded || !dataLoaded) {
    return (
      <div style={{background:"#0a0c1a",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <img src="/logo.png" alt="FitTrack" width={80} height={80} style={{opacity:0.6,animation:"fadein 1s ease infinite alternate"}}/>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>FitTrack</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <div style={{background:T.bg,minHeight:"100vh",maxWidth:430,margin:"0 auto",
        fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",color:T.text,
        paddingBottom:80,transition:"background 0.3s,color 0.3s",position:"relative"}}>

        <style>{`
          input::placeholder { color: ${dark?"#3a3d50":"#c0c4d0"}; }
          @keyframes fadein { from{opacity:0.3} to{opacity:0.8} }
        `}</style>

        {toast && <Toast msg={toast} onDone={()=>setToast("")}/>}

        {/* ── DASHBOARD ──────────────────────────────────────────────────── */}
        {view==="dashboard" && (
          <div style={{animation:"slidein 0.3s ease"}}>
            <div style={{padding:"52px 20px 20px",background:dark?"linear-gradient(160deg,#13152a 0%,#0a0c1a 100%)":"linear-gradient(160deg,#ece8ff 0%,#f2f3f8 100%)"}}>
              {/* Top bar with logo */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <WolfLogo size={38} />
                  <div>
                    <p style={{fontSize:12,color:T.muted,margin:"0 0 1px",fontWeight:500}}>{greet()}{profile.name?`, ${profile.name.split(" ")[0]}`:""}👋</p>
                    <h1 style={{fontSize:22,fontWeight:900,margin:0,letterSpacing:"-0.03em",color:T.text}}>FitTrack</h1>
                  </div>
                </div>
                {streak>0 && (
                  <div style={{background:dark?"#1a1c2e":"#fff",borderRadius:14,padding:"8px 12px",
                    display:"flex",alignItems:"center",gap:6,boxShadow:dark?"none":"0 2px 10px rgba(0,0,0,0.08)"}}>
                    <span style={{fontSize:16}}>🔥</span>
                    <div>
                      <p style={{margin:0,fontSize:15,fontWeight:900,color:"#ff6b35",fontVariantNumeric:"tabular-nums",lineHeight:1}}>{streak}</p>
                      <p style={{margin:0,fontSize:9,color:T.muted,lineHeight:1,fontWeight:600}}>STREAK</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Calorie ring */}
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",paddingBottom:24}}>
                <CalorieRing consumed={totalConsumed} goal={goal} dark={dark} size={170} mode={profile.goal}/>
                <p style={{color:T.muted,fontSize:12,margin:"8px 0 0",fontWeight:500}}>
                  {fmtDate(TODAY)} · {isLose?"Lose weight 🎯":"Gain weight 💪"}
                </p>
              </div>
            </div>

            <div style={{padding:"0 16px"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12,marginTop:-12}}>
                <StatPill icon="📅" label="Logged" value={daysLogged} dark={dark} color={T.accent}/>
                <StatPill icon="✅" label="Goals met" value={goalsMet} dark={dark} color="#22d97a"/>
                <StatPill icon="⚖️" label="BMI" value={b||"—"} dark={dark} color={bmiColor(b)}/>
              </div>

              <Card dark={dark}>
                <p style={{margin:"0 0 14px",fontSize:12,color:T.muted,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>This Week</p>
                <WeekStrip selectedKey={selectedKey} onSelect={handleDaySelect} dayData={dayData} goal={goal} dark={dark} T={T} mode={profile.goal}/>
              </Card>

              <button onClick={()=>{setSelectedKey(todayKey);setSelectedDate(TODAY);setView("log");}}
                style={{width:"100%",padding:"15px 0",borderRadius:16,border:"none",cursor:"pointer",
                  background:"linear-gradient(135deg,#7c6ef7,#a78bfa)",color:"#fff",
                  fontSize:15,fontWeight:800,letterSpacing:"0.02em",
                  boxShadow:"0 6px 20px rgba(124,110,247,0.4)",marginBottom:12}}>
                Log Today →
              </button>

              <Card dark={dark}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <p style={{margin:0,fontSize:11,color:T.muted,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>Daily Target</p>
                    <p style={{margin:"2px 0 0",fontSize:22,fontWeight:900,color:T.accent,fontVariantNumeric:"tabular-nums"}}>{Number(goal).toLocaleString()} <span style={{fontSize:13,color:T.muted,fontWeight:500}}>kcal</span></p>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <p style={{margin:0,fontSize:11,color:T.muted,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>{isLose?"Remaining":"You got"}</p>
                    <p style={{margin:"2px 0 0",fontSize:22,fontWeight:900,fontVariantNumeric:"tabular-nums",
                      color:isLose?(totalConsumed>goal?"#ff5c5c":totalConsumed>0&&totalConsumed<=goal?"#22d97a":T.text):(totalConsumed>=goal?"#22d97a":T.accent)}}>
                      {isLose?Math.max(0,goal-totalConsumed).toLocaleString():totalConsumed.toLocaleString()}
                      <span style={{fontSize:13,color:T.muted,fontWeight:500}}> kcal</span>
                    </p>
                  </div>
                </div>
                <p style={{margin:"6px 0 8px",fontSize:11,color:T.muted,fontWeight:500,textAlign:"center"}}>
                  {isLose
                    ? totalConsumed>goal ? `⚠️ ${(totalConsumed-goal).toLocaleString()} kcal over your limit` : `Stay at or under ${Number(goal).toLocaleString()} kcal`
                    : totalConsumed>=goal ? `✓ Target reached! Keep fueling up` : `${(goal-totalConsumed).toLocaleString()} kcal more to hit your target`}
                </p>
                {goal>0 && (
                  <div style={{height:6,background:dark?"#1e2233":"#f0f2fa",borderRadius:50,overflow:"hidden"}}>
                    <div style={{height:"100%",borderRadius:50,transition:"width 0.6s ease",
                      background:isLose?(totalConsumed>goal?"linear-gradient(90deg,#ff5c5c,#ff8c5c)":"linear-gradient(90deg,#7c6ef7,#22d97a)"):(totalConsumed>=goal?"linear-gradient(90deg,#7c6ef7,#22d97a)":"linear-gradient(90deg,#7c6ef7,#a78bfa)"),
                      width:`${Math.min(totalConsumed/goal*100,100)}%`}}/>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* ── CALENDAR ───────────────────────────────────────────────────── */}
        {view==="calendar" && (
          <div style={{padding:"52px 16px 0",animation:"slidein 0.3s ease"}}>
            {/* Logo in calendar header */}
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
              <WolfLogo size={30}/>
              <h2 style={{fontSize:22,fontWeight:900,margin:0,letterSpacing:"-0.02em"}}>Calendar</h2>
            </div>
            <Card dark={dark}>
              <MonthCal selectedKey={selectedKey} onSelect={handleDaySelect} dayData={dayData} goal={goal}
                dark={dark} month={calMonth} year={calYear} T={T} mode={profile.goal}
                onPrev={()=>{if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1);}}
                onNext={()=>{if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1);}}/>
            </Card>
            <div style={{display:"flex",gap:16,justifyContent:"center",marginTop:4}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:"#22d97a",display:"inline-block"}}/>
                <span style={{fontSize:12,color:T.muted,fontWeight:500}}>Goal met</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:T.accent,display:"inline-block"}}/>
                <span style={{fontSize:12,color:T.muted,fontWeight:500}}>Selected</span>
              </div>
            </div>
          </div>
        )}

        {/* ── LOG ────────────────────────────────────────────────────────── */}
        {view==="log" && (
          <div style={{padding:"52px 16px 0",animation:"slidein 0.3s ease"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
              <button onClick={()=>setView("dashboard")} style={{
                background:dark?"#131525":"#fff",border:`1.5px solid ${T.border}`,color:T.text,
                borderRadius:12,padding:"8px 14px",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                ← Back
              </button>
              <div>
                <p style={{margin:0,fontSize:15,fontWeight:800,color:T.text}}>{fmtDate(selectedDate)}</p>
                <p style={{margin:0,fontSize:12,color:T.muted,fontVariantNumeric:"tabular-nums"}}>
                  {isLose
                    ? `${Math.max(0,goal-totalConsumed).toLocaleString()} kcal remaining of ${Number(goal).toLocaleString()}`
                    : `${totalConsumed.toLocaleString()} kcal earned · target ${Number(goal).toLocaleString()}`}
                </p>
              </div>
            </div>

            <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
              <CalorieRing consumed={totalConsumed} goal={goal} dark={dark} size={150} mode={profile.goal}/>
            </div>

            {goal>0 && (
              <div style={{height:6,background:dark?"#1e2233":"#f0f2fa",borderRadius:50,overflow:"hidden",marginBottom:16}}>
                <div style={{height:"100%",borderRadius:50,transition:"width 0.5s ease",
                  background:isLose?(totalConsumed>goal?"linear-gradient(90deg,#ff5c5c,#ff8c5c)":"linear-gradient(90deg,#7c6ef7,#22d97a)"):(totalConsumed>=goal?"linear-gradient(90deg,#7c6ef7,#22d97a)":"linear-gradient(90deg,#7c6ef7,#a78bfa)"),
                  width:`${Math.min(totalConsumed/goal*100,100)}%`}}/>
              </div>
            )}

            <Card dark={dark}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:18}}>🥗</span>
                  <span style={{fontWeight:800,fontSize:16,color:T.text}}>Nutrition</span>
                </div>
                <button onClick={addMeal} style={{background:"linear-gradient(135deg,#7c6ef7,#a78bfa)",color:"#fff",border:"none",
                  borderRadius:10,fontWeight:700,fontSize:12,padding:"7px 14px",cursor:"pointer",
                  boxShadow:"0 3px 10px rgba(124,110,247,0.3)"}}>+ Add Meal</button>
              </div>
              {data.meals.length===0 && (
                <div style={{textAlign:"center",padding:"16px 0",color:T.muted,fontSize:13}}>
                  <div style={{fontSize:32,marginBottom:8}}>🍽️</div>No meals logged yet
                </div>
              )}
              {data.meals.map(m=>(
                <MealRow key={m.id} meal={m} onChange={v=>updMeal(m.id,v)} onDelete={()=>delMeal(m.id)} dark={dark} T={T}/>
              ))}
              {data.meals.length>0 && (
                <div style={{borderTop:`1px solid ${T.border}`,marginTop:8,paddingTop:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:13,color:T.muted,fontWeight:600}}>Total calories</span>
                  <span style={{fontSize:20,fontWeight:900,fontVariantNumeric:"tabular-nums",
                    color:isLose?(totalConsumed>goal?"#ff5c5c":totalConsumed>0?"#22d97a":T.accent):(totalConsumed>=goal?"#22d97a":T.accent)}}>
                    {totalConsumed.toLocaleString()}<span style={{fontSize:12,fontWeight:500,color:T.muted}}> kcal</span>
                  </span>
                </div>
              )}
            </Card>

            <Card dark={dark}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:18}}>🏋️</span>
                  <span style={{fontWeight:800,fontSize:16,color:T.text}}>Workout</span>
                </div>
                <button onClick={addEx} style={{background:"linear-gradient(135deg,#22d97a,#16b36a)",color:"#fff",border:"none",
                  borderRadius:10,fontWeight:700,fontSize:12,padding:"7px 14px",cursor:"pointer",
                  boxShadow:"0 3px 10px rgba(34,217,122,0.3)"}}>+ Add Exercise</button>
              </div>
              {data.exercises.length===0 && (
                <div style={{textAlign:"center",padding:"16px 0",color:T.muted,fontSize:13}}>
                  <div style={{fontSize:32,marginBottom:8}}>💪</div>No exercises logged yet
                </div>
              )}
              {data.exercises.length>0 && (
                <div style={{display:"flex",gap:6,marginBottom:8,paddingLeft:36}}>
                  <span style={{flex:1,fontSize:10,color:T.muted,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>Exercise</span>
                  <span style={{width:52,fontSize:10,color:T.muted,textAlign:"center",fontWeight:700,textTransform:"uppercase"}}>Sets</span>
                  <span style={{width:14}}/>
                  <span style={{width:52,fontSize:10,color:T.muted,textAlign:"center",fontWeight:700,textTransform:"uppercase"}}>Reps</span>
                  <span style={{width:28}}/>
                </div>
              )}
              {data.exercises.map(e=>(
                <ExRow key={e.id} ex={e} onChange={v=>updEx(e.id,v)} onDelete={()=>delEx(e.id)} dark={dark}/>
              ))}
              {data.exercises.length>0 && (
                <div style={{borderTop:`1px solid ${T.border}`,marginTop:8,paddingTop:12,display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontSize:13,color:T.muted,fontWeight:600}}>Exercises</span>
                  <span style={{fontSize:16,fontWeight:800,color:"#22d97a"}}>{data.exercises.length}</span>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ── PROFILE ────────────────────────────────────────────────────── */}
        {view==="profile" && (
          <div style={{padding:"52px 16px 0",animation:"slidein 0.3s ease"}}>
            {/* Profile header with wolf logo as avatar bg */}
            <div style={{
              background:dark?"linear-gradient(135deg,#1a1c2e,#131525)":"linear-gradient(135deg,#ece8ff,#f5f3ff)",
              borderRadius:20,padding:"24px 20px",marginBottom:12,
              display:"flex",alignItems:"center",gap:16,
              boxShadow:dark?"0 4px 20px rgba(0,0,0,0.3)":"0 4px 16px rgba(124,110,247,0.12)"}}>
              <div style={{width:64,height:64,borderRadius:20,
                background:"linear-gradient(135deg,#7c6ef7,#a78bfa)",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:28,boxShadow:"0 4px 16px rgba(124,110,247,0.4)",
                overflow:"hidden",position:"relative"}}>
                {profile.name
                  ? <span style={{fontSize:26,fontWeight:900,color:"#fff"}}>{profile.name[0].toUpperCase()}</span>
                  : <img src="/logo.png" alt="" width={56} height={56} style={{objectFit:"contain",position:"absolute"}}/>
                }
              </div>
              <div>
                <h2 style={{margin:"0 0 3px",fontSize:20,fontWeight:900,color:T.text,letterSpacing:"-0.02em"}}>
                  {profile.name||"Your Name"}
                </h2>
                <p style={{margin:0,fontSize:12,color:T.muted,fontWeight:500}}>
                  {profile.goal==="lose"?"🎯 Losing weight":"💪 Gaining weight"}
                  {profile.age?` · ${profile.age} yrs`:""}
                  {b?` · BMI ${b}`:""}
                </p>
              </div>
            </div>

            {(profile.weight||profile.height) && (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
                <StatPill icon="⚖️" label="Weight" value={profile.weight?`${profile.weight}kg`:"—"} dark={dark} color={T.accent}/>
                <StatPill icon="📏" label="Height" value={profile.height?`${profile.height}cm`:"—"} dark={dark} color="#60b4ff"/>
                <StatPill icon="🧬" label={bmiLabel(b)||"BMI"} value={b||"—"} dark={dark} color={bmiColor(b)}/>
              </div>
            )}

            <Card dark={dark}>
              <p style={{margin:"0 0 14px",fontSize:12,fontWeight:700,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase"}}>Personal Info</p>
              <FInput label="Full name" value={profileDraft.name} onChange={v=>setProfileDraft(p=>({...p,name:v}))} placeholder="e.g. Alex Johnson" dark={dark} T={T}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <FInput label="Age" value={profileDraft.age} onChange={v=>setProfileDraft(p=>({...p,age:v}))} type="number" placeholder="25" suffix="yrs" dark={dark} T={T}/>
                <FInput label="Weight" value={profileDraft.weight} onChange={v=>setProfileDraft(p=>({...p,weight:v}))} type="number" placeholder="70" suffix="kg" dark={dark} T={T}/>
              </div>
              <FInput label="Height" value={profileDraft.height} onChange={v=>setProfileDraft(p=>({...p,height:v}))} type="number" placeholder="175" suffix="cm" dark={dark} T={T}/>
            </Card>

            <Card dark={dark}>
              <p style={{margin:"0 0 14px",fontSize:12,fontWeight:700,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase"}}>Fitness Goal</p>
              <Segment
                options={[{k:"lose",label:"🎯 Lose Weight"},{k:"gain",label:"💪 Gain Weight"}]}
                value={profileDraft.goal}
                onChange={v=>setProfileDraft(p=>({...p,goal:v}))}
                dark={dark} T={T}/>
              <div style={{marginTop:14}}>
                <FInput label="Daily calorie target" value={String(profileDraft.calorieTarget)} onChange={v=>setProfileDraft(p=>({...p,calorieTarget:v}))} type="number" placeholder="2200" suffix="kcal" dark={dark} T={T}/>
              </div>
              {profileDraft.weight && profileDraft.height && (
                <div style={{marginTop:4,padding:"10px 12px",background:dark?"#0e1020":"#f5f6fa",borderRadius:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:12,color:T.muted,fontWeight:600}}>Your BMI</span>
                  <span style={{fontSize:14,fontWeight:800,color:bmiColor(bmi(profileDraft.weight,profileDraft.height))}}>
                    {bmi(profileDraft.weight,profileDraft.height)} — {bmiLabel(bmi(profileDraft.weight,profileDraft.height))}
                  </span>
                </div>
              )}
            </Card>

            <Card dark={dark}>
              <p style={{margin:"0 0 14px",fontSize:12,fontWeight:700,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase"}}>Appearance</p>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:20}}>{dark?"🌙":"☀️"}</span>
                  <div>
                    <p style={{margin:0,fontSize:14,fontWeight:700,color:T.text}}>{dark?"Dark Mode":"Light Mode"}</p>
                    <p style={{margin:0,fontSize:11,color:T.muted}}>Tap to switch</p>
                  </div>
                </div>
                <button onClick={()=>setDark(d=>!d)} style={{
                  width:52,height:28,borderRadius:50,border:"none",cursor:"pointer",position:"relative",
                  background:dark?"#7c6ef7":"#e2e4f0",transition:"background 0.3s"}}>
                  <span style={{position:"absolute",top:3,left:dark?26:3,width:22,height:22,borderRadius:50,
                    background:"#fff",transition:"left 0.3s",boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}}/>
                </button>
              </div>
            </Card>

            <button onClick={saveProfile} style={{
              width:"100%",padding:"16px 0",borderRadius:16,border:"none",cursor:"pointer",
              background:"linear-gradient(135deg,#7c6ef7,#a78bfa)",color:"#fff",
              fontSize:15,fontWeight:800,letterSpacing:"0.02em",marginBottom:8,
              boxShadow:"0 6px 20px rgba(124,110,247,0.4)"}}>
              Save Profile
            </button>

            <Card dark={dark} style={{marginTop:4}}>
              <p style={{margin:"0 0 12px",fontSize:12,fontWeight:700,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase"}}>Your Stats</p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {[
                  {icon:"📅",label:"Days logged",val:daysLogged,color:T.accent},
                  {icon:"✅",label:"Goals met",val:goalsMet,color:"#22d97a"},
                  {icon:"🔥",label:"Streak",val:`${streak}d`,color:"#ff6b35"},
                  {icon:"🍽️",label:"Meals today",val:data.meals.length,color:"#60b4ff"},
                ].map(s=>(
                  <div key={s.label} style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:20}}>{s.icon}</span>
                    <div>
                      <p style={{margin:0,fontSize:18,fontWeight:900,color:s.color,fontVariantNumeric:"tabular-nums"}}>{s.val}</p>
                      <p style={{margin:0,fontSize:11,color:T.muted,fontWeight:500}}>{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ── Bottom nav ─────────────────────────────────────────────────── */}
        <div style={{
          position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
          width:"100%",maxWidth:430,
          background:dark?"rgba(10,12,26,0.94)":"rgba(242,243,248,0.94)",
          backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",
          borderTop:`1px solid ${T.border}`,
          display:"flex",paddingBottom:"env(safe-area-inset-bottom,0px)",zIndex:100,
        }}>
          {[
            {id:"dashboard",label:"Home",emoji:"⊞"},
            {id:"calendar",label:"Calendar",emoji:"◫"},
            {id:"log",label:"Today",emoji:null,cta:true},
            {id:"profile",label:"Profile",emoji:null,wolf:true},
          ].map(({id,label,emoji,cta,wolf})=>(
            <button key={id} onClick={()=>{
              if(id==="log"){setSelectedKey(todayKey);setSelectedDate(TODAY);}
              setView(id);
            }} style={{
              flex:1,background:"none",border:"none",cursor:"pointer",
              padding:"10px 0 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,
              position:"relative",
            }}>
              {cta ? (
                <div style={{
                  width:42,height:42,borderRadius:14,
                  background:"linear-gradient(135deg,#7c6ef7,#a78bfa)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  boxShadow:"0 4px 16px rgba(124,110,247,0.5)",marginBottom:2,
                  transform:view===id?"scale(1.1)":"scale(1)",transition:"transform 0.2s",
                }}>
                  <span style={{fontSize:20,color:"#fff",lineHeight:1}}>+</span>
                </div>
              ) : wolf ? (
                <div style={{
                  width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",
                  opacity:view===id?1:0.4,transition:"opacity 0.2s",
                  transform:view===id?"scale(1.15)":"scale(1)",
                  filter:view===id?"none":"grayscale(0.3)",
                }}>
                  <WolfLogo size={28}/>
                </div>
              ) : (
                <span style={{fontSize:18,filter:view===id?"none":"grayscale(1)",opacity:view===id?1:0.45,
                  transition:"all 0.2s",transform:view===id?"scale(1.15)":"scale(1)"}}>{emoji}</span>
              )}
              <span style={{fontSize:9,fontWeight:700,letterSpacing:"0.05em",textTransform:"uppercase",
                color:view===id?T.accent:T.muted,transition:"color 0.2s"}}>{label}</span>
              {view===id && !cta && (
                <span style={{position:"absolute",bottom:0,width:20,height:2,borderRadius:2,background:T.accent}}/>
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
