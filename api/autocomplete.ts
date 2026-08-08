import { GoogleGenAI } from "@google/genai";

function getAiClient(req?: any, body?: any): GoogleGenAI {
  const key = body?.customApiKey ||
              req?.headers?.['x-gemini-key'] ||
              (typeof req?.headers?.authorization === 'string' ? req.headers.authorization.replace('Bearer ', '') : null) ||
              process.env.GEMINI_API_KEY ||
              process.env.API_KEY ||
              process.env.VITE_GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY_MISSING');
  }
  return new GoogleGenAI({ apiKey: key });
}

export default async function handler(req: any, res: any) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }
    body = body || {};

    const { codeBefore = '', codeAfter = '', language = 'javascript' } = body;

    const prompt = `Ты — помощник по написанию кода (как GitHub Copilot). Допиши код на ${language}. 
Код ДО курсора: 
\`\`\`
${codeBefore}
\`\`\`

Код ПОСЛЕ курсора:
\`\`\`
${codeAfter}
\`\`\`

Выведи ТОЛЬКО код, который нужно вставить между ними. Без маркдауна и объяснений.`;

    const client = getAiClient(req, body);
    
    let text = '';
    const modelsToTry = ["gemini-flash-latest", "gemini-2.5-flash", "gemini-1.5-flash"];
    for (const modelName of modelsToTry) {
      try {
        const response = await client.models.generateContent({
          model: modelName,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });
        text = response.text || '';
        if (text) break;
      } catch (err) {
        // Fallback silently
      }
    }

    text = text.replace(/^\`\`\`[a-z]*\n/gm, '').replace(/\`\`\`$/g, '');
    return res.status(200).json({ text });
  } catch (error: any) {
    return res.status(200).json({ text: '' });
  }
}
