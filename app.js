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
  renderCompact();renderTable();renderKanban();renderSuggestions();renderActivities();
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
if(localStorage.getItem('flowpilot-theme')==='dark')document.body.classList.add('dark');render();
