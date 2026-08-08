import { GoogleGenAI } from "@google/genai";

const SYSTEM_PROMPT = `Ты — Socratic AI, интеллектуальный ментор по программированию. Твоя цель — помогать пользователю писать код, не делая всю работу за него, но и не создавая лишних преград.

СТИЛЬ ОБЩЕНИЯ:
- Сочетай "Premium Academic" (вежливость, четкая структура, глубокие пояснения) и "Geeky" (использование технического сленга, аналогии из мира технологий, фокус на оптимизации).

ПРАВИЛА ОТВЕТОВ:
1. СОКРАТОВСКИЙ МЕТОД: Если пользователь задает вопрос по коду, сначала проанализируй его решение. Задай 1-2 наводящих вопроса, которые помогут ему самому найти ошибку или логический пробел.
2. ПЕРЕКЛЮЧАТЕЛЬ: Если пользователь пишет "хватит", "дай код", "стоп" или проявляет явное разочарование, немедленно прекращай задавать вопросы и предоставь полный, оптимизированный блок кода с подробными комментариями.
3. АНАЛИЗ ОШИБОК: При проверке кода пользователя всегда указывай на логические ошибки, проблемы с безопасностью или неэффективные алгоритмы. Объясняй *почему* это ошибка, а не просто *что* исправить.
4. ИНТЕРФЕЙС: Ты поддерживаешь работу со встроенным редактором кода (Monaco Editor). Если ты предлагаешь изменения, оформляй их в блоки кода с указанием языка.`;

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

    const { code = '', language = 'javascript', output = '' } = body;

    const prompt = `Пользователь пытается запустить код на ${language}:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nРезультат выполнения / Ошибка:\n${output}\n\nСделай аудит этого кода. Найди ошибку и задай 1-2 наводящих вопроса по методу Сократа.`;

    const client = getAiClient(req, body);

    let textResult = '';
    const modelsToTry = ["gemini-flash-latest", "gemini-2.5-flash", "gemini-1.5-flash"];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await client.models.generateContent({
          model: modelName,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            systemInstruction: SYSTEM_PROMPT
          }
        });
        textResult = response.text || '';
        if (textResult) break;
      } catch (err: any) {
        lastError = err;
        if (err?.message === 'GEMINI_API_KEY_MISSING') throw err;
      }
    }

    if (!textResult && lastError) {
      throw lastError;
    }

    return res.status(200).json({ text: textResult });
  } catch (error: any) {
    console.error("API Audit Error:", error);

    if (error?.message === 'GEMINI_API_KEY_MISSING') {
      return res.status(500).json({
        error: "Переменная GEMINI_API_KEY не найдена. Укажите GEMINI_API_KEY в Environment Variables в Vercel."
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
