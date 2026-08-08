import { getAiClient, SYSTEM_PROMPT } from './_gemini';

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

    const { history = [], message = '', imageUrl } = body;

    let contents: any[] = [];

    if (Array.isArray(history)) {
      for (const msg of history) {
        if (msg && msg.role !== 'system') {
          contents.push({
            role: msg.role === 'model' ? 'model' : 'user',
            parts: [{ text: String(msg.content || '') }]
          });
        }
      }
    }

    const currentParts: any[] = [];
    if (imageUrl && typeof imageUrl === 'string' && imageUrl.includes(',')) {
      try {
        const base64Data = imageUrl.split(',')[1];
        const mimeType = imageUrl.split(',')[0].split(':')[1].split(';')[0];
        currentParts.push({ inlineData: { data: base64Data, mimeType } });
      } catch (e) {
        console.error("Error parsing imageUrl:", e);
      }
    }
    
    if (message) {
      currentParts.push({ text: String(message) });
    }

    if (currentParts.length === 0) {
      return res.status(400).json({ error: "Пустой запрос. Напишите сообщение." });
    }

    contents.push({
      role: 'user',
      parts: currentParts
    });

    const client = getAiClient();
    const response = await client.models.generateContent({
      model: "gemini-flash-latest",
      contents: contents,
      config: {
        systemInstruction: SYSTEM_PROMPT
      }
    });

    return res.status(200).json({ text: response.text || '' });
  } catch (error: any) {
    console.error("API Chat Error:", error);

    if (error?.message === 'GEMINI_API_KEY_MISSING') {
      return res.status(500).json({
        error: "Переменная GEMINI_API_KEY не найдена. Добавьте GEMINI_API_KEY в Environment Variables в настройках проекта Vercel."
      });
    }

    const errStr = String(error?.message || error || '');
    if (errStr.includes("429") || errStr.includes("quota") || errStr.includes("RESOURCE_EXHAUSTED") || error?.status === 429) {
      return res.status(429).json({
        error: "Превышена квота запросов (Rate Limit). Пожалуйста, подождите 30-60 секунд и повторите попытку."
      });
    }

    return res.status(500).json({
      error: `Ошибка сервера: ${errStr}`
    });
  }
}
