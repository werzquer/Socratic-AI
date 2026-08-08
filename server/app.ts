import express from "express";
import { GoogleGenAI } from "@google/genai";
import vm from "vm";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export const SYSTEM_PROMPT = `Ты — Socratic AI, интеллектуальный ментор по программированию. Твоя цель — помогать пользователю писать код, не делая всю работу за него, но и не создавая лишних преград.

СТИЛЬ ОБЩЕНИЯ:
- Сочетай "Premium Academic" (вежливость, четкая структура, глубокие пояснения) и "Geeky" (использование технического сленга, аналогии из мира технологий, фокус на оптимизации).

ПРАВИЛА ОТВЕТОВ:
1. СОКРАТОВСКИЙ МЕТОД: Если пользователь задает вопрос по коду, сначала проанализируй его решение. Задай 1-2 наводящих вопроса, которые помогут ему самому найти ошибку или логический пробел.
2. ПЕРЕКЛЮЧАТЕЛЬ: Если пользователь пишет "хватит", "дай код", "стоп" или проявляет явное разочарование, немедленно прекращай задавать вопросы и предоставь полный, оптимизированный блок кода с подробными комментариями.
3. АНАЛИЗ ОШИБОК: При проверке кода пользователя всегда указывай на логические ошибки, проблемы с безопасностью или неэффективные алгоритмы. Объясняй *почему* это ошибка, а не просто *что* исправить.
4. ИНТЕРФЕЙС: Ты поддерживаешь работу со встроенным редактором кода (Monaco Editor). Если ты предлагаешь изменения, оформляй их в блоки кода с указанием языка.`;

let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY_MISSING');
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

export const app = express();
app.use(express.json({ limit: "50mb" }));

// Chat Session Endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { history, message, imageUrl } = req.body;
    
    let contents = [];
    
    for (const msg of history || []) {
      if (msg.role !== 'system') {
        contents.push({
          role: msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      }
    }
    
    const currentParts: any[] = [];
    if (imageUrl) {
      const base64Data = imageUrl.split(',')[1];
      const mimeType = imageUrl.split(',')[0].split(':')[1].split(';')[0];
      currentParts.push({ inlineData: { data: base64Data, mimeType } });
    }
    currentParts.push({ text: message });
    
    contents.push({
      role: 'user',
      parts: currentParts
    });

    const response = await getAiClient().models.generateContent({
      model: "gemini-flash-latest",
      contents: contents,
      config: {
        systemInstruction: SYSTEM_PROMPT
      }
    });
    
    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message === 'GEMINI_API_KEY_MISSING') {
      return res.status(500).json({ error: "Переменная GEMINI_API_KEY не найдена. Добавьте GEMINI_API_KEY в Environment Variables в настройках проекта Vercel." });
    }
    if (error.message?.includes("429") || error.message?.includes("quota") || error.status === "RESOURCE_EXHAUSTED" || error.code === 429) {
      return res.status(429).json({ error: "Превышена квота запросов (Rate Limit). Пожалуйста, подождите 30-60 секунд и повторите попытку." });
    }
    res.status(500).json({ error: error.message || "Ошибка сервера при вызове Gemini API" });
  }
});

// Code Execution Endpoint (Sandbox)
app.post("/api/run", async (req, res) => {
  const { code, language } = req.body;

  if (language === 'javascript') {
    try {
      let output = "";
      
      const sandbox = {
        console: {
          log: (...args: any[]) => {
            output += args.join(" ") + "\n";
          },
          error: (...args: any[]) => {
            output += "Error: " + args.join(" ") + "\n";
          }
        },
        print: (...args: any[]) => {
          output += args.join(" ") + "\n";
        },
        Math, Date, parseInt, parseFloat, Array, Object, String, Number, Boolean,
        setTimeout: () => {},
      };

      const context = vm.createContext(sandbox);
      const script = new vm.Script(code);
      script.runInContext(context, { timeout: 1000 });
      
      res.json({ success: true, output: output || 'Code executed successfully (no output).' });
    } catch (err: any) {
      res.json({ success: false, output: `Error: ${err.message}` });
    }
  } else if (language === 'python') {
    try {
      const { stdout, stderr } = await execFileAsync('python3', ['-c', code], { timeout: 2000 });
      const result = (stdout + (stderr ? "\n" + stderr : '')).trim();
      
      res.json({ success: true, output: result || 'Code executed successfully (no output).' });
    } catch (err: any) {
      res.json({ success: false, output: (err.stderr || err.message).trim() });
    }
  } else {
    res.json({ 
      success: false, 
      output: `Server execution for ${language} is not configured.\nДля выполнения ${language} требуются изолированные контейнеры Docker. В рамках демо мы проводим лишь семантический аудит.`
    });
  }
});

// AI Code Audit Endpoint
app.post("/api/audit", async (req, res) => {
  try {
    const { code, language, output } = req.body;
    const prompt = `Пользователь пытается запустить код на ${language}:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nРезультат выполнения / Ошибка:\n${output}\n\nСделай аудит этого кода. Найди ошибку и задай 1-2 наводящих вопроса по методу Сократа.`;

    const response = await getAiClient().models.generateContent({
      model: "gemini-flash-latest",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_PROMPT
      }
    });
    
    res.json({ text: response.text });
  } catch (error: any) {
    if (error.message === 'GEMINI_API_KEY_MISSING') {
      return res.status(500).json({ error: "Переменная GEMINI_API_KEY не найдена. Добавьте GEMINI_API_KEY в Environment Variables Vercel." });
    }
    if (error.message?.includes("429") || error.message?.includes("quota") || error.status === "RESOURCE_EXHAUSTED" || error.code === 429) {
      return res.status(429).json({ error: "Превышена квота запросов (Rate Limit). Пожалуйста, подождите 30-60 секунд и повторите попытку." });
    }
    res.status(500).json({ error: error.message || "Ошибка сервера при вызове Gemini API" });
  }
});

// AI Autocomplete Endpoint
app.post("/api/autocomplete", async (req, res) => {
  try {
    const { codeBefore, codeAfter, language } = req.body;
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

    const response = await getAiClient().models.generateContent({
      model: "gemini-flash-latest",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    
    let text = response.text || '';
    text = text.replace(/^\`\`\`[a-z]*\n/gm, '').replace(/\`\`\`$/g, '');
    res.json({ text });
  } catch (error: any) {
    if (error.message === 'GEMINI_API_KEY_MISSING') {
      return res.status(500).json({ error: "GEMINI_API_KEY_MISSING" });
    }
    if (error.message?.includes("429") || error.message?.includes("quota") || error.status === "RESOURCE_EXHAUSTED" || error.code === 429) {
      return res.status(429).json({ error: "Rate limit reached" });
    }
    res.status(500).json({ error: error.message || "Autocomplete error" });
  }
});
