function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  try {
    const customKey = localStorage.getItem('socratic_custom_api_key');
    if (customKey && customKey.trim()) {
      headers['x-gemini-key'] = customKey.trim();
    }
  } catch (e) {
    // Ignore
  }
  return headers;
}

export function createChatSession(initialAiModel: 'flash' | 'thinking' | 'express' = 'flash') {
  const history: any[] = [];
  let currentAiModel = initialAiModel;
  
  return {
    setAiModel: (model: 'flash' | 'thinking' | 'express') => {
      currentAiModel = model;
    },
    sendMessage: async (input: { message: string | any[]; aiModel?: 'flash' | 'thinking' | 'express' }) => {
      let text = '';
      let imageUrl = '';
      const selectedModel = input.aiModel || currentAiModel;
      
      if (Array.isArray(input.message)) {
        text = input.message.find(p => p.text)?.text || '';
        const imgPart = input.message.find(p => p.inlineData);
        if (imgPart) {
           imageUrl = `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}`;
        }
      } else {
        text = input.message as string;
      }
      
      // Limit history size to last 8 items for maximum speed and lower latency
      const recentHistory = history.slice(-8);

      let response: Response;
      try {
        response = await fetch('/api/chat', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ 
            history: recentHistory, 
            message: text, 
            imageUrl, 
            aiModel: selectedModel 
          })
        });
      } catch (netErr: any) {
        throw new Error("Не удалось подключиться к серверу. Проверьте интернет-соединение.");
      }

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        const raw = await response.text().catch(() => "");
        if (response.status === 404 || raw.includes("<!DOCTYPE") || raw.includes("<html")) {
          throw new Error("Сервер недоступен или эндпоинт API не найден.");
        }
        throw new Error(`Ошибка сервера (${response.status}): ${raw.slice(0, 100)}`);
      }
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Ошибка запроса к серверу (код ${response.status})`);
      }
      
      // Update local history
      history.push({ role: 'user', content: text });
      history.push({ role: 'model', content: data.text });
      
      return { text: data.text };
    }
  };
}

export async function runCode(code: string, language: string) {
  try {
    const response = await fetch('/api/run', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ code, language })
    });
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return { success: false, output: "Серверный эндпоинт выполнения кода недоступен." };
    }
    return response.json();
  } catch (err: any) {
    return { success: false, output: `Ошибка сети при запуске кода: ${err.message}` };
  }
}

export async function auditCode(code: string, language: string, output: string) {
  let response: Response;
  try {
    response = await fetch('/api/audit', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ code, language, output })
    });
  } catch (netErr: any) {
    throw new Error("Не удалось связаться с сервером.");
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("API аудита недоступен");
  }

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Не удалось выполнить аудит кода");
  return data.text;
}

export async function getAutocomplete(codeBefore: string, codeAfter: string, language: string) {
  try {
    const response = await fetch('/api/autocomplete', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ codeBefore, codeAfter, language })
    });
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) return "";
    const data = await response.json();
    if (!response.ok) return "";
    return data.text || "";
  } catch {
    return "";
  }
}
