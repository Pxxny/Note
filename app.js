
const MODES = [
 {id:"chill",icon:"🧘",name:"จำชิล ๆ",desc:"วันนี้ขอแค่จำได้ ไม่ต้องรีบ",level:1,time:"15–20 นาที",words:"20–30",goal:24},
 {id:"steady",icon:"🌱",name:"จำไม่เร่ง",desc:"ค่อย ๆ จำ แต่จำจริง",level:2,time:"25–30 นาที",words:"30–45",goal:36},
 {id:"marathon",icon:"🏃",name:"จำมาราธอน",desc:"ใช้เวลาวันนี้สร้างคลังศัพท์",level:4,time:"60–120 นาที",words:"80–140",goal:100},
 {id:"speed",icon:"⚡",name:"จำสปีด",desc:"เวลาน้อย แต่ยังรักษาความต่อเนื่อง",level:3,time:"10–15 นาที",words:"15–25",goal:20},
 {id:"master",icon:"🎯",name:"จำให้แม่น",desc:"จำให้แม่น ไม่ใช่แค่เคยเห็น",level:3,time:"20–30 นาที",words:"20–30",goal:24},
 {id:"rescue",icon:"🔥",name:"กู้ศัพท์ที่ลืม",desc:"เคลียร์คำที่ค้างอยู่",level:2,time:"20–30 นาที",words:"15–30",goal:24},
 {id:"brain",icon:"🧠",name:"Brain Training",desc:"เปลี่ยนรูปแบบโจทย์ไปเรื่อย ๆ",level:3,time:"25–35 นาที",words:"30–50",goal:36},
 {id:"random",icon:"🎲",name:"สุ่มไม่จำเจ",desc:"ฝึกโดยไม่รู้ว่าโจทย์ต่อไปคืออะไร",level:3,time:"20–30 นาที",words:"25–40",goal:30},
 {id:"challenge",icon:"🏆",name:"Challenge",desc:"แข่งกับสถิติของตัวเอง",level:4,time:"30–45 นาที",words:"35–60",goal:45},
 {id:"letters",icon:"📚",name:"เจาะ Letters",desc:"เลือกความยาวที่อยากเจาะ",level:2,time:"20–45 นาที",words:"กำหนดเอง",goal:30},
 {id:"review",icon:"🔄",name:"Review Day",desc:"รักษาความจำของศัพท์เก่า",level:2,time:"20–40 นาที",words:"20–50",goal:35},
 {id:"full",icon:"🚀",name:"Full Grind",desc:"ฝึกเต็มระบบในวันที่พร้อม",level:5,time:"60–120 นาที",words:"100–180",goal:120}
];
const TYPES = ["Word Recall","Letter → Word","Word → Letter","Anagram","Unscramble","Missing Letters","Reverse Recall","Multiple Choice","Timed Quiz","Mixed Quiz"];
const LETTERS=[3,4,5,6,7,8,9];
const DEFAULT = {mode:null, count:null, countPreset:"normal", letters:[3,4,5,6,7,8,9], types:["Mixed Quiz","Word Recall","Anagram"], plan:[], currentSession:0, currentWord:null};
const KEY="dwt-state-v1";
let state = loadState();

function loadState(){
  try{
    const saved=JSON.parse(localStorage.getItem(KEY)||"null");
    return Object.assign({mode:null, selectedMode:null, countPreset:"normal", letters:[3,4,5,6,7,8,9], types:["Mixed Quiz","Word Recall","Anagram"], today:{}, stats:{}, memory:{}, history:{}}, saved||{});
  }catch(e){return {...DEFAULT}}
}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function stars(n){return "⭐".repeat(n)}
function data(){
  return globalThis.CSW24_BY_LENGTH||{};
}
function allWords(lengths=LETTERS){
  const d=data(); return lengths.flatMap(n=>d[n]||[]);
}
function pickWords(n,lengths=state.letters){
  const pool=allWords(lengths);
  const shuffled=pool.slice().sort(()=>Math.random()-.5);
  return shuffled.slice(0,n);
}
function memoryStatus(word){
  const m=state.memory[word];
  if(!m) return ["🟡","Learning","yellow"];
  if(m.level>=4) return ["🟢","Mastered","green"];
  if(m.level>=2) return ["🟡","Learning","yellow"];
  if(m.level===1) return ["🟠","Weak","orange"];
  return ["🔴","Forgotten","red"];
}
function recordAnswer(word,correct,ms=0){
  const m=state.memory[word]||{level:0,reps:0,correct:0,wrong:0,due:Date.now()};
  m.reps++; correct?m.correct++:m.wrong++;
  if(correct){m.level=Math.min(4,m.level+1); const days=[0,1,3,7,14,30][Math.min(m.level,5)];m.due=Date.now()+days*864e5}
  else{m.level=Math.max(0,m.level-1);m.due=Date.now()}
  m.last=Date.now();m.avgMs=m.avgMs?Math.round(m.avgMs*.7+ms*.3):ms;state.memory[word]=m;
  const t=state.today||{};t.learned=(t.learned||0)+(correct?1:0);t.attempts=(t.attempts||0)+1;t.correct=(t.correct||0)+(correct?1:0);t.time=(t.time||0)+ms;state.today=t;save();
}
function todayKey(){return new Date().toISOString().slice(0,10)}
function modeById(id){return MODES.find(x=>x.id===id)||MODES[0]}
function setTheme(){document.documentElement.dataset.theme=state.theme||"light"}
function render(){
  setTheme();
  const app=document.getElementById("app");
  const page=state.page||"home";
  app.innerHTML=`<div class="app-shell">
    <header class="topbar"><div class="topbar-inner"><div class="brand">📚 Daily Word Training</div><button class="icon-btn" onclick="toggleTheme()" aria-label="theme">☾</button></div></header>
    <main>${page==="home"?homePage():page==="practice"?practicePage():page==="review"?reviewPage():page==="stats"?statsPage():page==="calendar"?calendarPage():settingsPage()}</main>
    ${nav(page)}
  </div>${state.toast?`<div class="toast">${esc(state.toast)}</div>`:""}`;
  if(state.toast){const t=state.toast;state.toast=null;setTimeout(render,1300)}
}
function nav(page){
 const items=[["home","🏠","Home"],["practice","📚","Practice"],["review","🔄","Review"],["stats","📊","Statistics"],["calendar","📅","Calendar"],["settings","⚙️","Settings"]];
 return `<nav class="nav"><div class="nav-inner">${items.map(x=>`<button class="nav-btn ${page===x[0]?"active":""}" onclick="go('${x[0]}')"><span class="nav-icon">${x[1]}</span>${x[2]}</button>`).join("")}</div></nav>`;
}
function homePage(){
 const selected=state.selectedMode;
 return `<section class="hero"><div class="eyebrow">Personal Vocabulary Training System</div><h1>วันนี้สมองคุณไหวแค่ไหน?</h1><p>เลือกโหมดที่เหมาะกับวันนี้ แล้วให้ระบบจัดตารางฝึกให้คุณอัตโนมัติ</p></section>
 <div class="mode-grid">${MODES.map(m=>`<article class="mode-card ${selected===m.id?"selected":""}" onclick="chooseMode('${m.id}')">
   <div class="mode-icon">${m.icon}</div><div class="mode-title">${m.name}</div><div class="mode-desc">${m.desc}</div>
   <div class="meta-row"><span class="pill">${stars(m.level)}</span><span class="pill">⏱ ${m.time}</span><span class="pill">📚 ${m.words} คำ</span></div>
   <button class="mode-action" onclick="event.stopPropagation();chooseMode('${m.id}')">เลือกโหมดนี้</button>
 </article>`).join("")}</div>
 <div class="auto-card"><div><h2>✨ เลือกให้ฉัน</h2><p>ตอบ 3 คำถามสั้น ๆ แล้วระบบเลือกโหมดและ Daily Plan ให้</p></div><button class="primary" onclick="autoWizard()">เลือกให้ฉัน</button></div>`;
}
function chooseMode(id){
 state.selectedMode=id; state.mode=id; save(); state.toast=`เลือกโหมด ${modeById(id).name} แล้ว`; state.page="practice"; render();
}
function practicePage(){
 if(!state.mode) return `<section class="hero"><h1>เริ่มจากเลือกโหมด</h1><p>กลับไปหน้า Home เพื่อเลือกความหนักเบาที่เหมาะกับวันนี้</p><div class="actions"><button class="primary" onclick="go('home')">เลือกโหมด</button></div></section>`;
 const m=modeById(state.mode); const count=currentCount(m); const p=buildPlan(m);
 return `<div class="page-title"><div><h2>${m.icon} ${m.name}</h2><p>${m.desc}</p></div><button class="secondary" onclick="go('home')">เปลี่ยนโหมด</button></div>
 <section class="panel"><div class="section-title">ตั้งค่าการฝึกวันนี้</div><div class="field-label">จำนวนศัพท์</div>
 <div class="choice-grid">${[["light","เบา"],["normal","ปกติ"],["heavy","เยอะ"],["custom","กำหนดเอง"]].map(x=>`<button class="choice ${state.countPreset===x[0]?"active":""}" onclick="setCount('${x[0]}')">${x[1]}${x[0]!=="custom"?` · ${suggestCount(m,x[0])}`:""}</button>`).join("")}</div>
 ${state.countPreset==="custom"?`<div style="margin-top:12px"><input type="number" min="5" max="300" value="${count}" onchange="setCustomCount(this.value)" style="width:140px;padding:11px;border-radius:12px;border:1px solid var(--line);background:var(--panel);color:var(--text)"></div>`:""}
 </section>
 <section class="panel"><div class="section-title">Letters</div><div class="choice-grid">${LETTERS.map(n=>`<button class="choice ${state.letters.includes(n)?"active":""}" onclick="toggleLetter(${n})">${n} Letters</button>`).join("")}</div><div class="actions"><button class="secondary" onclick="selectAllLetters()">เลือกทั้งหมด</button></div></section>
 <section class="panel"><div class="section-title">ประเภทการฝึก</div><div class="choice-grid">${TYPES.map(t=>`<button class="choice ${state.types.includes(t)?"active":""}" onclick="toggleType('${t}')">${t}</button>`).join("")}</div></section>
 <section class="panel"><div class="section-title">Daily Plan</div>${p.map((x,i)=>`<div class="word-row"><div><b>${x.icon} ${x.name}</b><div style="color:var(--muted);font-size:13px">${x.desc}</div></div><b>${x.words} คำ</b><span class="tag">${x.time}</span><button class="primary" onclick="startSession(${i})">${i<state.currentSession?"✓ เสร็จแล้ว":i===state.currentSession?"▶ เริ่ม":"ดูแผน"}</button></div>`).join("")}</section>`;
}
function suggestCount(m,p){return p==="light"?Math.max(8,Math.round(m.goal*.65)):p==="heavy"?Math.round(m.goal*1.5):m.goal}
function currentCount(m){return state.countPreset==="custom"?Number(state.customCount||m.goal):suggestCount(m,state.countPreset||"normal")}
function setCount(p){state.countPreset=p;save();render()}
function setCustomCount(v){state.customCount=Math.max(5,Math.min(300,Number(v)||20));state.countPreset="custom";save();render()}
function toggleLetter(n){state.letters=state.letters.includes(n)?state.letters.filter(x=>x!==n):[...state.letters,n].sort((a,b)=>a-b);if(!state.letters.length)state.letters=[3];save();render()}
function selectAllLetters(){state.letters=[3,4,5,6,7,8,9];save();render()}
function toggleType(t){state.types=state.types.includes(t)?state.types.filter(x=>x!==t):[...state.types,t];if(!state.types.length)state.types=["Mixed Quiz"];save();render()}
function buildPlan(m){
 const n=currentCount(m);
 const plans={
 chill:[["🌅","New Words",Math.ceil(n*.6),"8–10 นาที","ศัพท์ใหม่น้อย เน้นจำให้แม่น"],["☀️","Review",Math.ceil(n*.3),"4–6 นาที","ทบทวนเฉพาะคำที่ผิด"],["🌙","Finish",Math.floor(n*.1),"3–4 นาที","ปิดท้ายแบบไม่เร่ง"]],
 steady:[["🌅","New Words",Math.ceil(n*.55),"10 นาที","ศัพท์ใหม่ระดับปานกลาง"],["☀️","Quick Review",Math.ceil(n*.25),"6 นาที","Recall + Anagram"],["🌙","Mini Quiz",Math.floor(n*.2),"6 นาที","Quiz สั้น ๆ"]],
 marathon:[["🌅","New Words",Math.ceil(n*.3),"20 นาที","ชุดแรก"],["☀️","Review",Math.ceil(n*.2),"15 นาที","ทบทวน"],["☕","Break",0,"5 นาที","พักอัตโนมัติ"],["🌆","Quiz + Recall",Math.ceil(n*.25),"20 นาที","หลายรูปแบบ"],["🌙","Final Test",Math.ceil(n*.25),"15 นาที","สรุปผล"]],
 speed:[["⚡","Quick Quiz",Math.ceil(n*.5),"5 นาที","เร็วและถูก"],["⚡","Timed Recall",Math.ceil(n*.35),"5 นาที","จับเวลา"],["✓","Finish",Math.floor(n*.15),"2–3 นาที","รักษาความต่อเนื่อง"]],
 master:[["🎯","New Words",Math.ceil(n*.35),"8 นาที","คำใหม่ไม่เยอะ"],["🧠","Recall x2",Math.ceil(n*.45),"12 นาที","คำผิดกลับมาทันที"],["✓","Pass Check",Math.floor(n*.2),"5 นาที","ผ่านเมื่อถึงเกณฑ์"]],
 rescue:[["🔥","Weak Words",Math.ceil(n*.5),"10 นาที","คำที่ผิด/ลืม"],["🔄","Review Queue",Math.ceil(n*.35),"8 นาที","คำถึงกำหนด"],["✓","Recovery Quiz",Math.floor(n*.15),"5 นาที","เช็กการฟื้นตัว"]],
 brain:[["🧠","Mixed Brain Training",n,"25–35 นาที","Recall / Anagram / Unscramble"]],
 random:[["🎲","Random Mix",n,"20–30 นาที","ระบบสุ่มโจทย์ต่อเนื่อง"]],
 challenge:[["🏆","Challenge",Math.ceil(n*.7),"25 นาที","Score + XP + Combo"],["🏁","Final Score",Math.floor(n*.3),"10 นาที","เทียบสถิติของตัวเอง"]],
 letters:[["📚","Selected Letters",n,"20–45 นาที","ฝึกตาม Letters ที่เลือก"]],
 review:[["🔄","Review Queue",Math.ceil(n*.55),"15 นาที","Spaced Repetition"],["🟠","Weak Words",Math.ceil(n*.3),"10 นาที","คำที่ยังไม่แม่น"],["✓","Final Review",Math.floor(n*.15),"5 นาที","ปิดท้าย"]],
 full:[["🚀","New Words",Math.ceil(n*.25),"20 นาที","เริ่มคลังใหม่"],["🔄","Review",Math.ceil(n*.15),"15 นาที","ทบทวน"],["🧠","Recall + Anagram",Math.ceil(n*.2),"15 นาที","ฝึกจำ"],["☕","Break",0,"5 นาที","พัก"],["⚡","Timed Quiz",Math.ceil(n*.2),"15 นาที","สปีด"],["🔥","Weak Words",Math.ceil(n*.1),"10 นาที","แก้จุดอ่อน"],["🏁","Final Test",Math.floor(n*.1),"10 นาที","สรุปผล"]]
 };
 return (plans[m.id]||plans.steady).map(x=>({icon:x[0],name:x[1],words:x[2],time:x[3],desc:x[4]}));
}
function startSession(i){
 const p=buildPlan(modeById(state.mode))[i];
 if(!p||p.name==="Break"){state.toast="พักสักหน่อยก็ได้ ☕";render();return}
 state.currentSession=i; state.sessionWords=pickWords(Math.max(1,p.words||10),state.letters);state.quizIndex=0;state.sessionType=pickType();state.sessionStarted=Date.now();save();renderQuiz();
}
function pickType(){return state.types[Math.floor(Math.random()*state.types.length)]||"Word Recall"}
function renderQuiz(){
 const words=state.sessionWords||["WORD"]; const w=words[state.quizIndex];
 if(!w){state.currentSession++;state.toast="Session สำเร็จ ✓";save();render();return}
 const type=state.sessionType||"Word Recall";
 let prompt="",extra="";
 if(type==="Anagram"||type==="Letter → Word"){prompt=w.split("").sort().join(" ");extra=`<div class="anagram-letters">${w.split("").sort().map(c=>`<span class="tile">${c}</span>`).join("")}</div>`}
 else if(type==="Word → Letter"){prompt=w;extra="<p style='color:var(--muted)'>พิมพ์ตัวอักษรของคำนี้</p>"}
 else if(type==="Missing Letters"){const hide=Math.max(1,Math.floor(w.length/3));let a=w.split("");for(let i=0;i<hide;i++)a[Math.floor(Math.random()*a.length)]="_";prompt=a.join(" ")}
 else {prompt=w;extra="<p style='color:var(--muted)'>จำคำนี้ แล้วตอบคำศัพท์/ตัวอักษรตามโจทย์</p>"}
 document.getElementById("app").innerHTML=`<div class="app-shell"><main><section class="panel quiz">
 <div class="eyebrow">${modeById(state.mode).name} · ${type}</div>
 <h2>ข้อ ${state.quizIndex+1} / ${words.length}</h2>
 <div class="prompt">${esc(prompt)}</div>${extra}
 <input id="answer" autocomplete="off" autocapitalize="characters" placeholder="พิมพ์คำตอบ..." onkeydown="if(event.key==='Enter')submitAnswer()">
 <div class="feedback" id="feedback"></div>
 <div class="actions" style="justify-content:center"><button class="primary" onclick="submitAnswer()">ตรวจคำตอบ</button><button class="secondary" onclick="skipAnswer()">ข้าม</button></div>
 </section></main></div>`;
 setTimeout(()=>document.getElementById("answer")?.focus(),50)
}
function submitAnswer(){
 const input=document.getElementById("answer"); if(!input)return;
 const answer=input.value.trim().toUpperCase(); const w=state.sessionWords[state.quizIndex];
 const type=state.sessionType; let expected=w;
 if(type==="Word → Letter") expected=w.split("").sort().join("");
 const correct=answer===expected;
 recordAnswer(w,correct,Date.now()-(state.sessionStarted||Date.now()));
 const f=document.getElementById("feedback");f.textContent=correct?"✓ ถูกต้อง":"ยังไม่ถูก — คำตอบ: "+expected;f.className="feedback "+(correct?"green":"red");
 setTimeout(()=>{state.quizIndex++;state.sessionType=pickType();state.sessionStarted=Date.now();save();renderQuiz()},correct?500:1200)
}
function skipAnswer(){const w=state.sessionWords[state.quizIndex];recordAnswer(w,false,Date.now()-(state.sessionStarted||Date.now()));state.quizIndex++;state.sessionType=pickType();state.sessionStarted=Date.now();save();renderQuiz()}
function reviewPage(){
 const due=Object.entries(state.memory).filter(([w,m])=>!m.due||m.due<=Date.now()).sort((a,b)=>(a[1].level||0)-(b[1].level||0)).slice(0,80);
 return `<div class="page-title"><div><h2>🔄 Review</h2><p>คำที่ถึงกำหนดจะกลับมาให้ทบทวนตาม Spaced Repetition</p></div></div>
 <section class="panel"><div class="stats-grid"><div class="stat"><span>Review Queue</span><b>${due.length}</b></div><div class="stat"><span>Weak</span><b>${Object.values(state.memory).filter(m=>m.level<=1).length}</b></div><div class="stat"><span>Mastered</span><b>${Object.values(state.memory).filter(m=>m.level>=4).length}</b></div><div class="stat"><span>Today Accuracy</span><b>${accuracy()}%</b></div></div></section>
 <section class="panel"><h3 class="section-title">📌 คำที่ควรทบทวนวันนี้</h3><div class="word-list">${due.length?due.map(([w,m])=>wordRow(w,m)).join(""):`<p style="color:var(--muted)">วันนี้ยังไม่มีคำที่ถึงกำหนด Review</p>`}</div><div class="actions"><button class="primary" onclick="startReview()">▶ เริ่ม Review</button></div></section>`;
}
function wordRow(w,m){const s=memoryStatus(w);return `<div class="word-row"><span class="word">${esc(w)}</span><span>${w.length}L</span><span class="tag ${s[2]}">${s[0]} ${s[1]}</span><span>${m.due&&m.due>Date.now()?new Date(m.due).toLocaleDateString("th-TH"):"ถึงกำหนด"}</span></div>`}
function startReview(){const due=Object.entries(state.memory).filter(([w,m])=>!m.due||m.due<=Date.now()).map(x=>x[0]);state.sessionWords=(due.length?due:pickWords(20)).slice(0,40);state.sessionType="Word Recall";state.quizIndex=0;state.mode=state.mode||"review";state.sessionStarted=Date.now();save();renderQuiz()}
function accuracy(){const t=state.today||{};return t.attempts?Math.round(t.correct/t.attempts*100):0}
function statsPage(){
 const mem=Object.values(state.memory);const learned=mem.length, mastered=mem.filter(m=>m.level>=4).length, review=mem.filter(m=>!m.due||m.due<=Date.now()).length;
 return `<div class="page-title"><div><h2>📊 Statistics</h2><p>ดูพัฒนาการของตัวเองโดยไม่ต้องแข่งกับใคร</p></div></div>
 <section class="panel"><div class="stats-grid"><div class="stat"><span>Words Learned</span><b>${learned}</b></div><div class="stat"><span>Words Mastered</span><b>${mastered}</b></div><div class="stat"><span>Words to Review</span><b>${review}</b></div><div class="stat"><span>Accuracy</span><b>${accuracy()}%</b></div></div></section>
 <section class="panel"><h3 class="section-title">Progress 3–9 Letters</h3><div class="letter-bars">${LETTERS.map(n=>{const arr=Object.entries(state.memory).filter(([w])=>w.length===n);const done=arr.filter(([,m])=>m.level>=4).length;const pct=arr.length?Math.round(done/arr.length*100):0;return `<div class="letter-row"><b>${n} Letters</b><div class="bar"><i style="width:${pct}%"></i></div><span>${pct}%</span></div>`}).join("")}</div></section>
 <section class="panel"><h3 class="section-title">Daily Checklist</h3><div class="check-grid">${["3 Letters","4 Letters","5 Letters","6 Letters","7 Letters","8 Letters","9 Letters","New Words","Review","Anagram","Recall","Final Quiz"].map((x,i)=>`<button class="check-card ${i<Math.min(12,(state.today?.completed||0))?"done":""}" onclick="completeCheck(${i})">${i<Math.min(12,(state.today?.completed||0))?"✓":"☐"} ${x}</button>`).join("")}</div></section>`;
}
function completeCheck(i){state.today=state.today||{};state.today.completed=Math.min(12,Math.max(state.today.completed||0,i+1));save();render()}
function calendarPage(){
 const days=[];for(let i=29;i>=0;i--){const d=new Date(Date.now()-i*864e5);const k=d.toISOString().slice(0,10);const h=state.history?.[k];days.push({d,k,h})}
 return `<div class="page-title"><div><h2>📅 Calendar</h2><p>🟢 ครบ · 🟡 บางส่วน · ⚪ ยังไม่ได้ฝึก</p></div></div><section class="panel"><div class="check-grid">${days.map(x=>`<button class="check-card" onclick="dayDetail('${x.k}')">${x.h?.completed>=5?"🟢":x.h?.attempts?"🟡":"⚪"} <b>${new Date(x.k).toLocaleDateString("th-TH",{day:"numeric",month:"short"})}</b><span style="margin-left:auto;color:var(--muted)">${x.h?.learned||0} คำ</span></button>`).join("")}</div></section>`;
}
function dayDetail(k){const h=state.history?.[k]||{};alert(`${k}\nMode: ${h.mode||"-"}\nคำศัพท์: ${h.learned||0}\nAccuracy: ${h.attempts?Math.round(h.correct/h.attempts*100):0}%\nเวลา: ${Math.round((h.time||0)/60000)} นาที\nLetters: ${h.letters?.join(", ")||"-"}`)}
function settingsPage(){return `<div class="page-title"><div><h2>⚙️ Settings</h2><p>ตั้งค่าการใช้งานของ Daily Word Training</p></div></div>
<section class="panel"><h3 class="section-title">Theme</h3><div class="choice-grid"><button class="choice ${state.theme!=="dark"?"active":""}" onclick="setThemePref('light')">☀️ Light</button><button class="choice ${state.theme==="dark"?"active":""}" onclick="setThemePref('dark')">🌙 Dark</button></div></section>
<section class="panel"><h3 class="section-title">Word Data</h3><p style="color:var(--muted)">ใช้ฐานคำศัพท์จากไฟล์ Words Data ที่แยกออกจาก HTML และรองรับ 3–9 Letters สำหรับการฝึก</p><p style="color:var(--muted)">ฐานข้อมูลที่โหลด: CSW24 · ${typeof CSW24_TOTAL_COUNT==="number"?CSW24_TOTAL_COUNT.toLocaleString():""} คำทั้งหมดในไฟล์</p></section>
<section class="panel"><h3 class="section-title">ข้อมูลการฝึก</h3><button class="secondary" onclick="resetData()">รีเซ็ตสถิติและความจำ</button></section>`}
function setThemePref(x){state.theme=x;save();render()}
function resetData(){if(confirm("ลบสถิติ ความจำ และแผนฝึกในเครื่องนี้ทั้งหมด?")){localStorage.removeItem(KEY);state=loadState();render()}}
function go(page){state.page=page;save();render()}
function toggleTheme(){state.theme=state.theme==="dark"?"light":"dark";save();render()}
function autoWizard(){
 const modal=document.createElement("div");modal.className="modal-backdrop";modal.innerHTML=`<div class="modal"><h2>✨ เลือกให้ฉัน</h2>
 <div class="section-title">วันนี้มีเวลาเท่าไร?</div><div class="choice-grid" id="aw-time">${["10 นาที","20 นาที","30 นาที","1 ชั่วโมง","2 ชั่วโมง+"].map(x=>`<button class="choice" onclick="awPick(this,'time')">${x}</button>`).join("")}</div>
 <div class="section-title" style="margin-top:20px">วันนี้อยากฝึกแบบไหน?</div><div class="choice-grid" id="aw-style">${["ชิล ๆ","ปกติ","จริงจัง","ท้าทายตัวเอง"].map(x=>`<button class="choice" onclick="awPick(this,'style')">${x}</button>`).join("")}</div>
 <div class="section-title" style="margin-top:20px">วันนี้อยากเน้นอะไร?</div><div class="choice-grid" id="aw-focus">${["ศัพท์ใหม่","จำศัพท์เก่า","Anagram","Letters ที่อ่อน","ทุกอย่าง"].map(x=>`<button class="choice" onclick="awPick(this,'focus')">${x}</button>`).join("")}</div>
 <div class="actions"><button class="secondary" onclick="this.closest('.modal-backdrop').remove()">ยกเลิก</button><button class="primary" onclick="finishWizard(this)">สร้าง Daily Plan</button></div></div>`;
 document.body.appendChild(modal)
}
const aw={};
function awPick(btn,k){document.querySelectorAll(`#aw-${k} .choice`).forEach(x=>x.classList.remove("active"));btn.classList.add("active");aw[k]=btn.textContent.trim()}
function finishWizard(btn){
 let id="steady";
 if(aw.time==="10 นาที")id="speed";else if(aw.time==="2 ชั่วโมง+")id="full";else if(aw.time==="1 ชั่วโมง")id=aw.style==="ชิล ๆ"?"marathon":"full";else if(aw.style==="ชิล ๆ")id="chill";else if(aw.style==="จริงจัง")id="marathon";else if(aw.style==="ท้าทายตัวเอง")id="challenge";
 if(aw.focus==="จำศัพท์เก่า")id="review";if(aw.focus==="Anagram")state.types=["Anagram","Letter → Word"];if(aw.focus==="Letters ที่อ่อน")id="letters";
 state.mode=id;state.selectedMode=id;state.page="practice";save();btn.closest(".modal-backdrop").remove();state.toast=`สร้างแผน ${modeById(id).name} ให้แล้ว`;render()
}
window.addEventListener("load",()=>{state.page=state.page||"home";state.letters=state.letters?.length?state.letters:LETTERS;render()});
window.go=go;window.chooseMode=chooseMode;window.setCount=setCount;window.setCustomCount=setCustomCount;window.toggleLetter=toggleLetter;window.selectAllLetters=selectAllLetters;window.toggleType=toggleType;window.startSession=startSession;window.submitAnswer=submitAnswer;window.skipAnswer=skipAnswer;window.startReview=startReview;window.completeCheck=completeCheck;window.setThemePref=setThemePref;window.resetData=resetData;window.toggleTheme=toggleTheme;window.autoWizard=autoWizard;window.awPick=awPick;window.finishWizard=finishWizard;
