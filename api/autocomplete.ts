import { getAiClient } from './_gemini';

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

    const client = getAiClient();
    const response = await client.models.generateContent({
      model: "gemini-flash-latest",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    let text = response.text || '';
    text = text.replace(/^\`\`\`[a-z]*\n/gm, '').replace(/\`\`\`$/g, '');
    return res.status(200).json({ text });
  } catch (error: any) {
    return res.status(200).json({ text: '' });
  }
}
