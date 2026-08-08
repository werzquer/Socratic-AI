import { GoogleGenAI } from "@google/genai";

const BASE_SYSTEM_PROMPT = `Ты — Socratic AI, интеллектуальный ментор по программированию. Твоя цель — глубоко, понятно и быстро объяснять концепции программирования, помогать в проектировании алгоритмов и демонстрировать чистый код.

СТИЛЬ ОБЩЕНИЯ И ФОРМАТИРОВАНИЕ:
1. ДЕМОНСТРАЦИЯ КОДА И УСТНЫЕ ОБЪЯСНЕНИЯ: Показывай, как тот или иной вопрос кодится на практике. Используй стандартные блоки кода с указанием языка (\`\`\`python, \`\`\`javascript, \`\`\`typescript и т.д.).
2. СОКРАТОВСКИЙ МЕТОД: Если пользователь изучает концепт или ищет ошибку, сначала задай 1-2 наводящих вопроса. Если просит готовый код — сразу давай полное решение с комментариями.
3. МАТЕМАТИКА, СТЕПЕНИ И СПЕЦИАЛЬНЫЕ СИМВОЛЫ:
   - Всегда форматируй математические степени и символы красиво и аккуратно.
   - В тексте и таблицах пиши степени в юникоде (например: 2⁷, 2¹⁰, 2ⁿ, x², O(N²)) или аккуратном LaTeX ($2^7$). 
   - Избегай кривых конструкций вроде "| $2^7$" — форматируй таблицы и выражения чётко.
4. ЛАКОНИЧНОСТЬ И СКОРОСТЬ: Пиши по существу, без мусорных вводных фраз. Излагай суть сразу.`;

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

    const { history = [], message = '', imageUrl, aiModel = 'flash' } = body;

    // Build optimized history (keep only recent items)
    let contents: any[] = [];
    const maxHistoryToKeep = aiModel === 'express' ? 4 : (aiModel === 'flash' ? 6 : 10);
    const slicedHistory = Array.isArray(history) ? history.slice(-maxHistoryToKeep) : [];

    for (const msg of slicedHistory) {
      if (msg && msg.role !== 'system') {
        contents.push({
          role: msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: String(msg.content || '') }]
        });
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

    const client = getAiClient(req, body);

    // Adjust system prompt and target models depending on selected AI model mode
    let systemInstruction = BASE_SYSTEM_PROMPT;
    let modelsToTry: string[] = [];

    if (aiModel === 'express') {
      systemInstruction += "\n\n[РЕЖИМ ЭКСПРЕСС]: Отвечай МГНОВЕННО, коротко (1-3 предложения или быстрый блок кода). Без лишних рассуждений.";
      modelsToTry = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-1.5-flash"];
    } else if (aiModel === 'thinking') {
      systemInstruction += "\n\n[РЕЖИМ ГЛУБОКИЙ АНАЛИЗ]: Проведи детальный пошаговый разбор логики, укажи краевые случаи и оптимизацию.";
      modelsToTry = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-1.5-flash"];
    } else {
      // Default 'flash' mode - Optimized for high speed
      systemInstruction += "\n\n[РЕЖИМ ФЛЭШ]: Отвечай максимально быстро, чётко, структурировано и по делу.";
      modelsToTry = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-1.5-flash"];
    }
    
    let textResult = '';
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await client.models.generateContent({
          model: modelName,
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
            maxOutputTokens: aiModel === 'express' ? 512 : (aiModel === 'flash' ? 1200 : 2560)
          }
        });
        textResult = response.text || '';
        if (textResult) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Failed chat with model ${modelName}:`, err?.message || err);
        if (err?.message === 'GEMINI_API_KEY_MISSING') throw err;
      }
    }

    if (!textResult && lastError) {
      throw lastError;
    }

    return res.status(200).json({ text: textResult });
  } catch (error: any) {
    console.error("API Chat Error:", error);

    if (error?.message === 'GEMINI_API_KEY_MISSING') {
      return res.status(500).json({
        error: "Переменная GEMINI_API_KEY не найдена. Убедитесь, что GEMINI_API_KEY добавлена в Environment Variables в настройках проекта Vercel."
      });
    }

    const errStr = String(error?.message || error || '');
    if (errStr.includes("429") || errStr.includes("quota") || errStr.includes("RESOURCE_EXHAUSTED") || error?.status === 429) {
      return res.status(429).json({
        error: "Превышена квота запросов (Rate Limit). Пожалуйста, подождите 30-60 секунд и повторите попытку."
      });
    }

    return res.status(500).json({
      error: `Ошибка при обращении к Gemini API: ${errStr}`
    });
  }
}
