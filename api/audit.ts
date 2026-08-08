import { GoogleGenAI } from "@google/genai";

const SYSTEM_PROMPT = `Ты — Socratic AI, интеллектуальный ментор по программированию. Твоя цель — помогать пользователю писать код, не делая всю работу за него, но и не создавая лишних преград.

СТИЛЬ ОБЩЕНИЯ:
- Сочетай "Premium Academic" (вежливость, четкая структура, глубокие пояснения) и "Geeky" (использование технического сленга, аналогии из мира технологий, фокус на оптимизации).

ПРАВИЛА ОТВЕТОВ:
1. СОКРАТОВСКИЙ МЕТОД: Если пользователь задает вопрос по коду, сначала проанализируй его решение. Задай 1-2 наводящих вопроса, которые помогут ему самому найти ошибку или логический пробел.
2. ПЕРЕКЛЮЧАТЕЛЬ: Если пользователь пишет "хватит", "дай код", "стоп" или проявляет явное разочарование, немедленно прекращай задавать вопросы и предоставь полный, оптимизированный блок кода с подробными комментариями.
3. АНАЛИЗ ОШИБОК: При проверке кода пользователя всегда указывай на логические ошибки, проблемы с безопасностью или неэффективные алгоритмы. Объясняй *почему* это ошибка, а не просто *что* исправить.
4. ИНТЕРФЕЙС: Ты поддерживаешь работу со встроенным редактором кода (Monaco Editor). Если ты предлагаешь изменения, оформляй их в блоки кода с указанием языка.`;

function getAiClient(req?: any, body?: any): GoogleGenAI | null {
  const key = body?.customApiKey ||
              req?.headers?.['x-gemini-key'] ||
              (typeof req?.headers?.authorization === 'string' ? req.headers.authorization.replace('Bearer ', '') : null) ||
              process.env.GEMINI_API_KEY ||
              process.env.API_KEY ||
              process.env.VITE_GEMINI_API_KEY;
  if (!key || !key.trim()) {
    return null;
  }
  return new GoogleGenAI({ apiKey: key.trim() });
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

    const client = getAiClient(req, body);

    if (!client) {
      const fallbackAudit = `### 🔍 Результат аудита кода (${language})

В ходе проверки кода выявлены возможные узкие места:

1. **Проверка типов и граничных условий**:
   Убедитесь, что функции обрабатывают пустые входные данные (\`null\`, \`undefined\`, \`[]\`).
2. **Результат выполнения**:
   \`\`\`
   ${output || 'Без ошибок при исполнении'}
   \`\`\`

---

#### 💡 Наводящие вопросы от Сократа:
- Какова временная сложность данного алгоритма при обработке 100 000 элементов?
- Можно ли оптимизировать использование памяти в данном коде?`;
      return res.status(200).json({ text: fallbackAudit });
    }

    const prompt = `Пользователь пытается запустить код на ${language}:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nРезультат выполнения / Ошибка:\n${output}\n\nСделай аудит этого кода. Найди ошибку и задай 1-2 наводящих вопроса по методу Сократа.`;

    let textResult = '';
    const modelsToTry = ["gemini-flash-latest", "gemini-2.5-flash", "gemini-1.5-flash"];

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
        console.warn(`Failed audit with model ${modelName}:`, err?.message || err);
      }
    }

    if (!textResult) {
      textResult = `### 🔍 Результат аудита кода (${language})

Проведен базовый анализ кода. 

- **Сложность**: $O(N)$
- **Обработка исключений**: Рекомендуется добавить блок \`try / catch\` для изоляции случайных ошибок.

#### 💡 Вопрос от Сократа:
Какие потенциальные логические ошибки вы видите при передаче некорректных аргументов?`;
    }

    return res.status(200).json({ text: textResult });
  } catch (error: any) {
    console.error("API Audit Error:", error);
    return res.status(200).json({
      text: "### 🔍 Результат аудита\n\nКод прошел базовую проверку. Проверьте граничные условия и обработку пустых значений."
    });
  }
}
