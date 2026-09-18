const KEY="scrabble-note-v1";
const now=()=>new Date().toISOString();
const uid=()=>Math.random().toString(36).slice(2)+Date.now().toString(36);
const demo={notes:[
{id:uid(),title:"Scrabble — Useful 7 Letter Words",body:"Example notes\\n\\n• words that use common hooks\\n• keep difficult anagrams here\\n• add meanings and mnemonics",tags:["scrabble","7-letter"],favorite:true,deleted:false,created:now(),updated:now()},
{id:uid(),title:"Q / Z / X Words",body:"Q words:\\n- QUEEN\\n- QUA...\\n\\nAdd your own discoveries while studying.",tags:["letters"],favorite:false,deleted:false,created:now(),updated:now()}
],words:[
{word:"QUEEN",meaning:"ราชินี",score:14,tags:"Q"},
{word:"QUIZ",meaning:"แบบทดสอบ",score:23,tags:"Q Z"},
{word:"JAZZ",meaning:"ดนตรีแจ๊ซ",score:29,tags:"J Z"},
{word:"OX",meaning:"วัวตัวผู้",score:9,tags:"X"},
{word:"BOX",meaning:"กล่อง",score:12,tags:"X"}
],tasks:[
{id:uid(),date:new Date().toISOString().slice(0,10),text:"ทบทวนคำ 20 คำ",done:false},
{id:uid(),date:new Date(Date.now()+864e5).toISOString().slice(0,10),text:"เพิ่มคำศัพท์ Q / Z",done:false}
]};
let state=JSON.parse(localStorage.getItem(KEY)||"null")||demo;
let selected=state.notes.find(n=>!n.deleted)?.id||null, view="notes", filter="all", query="";
const save=()=>{localStorage.setItem(KEY,JSON.stringify(state));document.querySelector("#saveState").textContent="Saved • "+new Date().toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit"});};
const toast=(s)=>{let t=document.querySelector("#toast");t.textContent=s;t.classList.add("show");clearTimeout(window.tt);window.tt=setTimeout(()=>t.classList.remove("show"),1500)};
function escape(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function renderNotes(){
 const list=document.querySelector("#noteList"); let ns=state.notes.filter(n=>!n.deleted && (filter==="all"||n.tags.includes(filter)) && ((n.title+" "+n.body+" "+n.tags.join(" ")).toLowerCase().includes(query.toLowerCase())));
 const sort=document.querySelector("#sortSelect").value; ns.sort((a,b)=>sort==="az"?a.title.localeCompare(b.title):sort==="created"?b.created.localeCompare(a.created):b.updated.localeCompare(a.updated));
 list.innerHTML=ns.map(n=>`<div class="note-card ${n.id===selected?"selected":""}" data-id="${n.id}"><h3>${escape(n.favorite?"☆ ":"")}${escape(n.title||"Untitled")}</h3><p>${escape(n.body.replace(/\n/g," "))}</p><div class="meta">${new Date(n.updated).toLocaleString("th-TH",{dateStyle:"medium",timeStyle:"short"})}</div></div>`).join("")||`<div style="padding:20px;color:#9299a2;font-size:12px">ยังไม่มีโน้ต</div>`;
 list.querySelectorAll(".note-card").forEach(x=>x.onclick=()=>{selected=x.dataset.id;renderNotes();renderEditor()});
 const tags=[...new Set(state.notes.filter(n=>!n.deleted).flatMap(n=>n.tags))];
 document.querySelector("#tagFilters").innerHTML=`<button class="chip ${filter==="all"?"active":""}" data-tag="all">All</button>`+tags.map(t=>`<button class="chip ${filter===t?"active":""}" data-tag="${escape(t)}">${escape(t)}</button>`).join("");
 document.querySelectorAll("[data-tag]").forEach(x=>x.onclick=()=>{filter=x.dataset.tag;renderNotes()});
}
function renderEditor(){
 const n=state.notes.find(x=>x.id===selected&&!x.deleted), e=document.querySelector("#editor");
 if(!n){e.innerHTML='<div class="empty-editor">เลือกโน้ตเพื่อเริ่มจด หรือกด <b>New Note</b></div>';return}
 e.innerHTML=`<div class="editor-head"><input class="title-input" id="title" value="${escape(n.title)}"><button class="icon-btn" id="fav">${n.favorite?"★":"☆"}</button><button class="icon-btn" id="del">⌫</button></div><div class="editor-body"><textarea id="body" placeholder="Start writing...">${escape(n.body)}</textarea></div><div class="editor-foot"><div>Tags: <input class="tag-input" id="tags" value="${escape(n.tags.join(", "))}" placeholder="scrabble, hooks, Q"></div><span id="wordCountEditor">${n.body.trim()?n.body.trim().split(/\s+/).length:0} words • Autosave</span></div>`;
 const update=()=>{n.title=document.querySelector("#title").value;n.body=document.querySelector("#body").value;n.tags=document.querySelector("#tags").value.split(",").map(x=>x.trim()).filter(Boolean);n.updated=now();save();document.querySelector("#wordCountEditor").textContent=`${n.body.trim()?n.body.trim().split(/\\s+/).length:0} words • Autosave`};
 ["title","body","tags"].forEach(id=>document.querySelector("#"+id).addEventListener("input",()=>{clearTimeout(window.st);window.st=setTimeout(()=>{update();renderNotes()},250)}));
 document.querySelector("#fav").onclick=()=>{n.favorite=!n.favorite;save();renderEditor();renderNotes()};
 document.querySelector("#del").onclick=()=>{n.deleted=true;selected=state.notes.find(x=>!x.deleted)?.id||null;save();renderNotes();renderEditor();toast("Moved to Trash")};
}
function newNote(){let n={id:uid(),title:"Untitled Note",body:"",tags:[],favorite:false,deleted:false,created:now(),updated:now()};state.notes.unshift(n);selected=n.id;save();switchView("notes");renderNotes();renderEditor();setTimeout(()=>document.querySelector("#title")?.focus(),50)}
function renderWords(){
 let ws=state.words.filter(w=>(w.word+" "+w.meaning+" "+w.tags).toLowerCase().includes(query.toLowerCase())).sort((a,b)=>a.word.localeCompare(b.word));
 document.querySelector("#wordCount").textContent=state.words.length;document.querySelector("#letterCount").textContent=state.words.reduce((a,w)=>a+w.word.length,0);document.querySelector("#pointsCount").textContent=state.words.reduce((a,w)=>a+w.score,0);
 document.querySelector("#wordTable").innerHTML=`<div class="word-row head"><span>WORD</span><span>MEANING</span><span>POINTS</span><span>TAGS</span><span></span></div>`+ws.map((w,i)=>`<div class="word-row"><span class="word">${escape(w.word)}</span><span>${escape(w.meaning)}</span><span class="score">${w.score}</span><span>${escape(w.tags)}</span><button onclick="removeWord(${state.words.indexOf(w)})">×</button></div>`).join("");
}
window.removeWord=i=>{state.words.splice(i,1);save();renderWords()};
function addWord(){let word=prompt("Word (ตัวพิมพ์ใหญ่):");if(!word)return;word=word.trim().toUpperCase();let meaning=prompt("Meaning / ความหมาย:")||"";let score=prompt("Tile points:", "0");state.words.push({word,meaning,score:Number(score)||0,tags:""});save();renderWords();toast("Added word")}
function renderPlanner(){
 let dates=[...Array(7)].map((_,i)=>{let d=new Date(Date.now()+i*864e5);return d.toISOString().slice(0,10)});
 document.querySelector("#planner").innerHTML=dates.map(d=>`<div class="day"><h3>${new Date(d+"T12:00:00").toLocaleDateString("th-TH",{weekday:"long",day:"numeric",month:"short"})}</h3>${state.tasks.filter(t=>t.date===d).map(t=>`<div class="task ${t.done?"done":""}"><input type="checkbox" ${t.done?"checked":""} onchange="toggleTask('${t.id}')"><span>${escape(t.text)}</span><button onclick="deleteTask('${t.id}')">×</button></div>`).join("")||'<div style="font-size:11px;color:#a0a6ae">No tasks</div>'}</div>`).join("");
}
window.toggleTask=id=>{let t=state.tasks.find(x=>x.id===id);t.done=!t.done;save();renderPlanner()};
window.deleteTask=id=>{state.tasks=state.tasks.filter(x=>x.id!==id);save();renderPlanner()};
function addTask(){let text=prompt("Task:");if(!text)return;let date=prompt("Date (YYYY-MM-DD):",new Date().toISOString().slice(0,10));if(!date)return;state.tasks.push({id:uid(),date,text,done:false});save();renderPlanner()}
function renderGrid(target,deleted=false){let ns=state.notes.filter(n=>n.deleted===deleted && (!deleted?n.favorite:true));document.querySelector(target).innerHTML=ns.map(n=>`<div class="grid-card"><h3>${escape(n.title)}</h3><p>${escape(n.body)}</p><button onclick="openNote('${n.id}')">Open</button>${deleted?`<button onclick="restore('${n.id}')">Restore</button><button onclick="purge('${n.id}')">Delete forever</button>`:""}</div>`).join("")||'<div style="color:#9299a2;font-size:12px">ไม่มีรายการ</div>'}
window.openNote=id=>{selected=id;switchView("notes");renderNotes();renderEditor()};
window.restore=id=>{let n=state.notes.find(x=>x.id===id);n.deleted=false;n.updated=now();save();renderGrid("#trashList",true)};
window.purge=id=>{state.notes=state.notes.filter(x=>x.id!==id);save();renderGrid("#trashList",true)};
function switchView(v){view=v;document.querySelectorAll(".view").forEach(x=>x.classList.add("hidden"));document.querySelector("#"+v+"View").classList.remove("hidden");document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.view===v));let names={notes:["Notes","Capture words, ideas and game notes."],words:["Word Bank","คลังคำศัพท์สำหรับ Scrabble"],planner:["Planner","วางแผนการฝึกคำศัพท์"],favorites:["Favorites","โน้ตที่ปักหมุดไว้"],trash:["Trash","โน้ตที่ลบแล้ว"]};document.querySelector("#viewTitle").textContent=names[v][0];document.querySelector("#viewSub").textContent=names[v][1];if(v==="notes"){renderNotes();renderEditor()}if(v==="words")renderWords();if(v==="planner")renderPlanner();if(v==="favorites")renderGrid("#favoriteList");if(v==="trash")renderGrid("#trashList",true)}
document.querySelectorAll(".nav").forEach(x=>x.onclick=()=>switchView(x.dataset.view));
document.querySelector("#newNote").onclick=newNote;document.querySelector("#addWord").onclick=addWord;document.querySelector("#addTask").onclick=addTask;document.querySelector("#sortSelect").onchange=renderNotes;
document.querySelector("#globalSearch").oninput=e=>{query=e.target.value;if(view==="notes")renderNotes();if(view==="words")renderWords()};
document.querySelector("#exportBtn").onclick=()=>{let a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:"application/json"}));a.download="scrabble-note-backup.json";a.click();toast("Exported backup")};
document.querySelector("#importInput").onchange=e=>{let f=e.target.files[0];if(!f)return;let r=new FileReader();r.onload=()=>{try{state=JSON.parse(r.result);selected=state.notes.find(n=>!n.deleted)?.id||null;save();switchView("notes");toast("Imported")}catch{toast("Invalid JSON")}};r.readAsText(f)};
document.querySelector("#clearBtn").onclick=()=>{if(confirm("Reset all local data to demo data?")){state=JSON.parse(JSON.stringify(demo));save();selected=state.notes[0].id;switchView("notes")}};
document.querySelector("#themeBtn").onclick=()=>{document.body.classList.toggle("dark");localStorage.setItem("scrabble-dark",document.body.classList.contains("dark"))};
if(localStorage.getItem("scrabble-dark")==="true")document.body.classList.add("dark");
save();switchView("notes");