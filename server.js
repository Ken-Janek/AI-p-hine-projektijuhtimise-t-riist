import 'dotenv/config';
import express from 'express';
import OpenAI from 'openai';

const app = express();
const port = Number(process.env.PORT) || 8080;
const model = process.env.OPENAI_MODEL || 'gpt-5.4-mini';
const hasApiKey = Boolean(process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('lisa-oma'));
const openai = hasApiKey ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));
app.use(express.static('.', { dotfiles: 'deny', index: 'index.html' }));

app.get('/api/ai-status', (_request, response) => {
  response.json({ enabled: hasApiKey, model: hasApiKey ? model : null });
});

app.post('/api/generate-mockup', async (request, response) => {
  if (!openai) {
    return response.status(503).json({
      error: 'AI pole seadistatud. Lisa OPENAI_API_KEY .env faili ja taaskäivita server.',
      code: 'AI_NOT_CONFIGURED',
    });
  }

  const prompt = typeof request.body?.prompt === 'string' ? request.body.prompt.trim() : '';
  if (prompt.length < 5 || prompt.length > 4000) {
    return response.status(400).json({ error: 'Prompt peab olema 5–4000 tähemärki.' });
  }

  try {
    const result = await openai.responses.create({
      model,
      instructions: `
Sa oled kogenud UI/UX disainer ja frontend-arendaja. Loo kasutaja kirjelduse põhjal üks viimistletud,
responsiivne ja klikitav veebivaate prototüüp. Tagasta ainult terviklik HTML-dokument, alustades
<!doctype html>-reaga. Pane CSS <style> elemendi sisse ja vajadusel väike interaktiivsus <script>
elemendi sisse. Ära kasuta Markdowni koodiplokki, väliseid teeke, väliseid fonte, pilte, võrguühendusi,
fetch'i, XMLHttpRequesti, WebSocketit, vormide päris saatmist ega linke teistele veebilehtedele.
Kasuta eestikeelset realistlikku näidissisu. Kujundus peab töötama nii desktopil kui mobiilis.
Nupud ja navigeerimiselemendid peavad andma klikil nähtava prototüübi tagasiside.
`,
      input: prompt,
    });

    let html = result.output_text.trim()
      .replace(/^```html\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '');

    const unsafeNetworkCode = /\b(fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(|https?:\/\//i;
    if (!/^<!doctype html>/i.test(html) || !/<html[\s>]/i.test(html) || unsafeNetworkCode.test(html)) {
      throw new Error('Mudel tagastas ootamatu või välisühendust kasutava HTML-i.');
    }
    if (html.length > 250000) throw new Error('Genereeritud mockup on liiga suur.');

    response.json({ html, model });
  } catch (error) {
    console.error('Mockup generation failed:', error.message);
    response.status(502).json({
      error: 'AI-mockup’i genereerimine ebaõnnestus. Proovi uuesti või kontrolli API seadistust.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

app.use((request, response) => {
  if (request.path.startsWith('/api/')) return response.status(404).json({ error: 'API endpoint puudub.' });
  response.status(404).send('Lehte ei leitud.');
});

app.listen(port, '127.0.0.1', () => {
  console.log(`FlowPilot: http://localhost:${port}`);
  console.log(hasApiKey ? `AI aktiivne (${model})` : 'AI offline – lisa OPENAI_API_KEY .env faili. Malligeneraator töötab edasi.');
});
