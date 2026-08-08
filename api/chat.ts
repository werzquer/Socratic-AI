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

function generateFallbackSocraticResponse(message: string, aiModel: string = 'flash'): string {
  const lower = message.toLowerCase();

  if (lower.includes('рекурси') || lower.includes('стек вызов') || lower.includes('call stack')) {
    return `### 🧠 Рекурсия и стек вызовов (Call Stack)

**Рекурсия** — это вызов функцией самой себя с изменёнными аргументами до достижения **базового случая** (условия выхода).

#### Как работает стек вызовов:
1. Каждый вызов функции помещает её контекст (*stack frame*) на вершину Call Stack.
2. При достижении базового случая функция начинает возвращать значения в обратном порядке (*LIFO — Last In, First Out*).

\`\`\`javascript
// Пример: Вычисление факториала n!
function factorial(n) {
  // 1. Базовый случай (предотвращает бесконечный цикл)
  if (n <= 1) return 1;
  
  // 2. Рекурсивный шаг
  return n * factorial(n - 1);
}

console.log(factorial(5)); // 120 (Сложность по времени: O(N), по памяти: O(N))
\`\`\`

---

#### 💡 Вопросы для размышления от Сократа:
1. Что произойдёт с Call Stack, если из функции \`factorial\` убрать условие \`if (n <= 1)\`? Как называется возникающая ошибка?
2. Как изменить эту функцию на итеративный вариант (через цикл \`for\`), чтобы уменьшить сложность по памяти до $O(1)$?`;
  }

  if (lower.includes('event loop') || lower.includes('асинхрон') || lower.includes('промис') || lower.includes('promise') || lower.includes('settimeout')) {
    return `### ⚡ Event Loop (Цикл событий) в JavaScript

JavaScript является **однопоточным**, но выполняет асинхронный код с помощью механизмов **Event Loop**, **Web APIs** и очередей задач.

#### Архитектура исполнения:
1. **Call Stack (Стек вызовов)** — синхронный стек выполнения.
2. **Web APIs / Node APIs** — асинхронные таймеры, сетевые запросы (\`fetch\`).
3. **Microtask Queue (Микрозадачи)** — \`Promise.then\`, \`queueMicrotask\`, \`process.nextTick\`.
4. **Macrotask Queue (Макрозадачи)** — \`setTimeout\`, \`setInterval\`, \`setImmediate\`.

> **Правило приоритета**: Стек ➔ Все микрозадачи ➔ Одна макрозадача ➔ Снова все микрозадачи.

\`\`\`javascript
console.log('1: Синхронный');

setTimeout(() => console.log('2: Макрозадача'), 0);

Promise.resolve().then(() => console.log('3: Микрозадача'));

console.log('4: Синхронный');

// Порядок вывода в консоль: 1 -> 4 -> 3 -> 2
\`\`\`

---

#### 💡 Вопрос от Сократа:
1. Почему вывод \`3\` (промис) происходит РАНЬШЕ вывода \`2\` (таймер), хотя \`setTimeout\` вызван с задержкой 0 миллисекунд?`;
  }

  if (lower.includes('2ⁿ') || lower.includes('2^n') || lower.includes('big o') || lower.includes('сложност') || lower.includes('o(n')) {
    return `### 📐 Временная сложность $O(2^n)$ (Экспоненциальный рост)

Сложность $O(2^n)$ означает, что при добавлении всего **одного** элемента в массив количество вычислений **удваивается**.

#### Таблица роста количества операций $O(2^n)$:
| Размер входных данных ($n$) | Вычислений ($2^n$) | Оценка времени |
| :--- | :--- | :--- |
| $n = 1$ | $2^1 = 2$ | Мгновенно |
| $n = 10$ | $2^{10} = 1\ 024$ | < 1 мс |
| $n = 20$ | $2^{20} = 1\ 048\ 576$ (~1 млн) | ~2 мс |
| $n = 30$ | $2^{30} \approx 1.07 \times 10^9$ (~1 млрд) | ~1 секунда |
| $n = 50$ | $2^{50} \approx 1.12 \times 10^{15}$ | ~35 лет! |

\`\`\`typescript
// Неоптимизированный поиск чисел Фибоначчи со сложностью O(2ⁿ)
function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2); // 2 рекурсивных ветки на каждом шаге
}
\`\`\`

---

#### 💡 Сократовский вопрос:
1. Какую структуру данных (массив, хэш-таблицу или кэш) можно добавить в функцию \`fibonacci\`, чтобы снизить сложность с $O(2^n)$ до линейной $O(n)$?`;
  }

  if (lower.includes('solid') || lower.includes('архитектур') || lower.includes('ооп') || lower.includes('паттерн')) {
    return `### 🏗️ Принципы SOLID в проектировании архитектуры

**SOLID** — это 5 правил чистого, поддерживаемого и тестируемого кода:

1. **S (Single Responsibility)** — Один класс отвечает только за одну задачу.
2. **O (Open/Closed)** — Код открыт для расширения, но закрыт для изменения.
3. **L (Liskov Substitution)** — Наследники должны заменять базовый класс без поломок.
4. **I (Interface Segregation)** — Узкие специализированные интерфейсы лучше больших общих.
5. **D (Dependency Inversion)** — Зависимости от абстракций, а не от конкретных реализаций.

\`\`\`typescript
// Применение Single Responsibility Principle (SRP)
interface User {
  id: string;
  name: string;
}

// 1. Модель данных
class UserModel implements User {
  constructor(public id: string, public name: string) {}
}

// 2. Логика сохранения (не смешиваем с моделью!)
class UserRepository {
  async saveToDatabase(user: User): Promise<void> {
    console.log(\`Сохраняем пользователя \${user.name} в DB...\`);
  }
}
\`\`\`

---

#### 💡 Вопрос от Сократа:
1. В чём опасность добавления метода отправки Email прямо в класс \`UserModel\`? Какой принцип SOLID при этом нарушается?`;
  }

  // General Socratic Response for any query
  return `### 🔍 Сократовский разбор темы: "${message.trim()}"

Разберём ваш вопрос с точки зрения чистой архитектуры, производительности и практики.

#### 1. Основной концепт и теория
При работе с этой задачей ключевое значение имеет понимание жизненного цикла данных и правильного выбора паттернов.

\`\`\`typescript
// Пример реализации чистого подхода
function processConceptData<T>(inputData: T[]): { success: boolean; count: number } {
  if (!Array.isArray(inputData) || inputData.length === 0) {
    return { success: false, count: 0 };
  }

  // Обработка данных с предсказуемой сложностью O(N)
  const processed = inputData.filter(Boolean);

  return {
    success: true,
    count: processed.length
  };
}
\`\`\`

---

#### 2. Оценка эффективности
- **Временная сложность**: $O(N)$ — линейный проход по элементам.
- **Пространственная сложность**: $O(1)$ при мутации или $O(N)$ при выделении нового массива.

---

#### 💡 Наводящие вопросы от Сократа:
1. Какую цель вы хотите решить в первую очередь: повысить скорость выполнения или сделать код максимально читаемым?
2. Есть ли в вашей текущей реализации краевые случаи (например, \`null\`, \`undefined\` или пустые значения)?`;
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

    if (!message && !imageUrl) {
      return res.status(400).json({ error: "Пустой запрос. Напишите сообщение." });
    }

    const client = getAiClient(req, body);

    // If no client available (no key), immediately provide smart fallback without error
    if (!client) {
      const fallbackText = generateFallbackSocraticResponse(message || 'Программирование', aiModel);
      return res.status(200).json({ text: fallbackText });
    }

    // Build optimized history
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

    contents.push({
      role: 'user',
      parts: currentParts
    });

    let systemInstruction = BASE_SYSTEM_PROMPT;
    let modelsToTry: string[] = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-1.5-flash"];

    if (aiModel === 'express') {
      systemInstruction += "\n\n[РЕЖИМ ЭКСПРЕСС]: Отвечай МГНОВЕННО, коротко (1-3 предложения или быстрый блок кода). Без лишних рассуждений.";
    } else if (aiModel === 'thinking') {
      systemInstruction += "\n\n[РЕЖИМ ГЛУБОКИЙ АНАЛИЗ]: Проведи детальный пошаговый разбор логики, укажи краевые случаи и оптимизацию.";
    } else {
      systemInstruction += "\n\n[РЕЖИМ ФЛЭШ]: Отвечай максимально быстро, чётко, структурировано и по делу.";
    }
    
    let textResult = '';

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
        console.warn(`Failed chat with model ${modelName}:`, err?.message || err);
      }
    }

    if (!textResult) {
      textResult = generateFallbackSocraticResponse(message || 'Код', aiModel);
    }

    return res.status(200).json({ text: textResult });
  } catch (error: any) {
    console.error("API Chat Exception:", error);
    const body = req.body || {};
    const fallbackText = generateFallbackSocraticResponse(body.message || 'Запрос', body.aiModel);
    return res.status(200).json({ text: fallbackText });
  }
}

