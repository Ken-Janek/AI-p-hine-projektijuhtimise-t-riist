import 'dotenv/config';
import express from 'express';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

const app = express();
const port = Number(process.env.PORT) || 8080;
const model = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
const hasApiKey = Boolean(process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('lisa-oma'));
const dataDirectory = path.resolve('data');
const dataFile = path.join(dataDirectory, 'app-data.json');

const text = (value, max) => typeof value === 'string' && value.length <= max;
function validTask(task) {
  return task && typeof task === 'object' && text(task.id, 80) && text(task.title, 80) && text(task.description, 400)
    && text(task.assignee, 80) && /^\d{4}-\d{2}-\d{2}$/.test(task.deadline || '')
    && ['high', 'medium', 'low'].includes(task.priority) && ['todo', 'progress', 'done', 'blocked'].includes(task.status)
    && text(task.dependency ?? '', 80);
}
function validAppData(value) {
  return value && typeof value === 'object' && Array.isArray(value.tasks) && value.tasks.length <= 1000
    && value.tasks.every(validTask) && Array.isArray(value.activities) && value.activities.length <= 100
    && value.activities.every(item => item && text(item.icon, 10) && text(item.text, 500) && text(item.time, 80))
    && Array.isArray(value.mockups) && value.mockups.length <= 50
    && value.mockups.every(item => item && text(item.title, 100) && text(item.prompt, 4000)
      && text(item.html, 250000) && text(item.source, 100) && text(item.time, 80));
}
async function readAppData() {
  try { return JSON.parse(await readFile(dataFile, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
async function writeAppData(value) {
  await mkdir(dataDirectory, { recursive: true });
  const temporaryFile = `${dataFile}.tmp`;
  await writeFile(temporaryFile, JSON.stringify(value, null, 2), 'utf8');
  await rename(temporaryFile, dataFile);
}
function sanitizeMockupHtml(value) {
  let html = String(value || '').trim().replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
  html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<(iframe|object|embed|base|link)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<(iframe|object|embed|base|link|meta)\b[^>]*\/?\s*>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s+(href|src|action|formaction)\s*=\s*(["'])\s*(?:javascript:|data:|https?:|\/\/)[\s\S]*?\2/gi, '')
    .replace(/url\s*\(\s*(["']?)\s*(?:https?:|\/\/|data:)[^)]*\)/gi, 'none');
  return html;
}

app.disable('x-powered-by');
app.use(express.json({ limit: '15mb' }));
const publicFiles = new Set(['/', '/index.html', '/styles.css', '/mockups.css', '/crazyland-theme.css', '/app.js']);
app.use((request, response, next) => {
  if (request.path.startsWith('/api/') || publicFiles.has(request.path)) return next();
  response.status(404).send('Lehte ei leitud.');
});
app.use(express.static('.', { dotfiles: 'deny', index: 'index.html' }));

app.get('/api/ai-status', (_request, response) => {
  response.json({ enabled: hasApiKey, model: hasApiKey ? model : null });
});

app.get('/api/data', async (_request, response) => {
  try { response.json({ data: await readAppData() }); }
  catch { response.status(500).json({ error: 'Andmete lugemine ebaõnnestus.' }); }
});

app.put('/api/data', async (request, response) => {
  if (!validAppData(request.body)) return response.status(400).json({ error: 'Andmete struktuur ei vasta skeemile.' });
  const safeData = { ...request.body, mockups: request.body.mockups.map(item => ({ ...item, html: sanitizeMockupHtml(item.html) })) };
  try { await writeAppData(safeData); response.json({ saved: true }); }
  catch { response.status(500).json({ error: 'Andmete salvestamine ebaõnnestus.' }); }
});

app.post('/api/generate-mockup', async (request, response) => {
  if (!hasApiKey) {
    return response.status(503).json({
      error: 'AI pole seadistatud. Lisa GEMINI_API_KEY .env faili ja taaskäivita server.',
      code: 'AI_NOT_CONFIGURED',
    });
  }

  const prompt = typeof request.body?.prompt === 'string' ? request.body.prompt.trim() : '';
  if (prompt.length < 5 || prompt.length > 4000) {
    return response.status(400).json({ error: 'Prompt peab olema 5–4000 tähemärki.' });
  }

  try {
    const instructions = `
Sa oled kogenud UI/UX disainer ja frontend-arendaja. Loo kasutaja kirjelduse põhjal üks viimistletud,
responsiivne veebivaate prototüüp. Tagasta ainult terviklik HTML-dokument, alustades
<!doctype html>-reaga. Pane CSS <style> elemendi sisse. Ära kasuta JavaScripti, <script> elemente,
Markdowni koodiplokki, väliseid teeke, väliseid fonte, pilte, võrguühendusi,
fetch'i, XMLHttpRequesti, WebSocketit, vormide päris saatmist ega linke teistele veebilehtedele.
Kasuta eestikeelset realistlikku näidissisu. Kujundus peab töötama nii desktopil kui mobiilis.
Nupud ja navigeerimiselemendid on ainult visuaalsed ega käivita koodi.
`;
    const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        model,
        input: `${instructions}\n\nKasutaja kirjeldus:\n${prompt}`,
      }),
    });
    const result = await geminiResponse.json();
    if (!geminiResponse.ok) throw new Error(result.error?.message || `Gemini API vastas ${geminiResponse.status}`);
    const outputText = (typeof result.output_text === 'string' ? result.output_text : result.steps
      ?.filter(step => step.type === 'model_output')
      .flatMap(step => step.content || [])
      .map(part => part.text || '')
      .join('') || '').trim();
    if (!outputText) throw new Error('Gemini ei tagastanud tekstivastust.');

    const html = sanitizeMockupHtml(outputText);

    const unsafeNetworkCode = /<script\b|\son[a-z]+\s*=|javascript:|\b(fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(|https?:\/\//i;
    if (!/^<!doctype html>/i.test(html) || !/<html[\s>]/i.test(html) || !/<body[\s>]/i.test(html) || unsafeNetworkCode.test(html)) {
      throw new Error('Mudel tagastas ootamatu või välisühendust kasutava HTML-i.');
    }
    if (html.length > 250000) throw new Error('Genereeritud mockup on liiga suur.');

    response.json({ html, model });
  } catch (error) {
    console.error('Mockup generation failed:', error.message, error.cause?.message || '');
    if (/project has been denied access/i.test(error.message)) {
      return response.status(403).json({
        error: 'Selle Google AI projekti ligipääs on keelatud. Loo Google AI Studios uus projekt ja API-võti.',
        code: 'AI_ACCESS_DENIED',
      });
    }
    response.status(502).json({
      error: 'AI-mockup’i genereerimine ebaõnnestus. Proovi uuesti või kontrolli API seadistust.',
      details: process.env.NODE_ENV === 'development' ? `${error.message}${error.cause?.message ? `: ${error.cause.message}` : ''}` : undefined,
    });
  }
});

app.use((request, response) => {
  if (request.path.startsWith('/api/')) return response.status(404).json({ error: 'API endpoint puudub.' });
  response.status(404).send('Lehte ei leitud.');
});

app.listen(port, '127.0.0.1', () => {
  console.log(`FlowPilot: http://localhost:${port}`);
  console.log(hasApiKey ? `Gemini võti seadistatud (${model})` : 'AI offline – lisa GEMINI_API_KEY .env faili. Malligeneraator töötab edasi.');
});
