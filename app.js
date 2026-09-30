const STORAGE_KEY = 'flowpilot-tasks-v1';
const ACTIVITY_KEY = 'flowpilot-activity-v1';

const seedTasks = [
  {id:'t1',title:'Avalehe kujunduse kinnitamine',description:'Vaata üle uus avalehe prototüüp ja kinnita visuaalne suund.',assignee:'Mari-Liis',deadline:'2026-09-30',priority:'high',status:'progress',dependency:''},
  {id:'t2',title:'Kasutajate autentimine',description:'Lisa turvaline sisselogimine ja registreerimine.',assignee:'Karl',deadline:'2026-10-02',priority:'high',status:'todo',dependency:'t5'},
  {id:'t3',title:'Mobiilivaate testimine',description:'Kontrolli peamisi vaateid telefonis ja tahvelarvutis.',assignee:'Anna',deadline:'2026-10-03',priority:'medium',status:'todo',dependency:'t1'},
  {id:'t4',title:'Andmebaasi skeemi uuendamine',description:'Lisa ülesannete sõltuvuste ja kommentaaride väljad.',assignee:'Rasmus',deadline:'2026-09-29',priority:'high',status:'blocked',dependency:'t5'},
  {id:'t5',title:'API dokumentatsiooni täiendamine',description:'Kirjelda autentimise ja projektide endpointid.',assignee:'Liisa',deadline:'2026-09-28',priority:'medium',status:'done',dependency:''},
  {id:'t6',title:'Kliendi tagasiside koondamine',description:'Koonda intervjuude märkmed üheks kokkuvõtteks.',assignee:'Mari-Liis',deadline:'2026-10-05',priority:'low',status:'progress',dependency:''},
  {id:'t7',title:'E-posti teavitused',description:'Saada kasutajale tähtaja ja määramise teavitused.',assignee:'Karl',deadline:'2026-10-07',priority:'medium',status:'todo',dependency:'t2'},
  {id:'t8',title:'Disainisüsteemi komponendid',description:'Nupud, väljad ja olekute märgised.',assignee:'Anna',deadline:'2026-09-27',priority:'low',status:'done',dependency:''}
];

let tasks = load(STORAGE_KEY, seedTasks);
let activities = load(ACTIVITY_KEY, [
  {icon:'✓',text:'Anna lõpetas ülesande “Disainisüsteemi komponendid”',time:'2 tundi tagasi'},
  {icon:'↻',text:'Karl liigutas ülesande “Kasutajate autentimine” backlog’i',time:'4 tundi tagasi'},
  {icon:'+',text:'Mari-Liis lisas ülesande “Kliendi tagasiside koondamine”',time:'Eile'}
]);
let mockupVersions = load('flowpilot-mockups-v1', []);
let activeMockup = mockupVersions.length ? mockupVersions.length - 1 : -1;

const statusMeta = {todo:{label:'Teha',color:'#8a8f9f'},progress:{label:'Töös',color:'#4d8df7'},done:{label:'Valmis',color:'#2eb67d'},blocked:{label:'Blokeeritud',color:'#ed5a6a'}};
const priorityMeta = {high:'Kõrge',medium:'Keskmine',low:'Madal'};
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

function load(key, fallback){try{return JSON.parse(localStorage.getItem(key)) || structuredClone(fallback)}catch{return structuredClone(fallback)}}
function persist(){localStorage.setItem(STORAGE_KEY,JSON.stringify(tasks));localStorage.setItem(ACTIVITY_KEY,JSON.stringify(activities))}
function escapeHtml(value=''){const div=document.createElement('div');div.textContent=value;return div.innerHTML}
function initials(name){return name.split(/[- ]/).map(n=>n[0]).join('').slice(0,2).toUpperCase()}
function formatDate(value){if(!value)return '—';return new Intl.DateTimeFormat('et-EE',{day:'numeric',month:'short'}).format(new Date(value+'T12:00:00'))}
function daysUntil(value){const today=new Date();today.setHours(0,0,0,0);return Math.ceil((new Date(value+'T12:00:00')-today)/86400000)}
function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2500)}

function filteredTasks(){const q=($('#taskSearch').value || $('#globalSearch').value).toLowerCase().trim();const status=$('#statusFilter').value;const priority=$('#priorityFilter').value;return tasks.filter(t=>(!q || `${t.title} ${t.description} ${t.assignee}`.toLowerCase().includes(q))&&(status==='all'||t.status===status)&&(priority==='all'||t.priority===priority))}

function render(){
  const counts=Object.fromEntries(Object.keys(statusMeta).map(s=>[s,tasks.filter(t=>t.status===s).length]));
  const percent=tasks.length?Math.round(counts.done/tasks.length*100):0;
  $('#navTaskCount').textContent=tasks.length;$('#todoStat').textContent=counts.todo;$('#progressStat').textContent=counts.progress;$('#doneStat').textContent=counts.done;$('#blockedStat').textContent=counts.blocked;$('#completionStat').textContent=`${percent}% lõpetatud`;
  $('#sprintPercent').textContent=`${percent}%`;$('#sprintDonut').style.background=`conic-gradient(var(--green) ${percent}%,#edf0f5 ${percent}%)`;$('#legendDone').textContent=counts.done;$('#legendProgress').textContent=counts.progress;$('#legendTodo').textContent=counts.todo;
  renderCompact();renderTable();renderKanban();renderSuggestions();renderActivities();renderMockupSources();
}

function renderMockupSources(){
  const select=$('#mockupTask');if(!select)return;const selected=select.value;
  select.innerHTML='<option value="">Uus idee (ilma ülesandeta)</option>'+tasks.filter(t=>t.status!=='done').map(t=>`<option value="${t.id}">${escapeHtml(t.title)}</option>`).join('');
  if(tasks.some(t=>t.id===selected))select.value=selected;
}

function mockupDocument(prompt){
  const p=prompt.toLowerCase();const isLogin=/login|sisselog|autent|registreer/.test(p);const isPricing=/hind|pricing|pakett|tellimus/.test(p);const accent=/rohe|green/.test(p)?'#16a66a':/sinine|blue/.test(p)?'#2777e8':/oran|orange/.test(p)?'#f0783c':'#6957e8';
  let body='';
  if(isLogin)body=`<main class="auth"><section class="hero"><span class="logo">N</span><h1>Tööta targemalt.<br>Saavuta rohkem.</h1><p>Kõik sinu projektid, ülesanded ja meeskond ühes rahulikus töökeskkonnas.</p><div class="quote">“Meie meeskonna fookus paranes juba esimesel nädalal.”</div></section><section class="form"><div><small>TERE TULEMAST</small><h2>Logi oma kontole</h2><p>Jätka sealt, kus viimati pooleli jäid.</p><label>E-posti aadress<input placeholder="nimi@ettevote.ee"></label><label>Parool<input type="password" placeholder="••••••••"></label><button class="primary">Logi sisse</button><button class="outline">G &nbsp; Jätka Google’iga</button><p class="center">Pole veel kontot? <b>Loo konto</b></p></div></section></main>`;
  else if(isPricing)body=`<nav><b><span class="logo">F</span> Finora</b><div>Funktsioonid &nbsp;&nbsp; Lahendused &nbsp;&nbsp; Meist</div><button>Logi sisse</button></nav><main class="pricing"><small>LIHTNE HINNASTAMINE</small><h1>Vali plaan, mis kasvab sinuga</h1><p>Alusta tasuta ja uuenda siis, kui meeskond vajab rohkem.</p><section class="plans"><article><h3>Starter</h3><strong>€0<small>/kuu</small></strong><p>Ideaalne alustamiseks</p><button>Alusta tasuta</button><ul><li>✓ Kuni 3 projekti</li><li>✓ 5 meeskonnaliiget</li><li>✓ Põhiraportid</li></ul></article><article class="featured"><em>POPULAARSEIM</em><h3>Professional</h3><strong>€19<small>/kuu</small></strong><p>Kasvavale meeskonnale</p><button>Proovi 14 päeva</button><ul><li>✓ Piiramatud projektid</li><li>✓ AI soovitused</li><li>✓ Täpsem analüütika</li></ul></article><article><h3>Enterprise</h3><strong>Räägime</strong><p>Suurele organisatsioonile</p><button>Võta ühendust</button><ul><li>✓ SSO ja auditilogid</li><li>✓ Isiklik tugi</li><li>✓ Kohandatud rollid</li></ul></article></section></main>`;
  else body=`<aside><span class="logo">P</span><b>Pulse</b><a class="active">⌂ Ülevaade</a><a>▥ Analüütika</a><a>✓ Ülesanded</a><a>♙ Meeskond</a><a>⚙ Seaded</a></aside><main class="dash"><header><div><small>30. SEPTEMBER</small><h1>Ülevaade</h1></div><button class="primary">＋ Uus raport</button></header><section class="metrics"><article><span>KÄIVE</span><strong>€48,290</strong><b>↑ 12.5%</b></article><article><span>AKTIIVSED KASUTAJAD</span><strong>2,846</strong><b>↑ 8.2%</b></article><article><span>KONVERSIOON</span><strong>4.8%</strong><b>↑ 1.1%</b></article></section><section class="chart"><h3>Nädala tulemus</h3><div class="bars">${[42,65,52,78,67,90,74].map((h,i)=>`<i style="height:${h}%"><small>${['E','T','K','N','R','L','P'][i]}</small></i>`).join('')}</div></section><section class="recent"><h3>Viimased projektid</h3><p><b>Veebiplatvorm</b><span>76% valmis</span></p><p><b>Mobiilirakendus</b><span>42% valmis</span></p><p><b>Brändiuuendus</b><span>91% valmis</span></p></section></main>`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>*{box-sizing:border-box}body{margin:0;font-family:Inter,Arial;color:#202334;background:#f5f6fa}button{font:inherit;cursor:pointer;border:0;border-radius:9px;padding:11px 18px;font-weight:700}.primary{background:${accent};color:#fff}.logo{display:inline-grid;place-items:center;width:34px;height:34px;background:${accent};color:#fff;border-radius:10px;font-weight:800}nav{height:68px;padding:0 7%;display:flex;align-items:center;justify-content:space-between;background:#fff}nav b{display:flex;align-items:center;gap:10px}.auth{min-height:100vh;display:grid;grid-template-columns:1.1fr 1fr}.hero{padding:11%;background:linear-gradient(145deg,${accent},#292062);color:#fff;display:flex;flex-direction:column;justify-content:center}.hero h1{font-size:46px;margin:55px 0 15px}.hero p{line-height:1.7;max-width:480px;color:#ffffffcc}.quote{margin-top:65px;padding:22px;background:#ffffff14;border:1px solid #ffffff25;border-radius:14px}.form{background:#fff;display:grid;place-items:center;padding:40px}.form>div{width:min(390px,100%)}.form h2{font-size:30px;margin:10px 0}.form>div>p{color:#7c8090}.form label{display:block;font-size:12px;font-weight:700;margin-top:20px}.form input{display:block;width:100%;margin-top:7px;border:1px solid #dfe1e9;border-radius:9px;padding:13px}.form button{width:100%;margin-top:14px}.outline{background:#fff;border:1px solid #dfe1e9}.center{text-align:center;font-size:12px}.pricing{text-align:center;padding:70px 6%}.pricing h1{font-size:43px;margin:10px}.pricing>p{color:#777b8d}.plans{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;max-width:1000px;margin:55px auto}.plans article{position:relative;text-align:left;background:#fff;border:1px solid #e3e5ec;border-radius:16px;padding:28px}.plans article.featured{border:2px solid ${accent};transform:translateY(-12px)}.plans em{position:absolute;right:15px;top:15px;font-size:9px;color:${accent}}.plans strong{display:block;font-size:30px;margin:25px 0 5px}.plans strong small{font-size:12px;color:#888}.plans button{width:100%;margin:18px 0;background:${accent};color:#fff}.plans ul{list-style:none;padding:0;line-height:2;color:#656979;font-size:13px}body>aside{position:fixed;width:190px;inset:0 auto 0 0;background:#171a2a;color:#fff;padding:25px 18px}body>aside b{margin-left:8px}body>aside a{display:block;color:#9da1b4;padding:12px;margin-top:8px;border-radius:8px;font-size:13px}body>aside a:first-of-type{margin-top:45px}body>aside a.active{background:#292d42;color:#fff}.dash{margin-left:190px;padding:32px}.dash header{display:flex;justify-content:space-between;align-items:center}.dash h1{margin:5px 0}.dash small{color:#858a9d}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:28px 0}.metrics article,.chart,.recent{background:#fff;border:1px solid #e7e8ef;border-radius:14px;padding:20px}.metrics span{display:block;color:#838899;font-size:10px}.metrics strong{font-size:27px;display:inline-block;margin-top:14px}.metrics b{color:#16a66a;font-size:10px;float:right;margin-top:25px}.chart{height:290px}.bars{height:210px;display:flex;align-items:flex-end;gap:6%;padding:20px}.bars i{position:relative;width:8%;background:linear-gradient(${accent},${accent}99);border-radius:7px 7px 2px 2px}.bars small{position:absolute;bottom:-20px;left:40%;font-style:normal}.recent{margin-top:14px}.recent p{border-top:1px solid #eee;padding:13px 0;margin:0;font-size:13px}.recent span{float:right;color:#777}@media(max-width:650px){.auth{grid-template-columns:1fr}.hero{display:none}.plans{grid-template-columns:1fr}.plans article.featured{transform:none}body>aside{display:none}.dash{margin:0;padding:18px}.metrics{grid-template-columns:1fr}.pricing h1{font-size:30px}nav div{display:none}}</style></head><body>${body}<script>document.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{b.dataset.old=b.textContent;b.textContent='✓ Toimib!';setTimeout(()=>b.textContent=b.dataset.old,900)}));<\/script></body></html>`;
}

function showMockup(index){activeMockup=index;const version=mockupVersions[index];if(!version)return;$('#mockupFrame').srcdoc=version.html;$('#mockupFrame').classList.remove('hidden');$('#previewEmpty').classList.add('hidden');$('#iterationBox').classList.remove('hidden');$('#versionCount').textContent=mockupVersions.length;$('#versionList').innerHTML=mockupVersions.map((v,i)=>`<button class="version-item ${i===index?'active':''}" data-version="${i}"><span class="version-number">v${i+1}</span><span><b>${escapeHtml(v.title)}</b><small>${escapeHtml(v.time)}</small></span></button>`).reverse().join('');}
function createMockup(refinement=''){
  let prompt=$('#mockupPrompt').value.trim();const task=tasks.find(t=>t.id===$('#mockupTask').value);if(!prompt&&task)prompt=`${task.title}. ${task.description}`;if(!prompt){toast('Kirjelda esmalt soovitud vaadet');$('#mockupPrompt').focus();return}const combined=refinement?`${prompt}. Täpsustus: ${refinement}`:prompt;const version={title:refinement||task?.title||prompt.slice(0,42),prompt:combined,html:mockupDocument(combined),time:new Date().toLocaleTimeString('et-EE',{hour:'2-digit',minute:'2-digit'})};mockupVersions.push(version);localStorage.setItem('flowpilot-mockups-v1',JSON.stringify(mockupVersions));showMockup(mockupVersions.length-1);toast(refinement?'Mockup uuendatud':'Live-mockup genereeritud');
}

function renderCompact(){
  const mine=tasks.filter(t=>t.assignee==='Mari-Liis'&&t.status!=='done').sort((a,b)=>a.deadline.localeCompare(b.deadline)).slice(0,4);
  $('#myTasks').innerHTML=mine.length?mine.map(t=>`<div class="compact-task"><button class="check" data-complete="${t.id}" title="Märgi tehtuks"></button><div class="task-copy"><b>${escapeHtml(t.title)}</b><small>${escapeHtml(t.assignee)}</small></div><span class="priority ${t.priority}">${priorityMeta[t.priority]}</span><span class="date">${formatDate(t.deadline)}</span></div>`).join(''):'<div class="empty-state"><b>Kõik tehtud!</b><p>Sul ei ole aktiivseid ülesandeid.</p></div>';
}

function renderTable(){
  const list=filteredTasks();$('#emptyTasks').classList.toggle('hidden',!!list.length);
  $('#taskTable').innerHTML=list.map(t=>`<div class="task-row" data-edit="${t.id}"><div class="task-row-title"><b>${escapeHtml(t.title)}</b><small>${escapeHtml(t.description)}</small></div><div class="assignee-cell"><span class="mini-avatar">${initials(t.assignee)}</span>${escapeHtml(t.assignee)}</div><span>${formatDate(t.deadline)}</span><span class="priority ${t.priority}">${priorityMeta[t.priority]}</span><span class="task-status ${t.status}">${statusMeta[t.status].label}</span><button class="more-button" aria-label="Muuda">•••</button></div>`).join('');
}

function renderKanban(){
  $('#kanbanBoard').innerHTML=Object.entries(statusMeta).map(([status,meta])=>{const list=tasks.filter(t=>t.status===status);return `<section class="kanban-column"><div class="kanban-heading"><i style="background:${meta.color}"></i><b>${meta.label}</b><span>${list.length}</span></div>${list.map(t=>`<article class="kanban-card" data-edit="${t.id}"><span class="priority ${t.priority}">${priorityMeta[t.priority]}</span><h3>${escapeHtml(t.title)}</h3><p>${escapeHtml(t.description)}</p><div class="kanban-meta"><span class="mini-avatar">${initials(t.assignee)}</span><span>${formatDate(t.deadline)}</span></div>${t.dependency?`<div class="dependency">⌁ Sõltub: ${escapeHtml(tasks.find(x=>x.id===t.dependency)?.title||'eemaldatud ülesanne')}</div>`:''}</article>`).join('')||'<div class="empty-state"><p>Siin pole ülesandeid</p></div>'}</section>`}).join('');
}

function getSuggestions(){
  const today=new Date();today.setHours(0,0,0,0);const overdue=tasks.filter(t=>t.status!=='done'&&new Date(t.deadline+'T23:59:00')<today);const blocked=tasks.filter(t=>t.status==='blocked');const highTodo=tasks.filter(t=>t.priority==='high'&&t.status==='todo');const workload=Object.entries(tasks.filter(t=>t.status!=='done').reduce((a,t)=>({...a,[t.assignee]:(a[t.assignee]||0)+1}),{})).sort((a,b)=>b[1]-a[1])[0];
  return [
    {type:'risk',icon:'!',color:'red',title:overdue.length?`${overdue.length} ülesannet on tähtaja ületanud`:'Tähtajad on kontrolli all',text:overdue.length?`Vaata üle: ${overdue.map(t=>t.title).join(', ')}. Soovitan määrata uued realistlikud tähtajad.`:'Ühelgi aktiivsel ülesandel pole möödunud tähtaega.',action:'Vaata ülesandeid',view:'tasks'},
    {type:'block',icon:'⌁',color:'purple',title:blocked.length?`${blocked.length} blokeeringut vajab lahendamist`:'Blokeeringuid ei ole',text:blocked.length?`Prioriseeri “${blocked[0].title}”. ${blocked[0].dependency?'Selle sõltuvus on juba märgitud.':'Lisa blokeeringu põhjus või sõltuvus.'}`:'Töövoog on hetkel blokeeringuteta.',action:'Ava backlog',view:'backlog'},
    {type:'priority',icon:'↑',color:'blue',title:highTodo.length?'Kõrge prioriteediga töö ootab':'Prioriteedid on tasakaalus',text:highTodo.length?`Võta järgmisena töösse “${highTodo[0].title}”, et vähendada projekti peamist riski.`:'Kõik kõrge prioriteediga ülesanded on töös või valmis.',action:'Vaata ülesandeid',view:'tasks'},
    {type:'load',icon:'♙',color:'green',title:'Meeskonna koormus',text:workload?`${workload[0]} vastutab ${workload[1]} aktiivse ülesande eest. ${workload[1]>3?'Kaalu osa töö ümberjagamist.':'Koormus tundub mõistlik.'}`:'Aktiivseid ülesandeid pole.',action:'Ava backlog',view:'backlog'}
  ];
}

function renderSuggestions(){
  const suggestions=getSuggestions();$('#suggestions').innerHTML=suggestions.map(s=>`<article class="panel suggestion-card"><div class="suggestion-top"><span class="suggestion-icon ${s.color}">${s.icon}</span><span class="status-pill">AI analüüs</span></div><h2>${s.title}</h2><p>${s.text}</p><footer><small>Põhineb projekti hetkeseisul</small><button class="text-button" data-go="${s.view}">${s.action} →</button></footer></article>`).join('');
  const concern=suggestions.find(s=>s.type==='risk');$('#aiHeadline').textContent=concern.title;$('#aiSummary').textContent=concern.text;$('#suggestionDot').style.display=tasks.some(t=>t.status==='blocked')?'block':'none';
}

function renderActivities(){$('#activityList').innerHTML=activities.slice(0,5).map(a=>`<div class="activity"><span class="activity-icon">${a.icon}</span><p>${escapeHtml(a.text)}</p><time>${a.time}</time></div>`).join('')}

function navigate(view){$$('.view').forEach(v=>v.classList.remove('active'));$$('.nav-item').forEach(n=>n.classList.toggle('active',n.dataset.view===view));$(`#${view}View`).classList.add('active');window.scrollTo({top:0,behavior:'smooth'})}
function fillDependencies(exclude=''){const select=$('#dependencyInput');select.innerHTML='<option value="">Sõltuvus puudub</option>'+tasks.filter(t=>t.id!==exclude).map(t=>`<option value="${t.id}">${escapeHtml(t.title)}</option>`).join('')}
function openTask(id=''){
  const t=tasks.find(x=>x.id===id);fillDependencies(id);$('#taskForm').reset();$('#taskId').value=id;$('#dialogTitle').textContent=t?'Muuda ülesannet':'Lisa uus ülesanne';$('#deleteTask').classList.toggle('hidden',!t);
  if(t){$('#titleInput').value=t.title;$('#descriptionInput').value=t.description;$('#assigneeInput').value=t.assignee;$('#deadlineInput').value=t.deadline;$('#priorityInput').value=t.priority;$('#statusInput').value=t.status;$('#dependencyInput').value=t.dependency||''}else{$('#deadlineInput').value=new Date(Date.now()+3*86400000).toISOString().slice(0,10)}
  $('#taskDialog').showModal();setTimeout(()=>$('#titleInput').focus(),50)
}
function closeTask(){$('#taskDialog').close()}
function addActivity(text,icon='+'){activities.unshift({icon,text,time:'Just praegu'});activities=activities.slice(0,12)}

$('#taskForm').addEventListener('submit',e=>{e.preventDefault();const id=$('#taskId').value;const data={id:id||`t${Date.now()}`,title:$('#titleInput').value.trim(),description:$('#descriptionInput').value.trim(),assignee:$('#assigneeInput').value,deadline:$('#deadlineInput').value,priority:$('#priorityInput').value,status:$('#statusInput').value,dependency:$('#dependencyInput').value};if(id){tasks=tasks.map(t=>t.id===id?data:t);addActivity(`Mari-Liis muutis ülesannet “${data.title}”`,'↻')}else{tasks.unshift(data);addActivity(`Mari-Liis lisas ülesande “${data.title}”`)}persist();render();closeTask();toast(id?'Ülesanne uuendatud':'Ülesanne lisatud')});
$('#deleteTask').addEventListener('click',()=>{const id=$('#taskId').value;const task=tasks.find(t=>t.id===id);if(!task||!confirm(`Kas kustutada “${task.title}”?`))return;tasks=tasks.filter(t=>t.id!==id).map(t=>t.dependency===id?{...t,dependency:''}:t);addActivity(`Mari-Liis kustutas ülesande “${task.title}”`,'×');persist();render();closeTask();toast('Ülesanne kustutatud')});
document.addEventListener('click',e=>{const nav=e.target.closest('[data-view]');const go=e.target.closest('[data-go]');const edit=e.target.closest('[data-edit]');const complete=e.target.closest('[data-complete]');if(nav)navigate(nav.dataset.view);if(go)navigate(go.dataset.go);if(edit)openTask(edit.dataset.edit);if(complete){e.stopPropagation();const t=tasks.find(x=>x.id===complete.dataset.complete);t.status='done';addActivity(`${t.assignee} lõpetas ülesande “${t.title}”`,'✓');persist();render();toast('Ülesanne märgitud tehtuks')}});
$$('.add-task').forEach(b=>b.addEventListener('click',()=>openTask()));$('#addTaskTop').addEventListener('click',()=>openTask());$('#closeDialog').addEventListener('click',closeTask);$('#cancelDialog').addEventListener('click',closeTask);
['taskSearch','statusFilter','priorityFilter'].forEach(id=>$(`#${id}`).addEventListener('input',renderTable));$('#globalSearch').addEventListener('input',e=>{if(e.target.value){navigate('tasks');$('#taskSearch').value=e.target.value}renderTable()});
$('#refreshAi').addEventListener('click',()=>{renderSuggestions();toast('Projekt analüüsiti uuesti')});
$('#themeButton').addEventListener('click',()=>{document.body.classList.toggle('dark');localStorage.setItem('flowpilot-theme',document.body.classList.contains('dark')?'dark':'light')});
$('#exportButton').addEventListener('click',()=>{const csv=['Pealkiri;Kirjeldus;Vastutaja;Tähtaeg;Prioriteet;Staatus',...tasks.map(t=>[t.title,t.description,t.assignee,t.deadline,priorityMeta[t.priority],statusMeta[t.status].label].map(v=>`"${String(v).replaceAll('"','""')}"`).join(';'))].join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv'}));a.download='flowpilot-ulesanded.csv';a.click();URL.revokeObjectURL(a.href);toast('CSV eksporditud')});
const promptExamples={dashboard:'Loo kaasaegne analüütika töölaud statistika kaartide, nädalagraafiku ja viimaste projektidega.',login:'Loo minimalistlik sisselogimisvaade lilla gradiendi, e-posti ja parooli väljadega.',pricing:'Loo hinnastamise leht kolme paketiga, tõsta keskmine pakett esile.'};
$$('[data-prompt]').forEach(button=>button.addEventListener('click',()=>{$('#mockupPrompt').value=promptExamples[button.dataset.prompt]}));
$('#mockupTask').addEventListener('change',e=>{const task=tasks.find(t=>t.id===e.target.value);if(task)$('#mockupPrompt').value=`Loo vaade ülesande jaoks: ${task.title}. ${task.description}`});
$('#generateMockup').addEventListener('click',()=>createMockup());
$('#refineMockup').addEventListener('click',()=>{const refinement=$('#refinePrompt').value.trim();if(!refinement){toast('Kirjelda soovitud muudatust');return}createMockup(refinement);$('#refinePrompt').value=''});
$('#newMockup').addEventListener('click',()=>{$('#mockupPrompt').value='';$('#mockupTask').value='';$('#refinePrompt').value='';$('#mockupFrame').classList.add('hidden');$('#previewEmpty').classList.remove('hidden');$('#iterationBox').classList.add('hidden');activeMockup=-1});
$$('[data-device]').forEach(button=>button.addEventListener('click',()=>{$$('[data-device]').forEach(b=>b.classList.toggle('active',b===button));$('#previewStage').className=`preview-stage ${button.dataset.device==='desktop'?'':button.dataset.device}`}));
$('#versionList').addEventListener('click',e=>{const version=e.target.closest('[data-version]');if(version)showMockup(Number(version.dataset.version))});
$('#openPreview').addEventListener('click',()=>{if(activeMockup<0){toast('Genereeri esmalt mockup');return}const blob=new Blob([mockupVersions[activeMockup].html],{type:'text/html'});window.open(URL.createObjectURL(blob),'_blank')});
if(localStorage.getItem('flowpilot-theme')==='dark')document.body.classList.add('dark');render();
if(mockupVersions.length)showMockup(activeMockup);
