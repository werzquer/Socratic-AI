export function createChatSession() {
  const history: any[] = [];
  
  return {
    sendMessage: async (input: { message: string | any[] }) => {
      let text = '';
      let imageUrl = '';
      
      // Handle the complex message format from the frontend code
      if (Array.isArray(input.message)) {
        text = input.message.find(p => p.text)?.text || '';
        const imgPart = input.message.find(p => p.inlineData);
        if (imgPart) {
           imageUrl = `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}`;
        }
      } else {
        text = input.message as string;
      }
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history, message: text, imageUrl })
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: "API Request Failed" }));
        throw new Error(errData.error || "API Request Failed");
      }
      
      const data = await response.json();
      
      // Update local history proxy
      history.push({ role: 'user', content: text });
      history.push({ role: 'model', content: data.text });
      
      return { text: data.text };
    }
  };
}

export async function runCode(code: string, language: string) {
  const response = await fetch('/api/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, language })
  });
  return response.json();
}

export async function auditCode(code: string, language: string, output: string) {
  const response = await fetch('/api/audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, language, output })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to audit code");
  return data.text;
}

export async function getAutocomplete(codeBefore: string, codeAfter: string, language: string) {
  const response = await fetch('/api/autocomplete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codeBefore, codeAfter, language })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to get autocomplete");
  return data.text;
}
