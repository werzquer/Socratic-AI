import { getAiClient, SYSTEM_PROMPT } from '../server/gemini';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { code = '', language = 'javascript', output = '' } = body;

    const prompt = `Пользователь пытается запустить код на ${language}:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nРезультат выполнения / Ошибка:\n${output}\n\nСделай аудит этого кода. Найди ошибку и задай 1-2 наводящих вопроса по методу Сократа.`;

    const client = getAiClient();
    const response = await client.models.generateContent({
      model: "gemini-flash-latest",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_PROMPT
      }
    });

    return res.status(200).json({ text: response.text || '' });
  } catch (error: any) {
    console.error("API Audit Error:", error);

    if (error.message === 'GEMINI_API_KEY_MISSING') {
      return res.status(500).json({
        error: "Переменная GEMINI_API_KEY не найдена. Пожалуйста, укажите GEMINI_API_KEY в настройках Environment Variables в Vercel."
      });
    }

    const errStr = String(error?.message || error || '');
    if (errStr.includes("429") || errStr.includes("quota") || errStr.includes("RESOURCE_EXHAUSTED") || error?.status === 429) {
      return res.status(429).json({
        error: "Превышена квота запросов (Rate Limit). Пожалуйста, подождите 30-60 секунд."
      });
    }

    return res.status(500).json({
      error: `Ошибка аудита: ${errStr}`
    });
  }
}
