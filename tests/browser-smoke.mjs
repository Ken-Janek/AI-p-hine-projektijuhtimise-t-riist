const endpoint = process.env.CDP_URL || 'http://127.0.0.1:9222';
const appUrl = process.env.APP_URL || 'http://127.0.0.1:8080';
const targets = await (await fetch(`${endpoint}/json`)).json();
const page = targets.find(target => target.type === 'page');
if (!page) throw new Error('A browser page target was not found');

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

let sequence = 0;
const pending = new Map();
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result);
});

function command(method, params = {}) {
  const id = ++sequence;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(expression) {
  const result = await command('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`PASS  ${message}`);
}

async function waitFor(expression, timeout = 60000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await evaluate(expression)) return true;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  return false;
}

await command('Runtime.enable');
await command('Page.enable');
if (!page.url.startsWith(appUrl)) {
  await command('Page.navigate', { url: appUrl });
  await new Promise(resolve => setTimeout(resolve, 500));
}
await evaluate(`localStorage.clear()`);
await command('Page.reload');
await new Promise(resolve => setTimeout(resolve, 500));

assert(await evaluate(`document.title === 'FlowPilot'`), 'application loads with the correct title');
assert(await evaluate(`document.querySelectorAll('#taskTable .task-row').length === 8`), 'eight demo tasks render');
assert(await evaluate(`document.querySelector('#navTaskCount').textContent === '8'`), 'dashboard task counter is correct');

await evaluate(`document.querySelector('[data-view="backlog"]').click()`);
assert(await evaluate(`document.querySelectorAll('#kanbanBoard .kanban-column').length === 4`), 'backlog renders all four workflow columns');
assert(await evaluate(`document.querySelectorAll('#kanbanBoard .dependency').length >= 1`), 'task dependencies are visible in the backlog');

await evaluate(`document.querySelector('[data-view="ai"]').click()`);
assert(await evaluate(`document.querySelectorAll('#suggestions .suggestion-card').length === 4`), 'AI view renders deadline, blocker, priority, and workload suggestions');

await evaluate(`
  document.querySelector('[data-view="mockups"]').click();
  document.querySelector('[data-prompt="login"]').click();
  document.querySelector('#generateMockup').click();
`);
assert(await evaluate(`document.querySelector('#mockupsView').classList.contains('active')`), 'mockup navigation opens Mockup Studio');
assert(await waitFor(`!document.querySelector('#generateMockup').disabled && localStorage.getItem('flowpilot-mockups-v1') && !document.querySelector('#mockupFrame').classList.contains('hidden') && document.querySelector('#mockupFrame').srcdoc.startsWith('<!doctype html>')`), 'prompt generates a live HTML mockup');
assert(await evaluate(`!/<script\\b|\\son[a-z]+\\s*=|javascript:/i.test(document.querySelector('#mockupFrame').srcdoc)`), 'generated mockup contains no executable script');
const firstVersionCount = await evaluate(`JSON.parse(localStorage.getItem('flowpilot-mockups-v1')).length`);
assert(firstVersionCount >= 1, 'generated mockup is stored as a version');
await evaluate(`
  document.querySelector('#refinePrompt').value = 'Muuda põhivärv roheliseks';
  document.querySelector('#refineMockup').click();
`);
assert(await waitFor(`Number(document.querySelector('#versionCount').textContent) === ${firstVersionCount + 1}`), 'refinement creates a second version');
await evaluate(`document.querySelector('[data-device="mobile"]').click()`);
assert(await evaluate(`document.querySelector('#previewStage').classList.contains('mobile')`), 'mobile preview mode is applied');

await evaluate(`
  window.__exportTest = {};
  window.__originalCreateObjectURL = URL.createObjectURL;
  window.__originalAnchorClick = HTMLAnchorElement.prototype.click;
  URL.createObjectURL = blob => { window.__exportTest.type = blob.type; return 'blob:test'; };
  HTMLAnchorElement.prototype.click = function () { window.__exportTest.download = this.download; };
  document.querySelector('#exportButton').click();
  URL.createObjectURL = window.__originalCreateObjectURL;
  HTMLAnchorElement.prototype.click = window.__originalAnchorClick;
`);
assert(await evaluate(`window.__exportTest.download === 'flowpilot-ulesanded.csv' && window.__exportTest.type === 'text/csv'`), 'CSV export creates the expected downloadable file');

await evaluate(`document.querySelector('[data-view="tasks"]').click()`);
assert(await evaluate(`document.querySelector('#tasksView').classList.contains('active')`), 'task navigation opens the task view');

await evaluate(`
  document.querySelector('.add-task').click();
  document.querySelector('#titleInput').value = 'Automated smoke test';
  document.querySelector('#descriptionInput').value = 'Created through the real browser form';
  document.querySelector('#assigneeInput').value = 'Mari-Liis';
  document.querySelector('#deadlineInput').value = '2026-10-01';
  document.querySelector('#priorityInput').value = 'high';
  document.querySelector('#statusInput').value = 'todo';
  document.querySelector('#taskForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
`);
assert(await evaluate(`JSON.parse(localStorage.getItem('flowpilot-tasks-v1')).length === 9`), 'adding a task persists it to localStorage');
assert(await evaluate(`document.querySelector('#navTaskCount').textContent === '9'`), 'task counter updates after adding');

await evaluate(`
  document.querySelector('#priorityFilter').value = 'high';
  document.querySelector('#priorityFilter').dispatchEvent(new Event('input', { bubbles: true }));
`);
assert(await evaluate(`[...document.querySelectorAll('#taskTable .task-row .priority')].every(el => el.classList.contains('high'))`), 'priority filter only displays matching tasks');

await evaluate(`
  document.querySelector('#priorityFilter').value = 'all';
  document.querySelector('#priorityFilter').dispatchEvent(new Event('input', { bubbles: true }));
  document.querySelector('#taskSearch').value = 'Automated smoke';
  document.querySelector('#taskSearch').dispatchEvent(new Event('input', { bubbles: true }));
`);
assert(await evaluate(`document.querySelectorAll('#taskTable .task-row').length === 1`), 'task search narrows the table');

await evaluate(`
  document.querySelector('#taskTable .task-row').click();
  document.querySelector('#titleInput').value = 'Automated smoke test updated';
  document.querySelector('#taskForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
`);
assert(await evaluate(`JSON.parse(localStorage.getItem('flowpilot-tasks-v1')).some(t => t.title === 'Automated smoke test updated')`), 'editing a task persists the updated title');

await evaluate(`document.querySelector('#themeButton').click()`);
assert(await evaluate(`document.body.classList.contains('dark') && localStorage.getItem('flowpilot-theme') === 'dark'`), 'dark theme is applied and persisted');

await command('Page.reload');
await new Promise(resolve => setTimeout(resolve, 500));
assert(await evaluate(`document.querySelector('#navTaskCount').textContent === '9'`), 'task data survives a page reload');
assert(await evaluate(`document.body.classList.contains('dark')`), 'theme survives a page reload');

await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
assert(await evaluate(`getComputedStyle(document.querySelector('.sidebar')).transform !== 'none'`), 'mobile layout hides the desktop sidebar');
assert(await evaluate(`document.documentElement.scrollWidth <= document.documentElement.clientWidth`), 'mobile layout has no page-level horizontal overflow');
await command('Emulation.clearDeviceMetricsOverride');

await evaluate(`
  window.confirm = () => true;
  document.querySelector('[data-view="tasks"]').click();
  document.querySelector('#taskSearch').value = 'Automated smoke test updated';
  document.querySelector('#taskSearch').dispatchEvent(new Event('input', { bubbles: true }));
  document.querySelector('#taskTable .task-row').click();
  document.querySelector('#deleteTask').click();
`);
assert(await evaluate(`JSON.parse(localStorage.getItem('flowpilot-tasks-v1')).length === 8`), 'deleting a task removes it from persistent data');

await evaluate(`localStorage.clear()`);
socket.close();
console.log('PASS  smoke suite completed and demo state was restored');
