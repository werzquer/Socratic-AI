import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  codeBlocks?: { code: string; language: string }[];
}

interface AiChatStore {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMode: 'full-file' | 'selection';
  
  setSendMode: (mode: 'full-file' | 'selection') => void;
  sendMessage: (text: string, contextCode?: string) => Promise<void>;
  clearChat: () => void;
}

export const useAiChatStore = create<AiChatStore>((set, get) => ({
  messages: [
    { id: '1', role: 'ai', text: 'Привет! Я Сократик, твой ИИ-помощник. Чем могу помочь с кодом сегодня?' }
  ],
  isLoading: false,
  sendMode: 'full-file',
  
  setSendMode: (mode) => set({ sendMode: mode }),
  
  sendMessage: async (text, contextCode) => {
    const newMessageId = Math.random().toString(36).substring(7);
    set({
      messages: [...get().messages, { id: newMessageId, role: 'user', text }],
      isLoading: true
    });
    
    // Call the backend API
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, code: contextCode || '' })
      });
      
      const data = await response.json();
      
      set({
        messages: [...get().messages, { 
          id: Math.random().toString(36).substring(7), 
          role: 'ai', 
          text: data.reply || 'Произошла ошибка...' 
        }],
        isLoading: false
      });
    } catch (err) {
      set({
        isLoading: false,
        messages: [...get().messages, { id: 'err', role: 'ai', text: 'Ошибка сети. Проверьте подключение.' }]
      });
    }
  },
  
  clearChat: () => set({ 
    messages: [{ id: '1', role: 'ai', text: 'Привет! Я Сократик, твой ИИ-помощник. Чем могу помочь с кодом сегодня?' }] 
  })
}));
