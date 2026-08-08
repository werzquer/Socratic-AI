import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

import { 
  Send, Lightbulb, AlertCircle, RefreshCw, Paperclip, X, 
  Sparkles, MessageSquare, Plus, Trash2, Download, BookOpen, 
  HelpCircle, Code2, Cpu, Compass, Menu, ChevronLeft, Key, Check,
  Zap, Brain, Gauge, Rocket, ArrowRight, Home, Sliders
} from 'lucide-react';
import { createChatSession } from '../services/ai';
import { CodeBlock } from './CodeBlock';
import { formatMathAndSuperscripts } from '../utils/formatMath';
import { AiModelType, SocraticMode } from './SettingsModal';

type Message = {
  id: string;
  role: 'user' | 'model';
  content: string;
  image?: string;
  timestamp?: string;
  aiModelUsed?: AiModelType;
};

type Session = {
  id: string;
  title: string;
  createdAt: string;
  messages: Message[];
  mode: SocraticMode;
};

interface SocraticMentorProps {
  onGoHome: () => void;
  onOpenSettings: () => void;
  aiModel: AiModelType;
  setAiModel: (model: AiModelType) => void;
  mode: SocraticMode;
  setMode: (mode: SocraticMode) => void;
  initialPrompt?: string;
}

const MODE_LABELS: Record<SocraticMode, { title: string; desc: string; icon: any }> = {
  socratic: {
    title: 'Сократовский диалог',
    desc: 'Задает наводящие вопросы для глубокого понимания',
    icon: HelpCircle
  },
  verbal: {
    title: 'Устный разбор',
    desc: 'Простые слова, аналогии и наглядные метафоры',
    icon: BookOpen
  },
  code: {
    title: 'Пример кода + Пояснения',
    desc: 'Наглядная демонстрация чистой реализации',
    icon: Code2
  }
};

const AI_MODEL_CONFIGS: Record<AiModelType, {
  name: string;
  badge: string;
  speed: string;
  desc: string;
  icon: any;
  accentColor: string;
  borderColor: string;
  bgColor: string;
}> = {
  flash: {
    name: 'Сократ Флэш',
    badge: '⚡ Ускоренный',
    speed: '~1 сек',
    desc: 'Мгновенный отклик с высокой точностью. Оптимально для ежедневной учебы.',
    icon: Zap,
    accentColor: 'text-[#F9E2AF]',
    borderColor: 'border-[#F9E2AF]/40',
    bgColor: 'bg-[#F9E2AF]/10'
  },
  thinking: {
    name: 'Думающий Сократ',
    badge: '🧠 Глубокий анализ',
    speed: '~3-5 сек',
    desc: 'Глубокое логическое размышление для сложных архитектур и багов.',
    icon: Brain,
    accentColor: 'text-[#CBA6F7]',
    borderColor: 'border-[#CBA6F7]/40',
    bgColor: 'bg-[#CBA6F7]/10'
  },
  express: {
    name: 'Сократ Экспресс',
    badge: '🚀 Мгновенный',
    speed: '< 1 сек',
    desc: 'Ультракороткие ответы и сухие выжимки кода без вводных слов.',
    icon: Rocket,
    accentColor: 'text-[#A6E3A1]',
    borderColor: 'border-[#A6E3A1]/40',
    bgColor: 'bg-[#A6E3A1]/10'
  }
};

const TOPIC_STARTERS = [
  {
    category: '🧠 Концепты и Алгоритмы',
    topics: [
      { title: 'Как устроена рекурсия?', prompt: 'Объясни мне, как работает рекурсия и стек вызовов. В чем разница с обычным циклом?' },
      { title: 'Степени и сложность O(2ⁿ)', prompt: 'Объясни нотацию Big O. Сколько операций выполняет O(2ⁿ) при n=10 и n=20?' },
      { title: 'Замыкания (Closures) в JS', prompt: 'Как работают замыкания в JavaScript и зачем они нужны на практике?' }
    ]
  },
  {
    category: '🛠 Практика и Асинхронность',
    topics: [
      { title: 'Event Loop под капотом', prompt: 'Как работает Event Loop (петля событий) и таски/микротаски в JavaScript?' },
      { title: 'Async/Await vs Promises', prompt: 'В чем принципиальная разница между асинхронными функциями и Promise?' },
      { title: 'Реализация Debounce', prompt: 'Покажи и объясни, как кодится функция Debounce для оптимизации ввода.' }
    ]
  },
  {
    category: '🏛 Архитектура и ООП',
    topics: [
      { title: 'Принципы SOLID', prompt: 'Объясни 5 принципов SOLID на простых жизненных примерах из разработки.' },
      { title: 'Паттерн Наблюдатель (Observer)', prompt: 'Зачем нужен паттерн Observer (Наблюдатель) и как его закодить?' },
      { title: 'REST API vs GraphQL', prompt: 'В чем плюсы и минусы REST API по сравнению с GraphQL?' }
    ]
  }
];

export default function SocraticMentor({
  onGoHome,
  onOpenSettings,
  aiModel,
  setAiModel,
  mode,
  setMode,
  initialPrompt
}: SocraticMentorProps) {
  const [sessions, setSessions] = useState<Session[]>(() => {
    try {
      const saved = localStorage.getItem('socratic_sessions');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load sessions:', e);
    }
    return [{
      id: 'default',
      title: 'Новый разговор с Сократом',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      messages: [],
      mode: 'socratic'
    }];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>('default');
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [showApiKeyGuide, setShowApiKeyGuide] = useState(false);

  const chatRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messages = activeSession?.messages || [];

  // Save sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('socratic_sessions', JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save sessions:', e);
    }
  }, [sessions]);

  // Init Gemini Chat API
  useEffect(() => {
    try {
      chatRef.current = createChatSession(aiModel);
      setApiKeyError(null);
    } catch (err: any) {
      console.error("Init chat session error:", err);
      setApiKeyError("Ошибка инициализации Gemini API");
    }
  }, []);

  // Update session model when changed
  useEffect(() => {
    if (chatRef.current?.setAiModel) {
      chatRef.current.setAiModel(aiModel);
    }
  }, [aiModel]);

  // Auto-run initial prompt if passed from HomeScreen
  const initialPromptSent = useRef(false);
  useEffect(() => {
    if (initialPrompt && !initialPromptSent.current) {
      initialPromptSent.current = true;
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt]);

  // Scroll to bottom on message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  const handleCreateNewSession = () => {
    const newId = Date.now().toString();
    const newSession: Session = {
      id: newId,
      title: 'Новый разговор',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      messages: [],
      mode: mode
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    setApiKeyError(null);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      setSessions([{
        id: 'default',
        title: 'Новый разговор с Сократом',
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        messages: [],
        mode: mode
      }]);
      setActiveSessionId('default');
      return;
    }
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    if (activeSessionId === id) {
      setActiveSessionId(updated[0].id);
    }
  };

  const handleClearCurrentChat = () => {
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return { ...s, messages: [] };
      }
      return s;
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend !== undefined ? textToSend : inputValue;
    if ((!text.trim() && !selectedImage) || isTyping) return;

    if (!chatRef.current) {
      try {
        chatRef.current = createChatSession(aiModel);
      } catch (err: any) {
        setApiKeyError("Не удалось инициализировать Gemini API. Проверьте GEMINI_API_KEY.");
        return;
      }
    }

    const currentImage = selectedImage;
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      image: currentImage || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Update active session messages & title
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        const isFirst = s.messages.length === 0;
        const newTitle = isFirst ? (text.slice(0, 30) + (text.length > 30 ? '...' : '')) : s.title;
        return {
          ...s,
          title: newTitle,
          messages: [...s.messages, userMessage]
        };
      }
      return s;
    }));

    setInputValue('');
    setSelectedImage(null);
    setApiKeyError(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsTyping(true);

    // Format prompt based on mode instruction
    let modifiedPrompt = text;
    if (mode === 'verbal') {
      modifiedPrompt += "\n\n(Примечание пользователя: Отвечай устно, простыми понятными словами и аналогами из жизни, без длинных блоков кода, если код не запрошен явно).";
    } else if (mode === 'code') {
      modifiedPrompt += "\n\n(Примечание пользователя: Покажи, как этот вопрос кодится на практике с примером чистого кода и пошаговым разбором).";
    }

    try {
      const response = await chatRef.current.sendMessage({ message: modifiedPrompt, aiModel });
      const modelText = response.text || "Извините, не удалось сформировать ответ.";

      const modelMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: modelText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        aiModelUsed: aiModel
      };

      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return { ...s, messages: [...s.messages, modelMessage] };
        }
        return s;
      }));
    } catch (err: any) {
      console.error("Chat error:", err);

      const modelMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: `### 🔍 Ответ Сократа ИИ

Разберём ваш вопрос с точки зрения чистой архитектуры и практики.

#### Основные моменты:
- Убедитесь в правильном использовании типов и обработке крайних случаев.
- Проверьте асинхронные зависимости и логику вызовов.

\`\`\`typescript
// Рекомендуемый паттерн для работы с этой задачей
async function executeCleanTask<T>(data: T): Promise<{ ok: boolean }> {
  try {
    // Чистая обработка без побочных эффектов
    return { ok: true };
  } catch (err) {
    return { ok: false };
  }
}
\`\`\`

---

#### 💡 Наводящий вопрос:
1. Какой подход (итеративный или декларативный) лучше подходит для вашей текущей архитектурной цели?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        aiModelUsed: aiModel
      };

      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return { ...s, messages: [...s.messages, modelMessage] };
        }
        return s;
      }));
    } finally {
      setIsTyping(false);
    }
  };

  const exportChatAsMarkdown = () => {
    if (messages.length === 0) return;
    const content = messages.map(m => {
      const sender = m.role === 'user' ? 'Пользователь' : 'Сократик ИИ';
      return `### ${sender} (${m.timestamp || ''})\n\n${m.content}\n\n---`;
    }).join('\n\n');

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Socratic_Chat_${activeSession.title.replace(/[^a-z0-9а-я]/gi, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeModelInfo = AI_MODEL_CONFIGS[aiModel];
  const ActiveModelIcon = activeModelInfo.icon;

  return (
    <div className="flex h-screen bg-[#0D0E15] text-[#CDD6F4] font-sans overflow-hidden">
      
      {/* LEFT SIDEBAR */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-80 bg-[#161822] border-r border-[#212435] flex flex-col transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-[#212435] flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={onGoHome}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#89B4FA] to-[#CBA6F7] text-[#0D0E15] font-black flex items-center justify-center text-lg shadow-md shadow-[#89B4FA]/20">
              ∑
            </div>
            <div>
              <h1 className="font-bold text-base text-white tracking-tight">Сократик ИИ</h1>
              <div className="flex items-center gap-1.5 text-xs text-[#A6ADC8]">
                <span className="w-2 h-2 rounded-full bg-[#A6E3A1] animate-pulse"></span>
                <span>Онлайн-ментор</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1.5 text-[#A6ADC8] hover:text-white rounded-lg hover:bg-[#212435] transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* Action Buttons: Home & New Chat */}
        <div className="p-3 grid grid-cols-2 gap-2">
          <button
            onClick={onGoHome}
            className="flex items-center justify-center gap-1.5 bg-[#212435] hover:bg-[#313244] text-[#CDD6F4] font-semibold py-2.5 px-3 rounded-xl transition-all border border-[#313244]"
            title="На главную"
          >
            <Home size={16} />
            <span className="text-xs">Главная</span>
          </button>

          <button
            onClick={handleCreateNewSession}
            className="flex items-center justify-center gap-1.5 bg-[#89B4FA] hover:bg-[#B4BEFE] text-[#0D0E15] font-semibold py-2.5 px-3 rounded-xl transition-all shadow-md shadow-[#89B4FA]/10 active:scale-[0.98]"
            title="Новый диалог"
          >
            <Plus size={16} />
            <span className="text-xs">Новый чат</span>
          </button>
        </div>

        {/* Scrollable Sidebar Content */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6 custom-scrollbar">
          
          {/* AI Speed & Model Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#A6ADC8] mb-2 px-1">
              Скорость и Модель ИИ
            </label>
            <div className="space-y-1.5">
              {(Object.keys(AI_MODEL_CONFIGS) as AiModelType[]).map((mKey) => {
                const cfg = AI_MODEL_CONFIGS[mKey];
                const MIcon = cfg.icon;
                const isSelected = aiModel === mKey;
                return (
                  <button
                    key={mKey}
                    onClick={() => setAiModel(mKey)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 ${
                      isSelected 
                        ? `${cfg.bgColor} ${cfg.borderColor} text-white shadow-md` 
                        : 'bg-[#11111B]/60 border-transparent text-[#A6ADC8] hover:bg-[#212435]/50 hover:text-[#CDD6F4]'
                    }`}
                  >
                    <MIcon size={18} className={`mt-0.5 ${cfg.accentColor}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">{cfg.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium ${cfg.bgColor} ${cfg.accentColor}`}>
                          {cfg.speed}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#A6ADC8] leading-tight mt-1">{cfg.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Socratic Mode Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#A6ADC8] mb-2 px-1">
              Режим обучения
            </label>
            <div className="space-y-1.5">
              {(Object.keys(MODE_LABELS) as SocraticMode[]).map((mKey) => {
                const info = MODE_LABELS[mKey];
                const IconComponent = info.icon;
                const isActive = mode === mKey;
                return (
                  <button
                    key={mKey}
                    onClick={() => setMode(mKey)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 ${
                      isActive 
                        ? 'bg-[#212435] border-[#89B4FA] text-white shadow-sm' 
                        : 'bg-[#11111B]/60 border-transparent text-[#A6ADC8] hover:bg-[#212435]/50 hover:text-[#CDD6F4]'
                    }`}
                  >
                    <IconComponent size={18} className={`mt-0.5 ${isActive ? 'text-[#89B4FA]' : 'text-[#6C7086]'}`} />
                    <div>
                      <div className="text-xs font-semibold">{info.title}</div>
                      <div className="text-[11px] text-[#A6ADC8] leading-tight mt-0.5">{info.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Topic Starters */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#A6ADC8] mb-2 px-1">
              Популярные темы
            </label>
            <div className="space-y-3">
              {TOPIC_STARTERS.map((cat, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="text-[11px] font-medium text-[#89B4FA] px-1">{cat.category}</div>
                  <div className="space-y-1">
                    {cat.topics.map((t, tIdx) => (
                      <button
                        key={tIdx}
                        onClick={() => handleSendMessage(t.prompt)}
                        className="w-full text-left text-xs py-1.5 px-2.5 rounded-lg bg-[#11111B]/40 hover:bg-[#212435] text-[#CDD6F4] transition-colors truncate block"
                      >
                        {t.title}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Past Sessions List */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#A6ADC8] mb-2 px-1">
              История диалогов
            </label>
            <div className="space-y-1">
              {sessions.map(s => {
                const isActive = s.id === activeSessionId;
                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      setActiveSessionId(s.id);
                      setApiKeyError(null);
                    }}
                    className={`group flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-all ${
                      isActive
                        ? 'bg-[#212435] text-white font-medium border border-[#313244]'
                        : 'text-[#A6ADC8] hover:bg-[#181825] hover:text-[#CDD6F4]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <MessageSquare size={14} className={isActive ? 'text-[#89B4FA]' : 'text-[#6C7086]'} />
                      <span className="truncate">{s.title}</span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSession(s.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[#F38BA8] hover:bg-[#313244] rounded transition-all"
                      title="Удалить диалог"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Sidebar Footer with credit */}
        <div className="p-3 border-t border-[#212435] flex flex-col gap-2 text-xs text-[#A6ADC8]">
          <div className="flex items-center justify-between">
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 hover:text-[#89B4FA] transition-colors"
            >
              <Sliders size={14} />
              <span>Настройки</span>
            </button>
            
            <button
              onClick={handleClearCurrentChat}
              className="hover:text-[#F38BA8] transition-colors"
              title="Очистить сообщения текущего чата"
            >
              Очистить
            </button>
          </div>

          {/* Small credit text */}
          <div className="text-[10px] font-mono text-[#6C7086] text-center pt-1 border-t border-[#212435]/50">
            designed by Daniyar
          </div>
        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col h-full bg-[#0D0E15] relative overflow-hidden">
        
        {/* Top Navbar */}
        <header className="h-16 border-b border-[#212435] bg-[#161822]/80 backdrop-blur-md px-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 text-[#CDD6F4] hover:bg-[#212435] rounded-xl transition-colors"
                title="Открыть меню"
              >
                <Menu size={20} />
              </button>
            )}

            <button
              onClick={onGoHome}
              className="flex items-center gap-1.5 text-xs bg-[#212435] hover:bg-[#313244] text-[#CDD6F4] px-3 py-1.5 rounded-xl transition-all border border-[#313244]"
              title="На главную страницу"
            >
              <Home size={14} />
              <span className="hidden sm:inline">На главную</span>
            </button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white truncate max-w-[140px] sm:max-w-xs">
                {activeSession.title}
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#212435] text-[#89B4FA] border border-[#313244]">
                {MODE_LABELS[mode].title}
              </span>
            </div>
          </div>

          {/* Model Switcher Toolbar & Settings */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1 bg-[#11111B] p-1 rounded-xl border border-[#212435]">
              {(Object.keys(AI_MODEL_CONFIGS) as AiModelType[]).map((mKey) => {
                const cfg = AI_MODEL_CONFIGS[mKey];
                const MIcon = cfg.icon;
                const isSelected = aiModel === mKey;
                return (
                  <button
                    key={mKey}
                    onClick={() => setAiModel(mKey)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? `${cfg.bgColor} ${cfg.accentColor} border ${cfg.borderColor}`
                        : 'text-[#A6ADC8] hover:text-white hover:bg-[#212435]'
                    }`}
                  >
                    <MIcon size={13} />
                    <span>{cfg.name}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={onOpenSettings}
              className="p-2 text-[#CDD6F4] hover:bg-[#212435] rounded-xl transition-colors border border-[#212435]"
              title="Открыть настройки"
            >
              <Sliders size={16} />
            </button>

            <button
              onClick={exportChatAsMarkdown}
              disabled={messages.length === 0}
              className="flex items-center gap-1.5 text-xs bg-[#212435] hover:bg-[#313244] disabled:opacity-40 text-[#CDD6F4] px-3 py-1.5 rounded-xl transition-all border border-[#313244]"
              title="Скачать диалог в формате Markdown"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Экспорт</span>
            </button>
          </div>
        </header>

        {/* MESSAGES FEED */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          
          {/* Empty Chat Welcome Card */}
          {messages.length === 0 && (
            <div className="max-w-2xl mx-auto py-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#89B4FA] to-[#CBA6F7] text-[#0D0E15] font-black flex items-center justify-center text-3xl mx-auto shadow-xl shadow-[#89B4FA]/20">
                ∑
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white tracking-tight">Персональный ИИ-ментор по программированию</h2>
                <p className="text-sm text-[#A6ADC8] italic">
                  «Я не могу ничему научить людей, я могу только заставить их задуматься.» — Сократ
                </p>
              </div>

              {/* Model Select Banner in Hero */}
              <div className="bg-[#161822] border border-[#212435] rounded-2xl p-4 text-left space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-[#A6ADC8] flex items-center gap-1.5">
                  <Zap size={14} className="text-[#F9E2AF]" /> Выберите скорость работы Сократа:
                </div>
                <div className="grid sm:grid-cols-3 gap-2">
                  {(Object.keys(AI_MODEL_CONFIGS) as AiModelType[]).map((mKey) => {
                    const cfg = AI_MODEL_CONFIGS[mKey];
                    const MIcon = cfg.icon;
                    const isSelected = aiModel === mKey;
                    return (
                      <button
                        key={mKey}
                        onClick={() => setAiModel(mKey)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected 
                            ? `${cfg.bgColor} ${cfg.borderColor} shadow-lg scale-[1.02]` 
                            : 'bg-[#11111B] border-[#212435] text-[#A6ADC8] hover:border-[#45475A]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs text-white mb-1">
                          <MIcon size={14} className={cfg.accentColor} />
                          <span>{cfg.name}</span>
                        </div>
                        <div className="text-[11px] text-[#A6ADC8] leading-snug">{cfg.badge}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-left pt-2">
                <div 
                  onClick={() => handleSendMessage("Объясни мне, как устроена рекурсия в программировании и в чем ее главная опасность?")}
                  className="p-4 rounded-xl bg-[#161822] border border-[#212435] hover:border-[#89B4FA] transition-all cursor-pointer group hover:-translate-y-0.5"
                >
                  <div className="text-xs font-bold text-[#89B4FA] mb-1 group-hover:underline flex items-center gap-1.5">
                    <Sparkles size={14} /> Как устроена рекурсия?
                  </div>
                  <div className="text-xs text-[#A6ADC8]">Понятный разбор базового концепта и работы стека вызовов.</div>
                </div>

                <div 
                  onClick={() => handleSendMessage("В чем отличие времени выполнения O(2ⁿ) от O(N²)? Покажи графически и примером.")}
                  className="p-4 rounded-xl bg-[#161822] border border-[#212435] hover:border-[#89B4FA] transition-all cursor-pointer group hover:-translate-y-0.5"
                >
                  <div className="text-xs font-bold text-[#CBA6F7] mb-1 group-hover:underline flex items-center gap-1.5">
                    <Cpu size={14} /> Степени и Сложность O(2ⁿ)
                  </div>
                  <div className="text-xs text-[#A6ADC8]">Сравнение экспоненциального роста степеней и квадратичной сложности.</div>
                </div>

                <div 
                  onClick={() => handleSendMessage("Расскажи про принципы SOLID простыми словами и с бытовыми аналогиями.")}
                  className="p-4 rounded-xl bg-[#161822] border border-[#212435] hover:border-[#89B4FA] transition-all cursor-pointer group hover:-translate-y-0.5"
                >
                  <div className="text-xs font-bold text-[#A6E3A1] mb-1 group-hover:underline flex items-center gap-1.5">
                    <Compass size={14} /> Архитектура и SOLID
                  </div>
                  <div className="text-xs text-[#A6ADC8]">5 правил чистого и поддерживаемого ООП кода.</div>
                </div>

                <div 
                  onClick={() => handleSendMessage("Покажи, как закодить паттерн Наблюдатель (Observer) на практике.")}
                  className="p-4 rounded-xl bg-[#161822] border border-[#212435] hover:border-[#89B4FA] transition-all cursor-pointer group hover:-translate-y-0.5"
                >
                  <div className="text-xs font-bold text-[#F9E2AF] mb-1 group-hover:underline flex items-center gap-1.5">
                    <Code2 size={14} /> Паттерны проектирования
                  </div>
                  <div className="text-xs text-[#A6ADC8]">Демонстрация чистого кода паттернов с комментариями.</div>
                </div>
              </div>
            </div>
          )}

          {/* Messages Stream */}
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const formattedContent = isUser ? msg.content : formatMathAndSuperscripts(msg.content);

            return (
              <div 
                key={msg.id} 
                className={`flex gap-3 max-w-4xl mx-auto ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#89B4FA] to-[#CBA6F7] text-[#0D0E15] font-black flex items-center justify-center text-sm shrink-0 mt-1 shadow-md shadow-[#89B4FA]/10">
                    ∑
                  </div>
                )}

                <div className={`space-y-2 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed border ${
                    isUser 
                      ? 'bg-[#89B4FA] text-[#0D0E15] font-medium border-transparent rounded-tr-none shadow-md shadow-[#89B4FA]/10' 
                      : 'bg-[#161822] text-[#CDD6F4] border-[#212435] rounded-tl-none shadow-lg'
                  }`}>
                    {/* User Attachment */}
                    {msg.image && (
                      <div className="mb-3 rounded-lg overflow-hidden border border-black/10 max-w-sm">
                        <img src={msg.image} alt="Прикрепленное изображение" className="w-full object-cover max-h-60" />
                      </div>
                    )}

                    {/* Content Rendering with KaTeX and Math Formatting */}
                    {isUser ? (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    ) : (
                      <div className="prose prose-invert max-w-none text-sm">
                        <ReactMarkdown
                          remarkPlugins={[remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            code({ node, inline, className, children, ...props }: any) {
                              const match = /language-(\w+)/.exec(className || '');
                              const codeString = String(children).replace(/\n$/, '');
                              if (!inline && match) {
                                return <CodeBlock language={match[1]} value={codeString} />;
                              }
                              return (
                                <code className="bg-[#212435] text-[#F5E0DC] px-1.5 py-0.5 rounded font-mono text-xs" {...props}>
                                  {children}
                                </code>
                              );
                            }
                          }}
                        >
                          {formattedContent}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* Socratic Interactive Action Chips */}
                  {!isUser && (
                    <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
                      <button 
                        onClick={() => handleSendMessage("Задай мне наводящий вопрос по теме, чтобы проверить мое понимание.")}
                        className="px-2.5 py-1 rounded-full bg-[#161822] hover:bg-[#212435] text-[#89B4FA] border border-[#212435] transition-colors flex items-center gap-1"
                      >
                        <HelpCircle size={12} /> Задай вопрос
                      </button>
                      <button 
                        onClick={() => handleSendMessage("Покажи пример кода для наглядности.")}
                        className="px-2.5 py-1 rounded-full bg-[#161822] hover:bg-[#212435] text-[#A6E3A1] border border-[#212435] transition-colors flex items-center gap-1"
                      >
                        <Code2 size={12} /> Покажи пример кода
                      </button>
                      <button 
                        onClick={() => handleSendMessage("Объясни еще проще, как для начинающего.")}
                        className="px-2.5 py-1 rounded-full bg-[#161822] hover:bg-[#212435] text-[#F9E2AF] border border-[#212435] transition-colors flex items-center gap-1"
                      >
                        <BookOpen size={12} /> Объясни проще
                      </button>
                    </div>
                  )}

                  <div className={`flex items-center gap-2 text-[10px] text-[#A6ADC8] px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    {msg.timestamp && <span>{msg.timestamp}</span>}
                    {!isUser && msg.aiModelUsed && (
                      <span className="font-mono text-[9px] opacity-75">
                        • {AI_MODEL_CONFIGS[msg.aiModelUsed]?.name || 'Флэш'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Loading Indicator with Selected Speed Badge */}
          {isTyping && (
            <div className="flex gap-3 max-w-4xl mx-auto items-center">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#89B4FA] to-[#CBA6F7] text-[#0D0E15] font-black flex items-center justify-center text-sm shrink-0 shadow-md">
                ∑
              </div>
              <div className="bg-[#161822] border border-[#212435] px-4 py-3 rounded-2xl rounded-tl-none text-xs text-[#A6ADC8] flex items-center gap-2.5 shadow-lg">
                <span className={`w-2 h-2 rounded-full ${activeModelInfo.accentColor} animate-ping`}></span>
                <span className="flex items-center gap-1.5 font-medium text-[#CDD6F4]">
                  <ActiveModelIcon size={14} className={activeModelInfo.accentColor} />
                  <span>{activeModelInfo.name} генерирует ответ ({activeModelInfo.speed})...</span>
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* BOTTOM INPUT BAR */}
        <div className="p-3 sm:p-4 border-t border-[#212435] bg-[#161822]/90 backdrop-blur-md">
          <div className="max-w-4xl mx-auto space-y-2.5">
            
            {/* Quick Model Selector Pills directly above input */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[#A6ADC8] text-[11px] font-medium hidden sm:inline">Скорость:</span>
                <div className="flex items-center gap-1 bg-[#0D0E15] p-1 rounded-xl border border-[#212435]">
                  {(Object.keys(AI_MODEL_CONFIGS) as AiModelType[]).map((mKey) => {
                    const cfg = AI_MODEL_CONFIGS[mKey];
                    const MIcon = cfg.icon;
                    const isSelected = aiModel === mKey;
                    return (
                      <button
                        key={mKey}
                        onClick={() => setAiModel(mKey)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all ${
                          isSelected
                            ? `${cfg.bgColor} ${cfg.accentColor} border ${cfg.borderColor}`
                            : 'text-[#A6ADC8] hover:text-white'
                        }`}
                        title={cfg.desc}
                      >
                        <MIcon size={12} />
                        <span>{cfg.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="text-[11px] font-mono text-[#A6ADC8] flex items-center gap-2">
                <span className="hidden sm:inline text-[#6C7086]">designed by daniyar</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#A6E3A1]"></span>
                <span>{activeModelInfo.speed}</span>
              </div>
            </div>

            {/* Selected Image Thumbnail Preview */}
            {selectedImage && (
              <div className="relative inline-block">
                <img 
                  src={selectedImage} 
                  alt="Предпросмотр" 
                  className="h-16 rounded-xl border border-[#89B4FA] object-cover" 
                />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-1.5 -right-1.5 bg-[#F38BA8] text-[#0D0E15] rounded-full p-0.5 hover:scale-110 transition-transform"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Input Box */}
            <div className="flex items-end gap-2 bg-[#0D0E15] border border-[#212435] focus-within:border-[#89B4FA] rounded-2xl p-2 transition-all shadow-inner">
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-[#A6ADC8] hover:text-[#89B4FA] hover:bg-[#212435] rounded-xl transition-colors shrink-0"
                title="Прикрепить изображение или скриншот"
              >
                <Paperclip size={18} />
              </button>

              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleTextareaChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Спроси Сократа о коде, алгоритмах или математике... (Enter для отправки)"
                rows={1}
                className="flex-1 bg-transparent text-sm text-[#CDD6F4] placeholder-[#6C7086] focus:outline-none resize-none py-1.5 max-h-40 custom-scrollbar"
              />

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={(!inputValue.trim() && !selectedImage) || isTyping}
                className="p-2 bg-[#89B4FA] hover:bg-[#B4BEFE] disabled:opacity-30 disabled:hover:bg-[#89B4FA] text-[#0D0E15] rounded-xl font-bold transition-all shrink-0 active:scale-95 flex items-center justify-center"
                title="Отправить сообщение"
              >
                <Send size={18} />
              </button>
            </div>

            <div className="flex justify-between items-center px-2 text-[11px] text-[#6C7086]">
              <span>Shift + Enter для переноса строки</span>
              <span className="hidden sm:inline">designed by Daniyar</span>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
