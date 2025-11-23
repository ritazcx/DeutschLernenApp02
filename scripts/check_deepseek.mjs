import fs from 'fs';
import path from 'path';

function loadEnv(file = path.resolve(process.cwd(), '.env')) {
  try {
    const src = fs.readFileSync(file, 'utf8');
    const lines = src.split(/\n/);
    const out = {};
    for (const l of lines) {
      const m = l.match(/^\s*([A-Za-z0-9_]+)=(.*)$/);
      if (m) {
        out[m[1]] = m[2].trim();
      }
    }
    return out;
  } catch (e) {
    return {};
  }
}

const env = loadEnv();
const API_KEY = env.VITE_DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY;
if (!API_KEY) {
  console.error('No VITE_DEEPSEEK_API_KEY found in .env or process.env');
  process.exit(1);
}

const prompt = `You are a German dictionary assistant.\nGenerate a useful German word for a A2 learner.\nReturn a JSON object with word, gender, translation, definition, exampleSentenceGerman, exampleSentenceEnglish, difficulty.`;

async function callDeepSeek() {
  const url = 'https://api.deepseek.com/chat/completions';
  const body = {
    model: 'deepseek-chat',
    messages: [{ role: 'system', content: prompt }],
    temperature: 0.7,
    stream: false,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  console.log('HTTP', res.status, res.statusText);
  try {
    const data = JSON.parse(text);
    console.log('Parsed JSON:', JSON.stringify(data, null, 2));
    // attempt to print the typical field
    console.log('Choice message content:', data?.choices?.[0]?.message?.content);
  } catch (e) {
    console.log('Raw response text:', text);
  }
}

callDeepSeek().catch((err) => {
  console.error('Error calling DeepSeek:', err);
});
