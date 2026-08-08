import React, { useState, useRef, useEffect } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import { Send, Lightbulb, Play, AlertCircle, RefreshCw, Paperclip, X, TerminalSquare, ArrowLeft } from 'lucide-react';
import { createChatSession, runCode, auditCode, getAutocomplete } from '../services/ai';
import { cn } from '../lib/utils';
import { useNavigate, useParams } from 'react-router-dom';
import { useProjectStore } from '../stores/projectStore';

type Message = {
  id: string;
  role: 'user' | 'model';
  content: string;
  image?: string;
};

export default function SocraticMentor() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { projects, updateProject } = useProjectStore();
  
  const currentProject = projects.find(p => p.id === projectId);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [code, setCode] = useState<string>(currentProject?.previewCode || '# Напиши свой код здесь...\n');
  const [language, setLanguage] = useState<'python' | 'javascript' | 'sql' | 'plaintext'>((currentProject?.language as any) || 'javascript');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [output, setOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  
  const chatRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastAutocompleteRequestRef = useRef<number>(0);
  const monaco = useMonaco();

  useEffect(() => {
    // Auto-save
    const timer = setTimeout(() => {
      if (currentProject && code !== currentProject.previewCode) {
        updateProject(currentProject.id, { previewCode: code });
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [code, currentProject, updateProject]);


  useEffect(() => {
    if (monaco) {
      const provider = monaco.languages.registerInlineCompletionsProvider(
        ['javascript', 'python', 'sql'],
        {
          provideInlineCompletions: async (model, position, context, token) => {
            const requestId = Date.now();
            lastAutocompleteRequestRef.current = requestId;

            // Debounce: wait for 1500ms pause in typing for the free tier
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            if (lastAutocompleteRequestRef.current !== requestId || token.isCancellationRequested) {
              return { items: [] };
            }
            
            const codeBefore = model.getValueInRange({
              startLineNumber: 1,
              startColumn: 1,
              endLineNumber: position.lineNumber,
              endColumn: position.column
            });
            const codeAfter = model.getValueInRange({
              startLineNumber: position.lineNumber,
              startColumn: position.column,
              endLineNumber: model.getLineCount(),
              endColumn: model.getLineMaxColumn(model.getLineCount())
            });
            
            try {
              const suggestion = await getAutocomplete(codeBefore, codeAfter, language);
              if (suggestion) {
                return {
                  items: [{
                    insertText: suggestion,
                    range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
                  }]
                };
              }
            } catch (err) {
              // ignore autocomplete errors
            }
            return { items: [] };
          },
          freeInlineCompletions: () => {}
        }
      );
      return () => provider.dispose();
    }
  }, [monaco, language]);

  useEffect(() => {
    try {
      chatRef.current = createChatSession();
      setMessages([
        {
          id: '1',
          role: 'model',
          content: 'Привет! Я Сократ, твой ИИ-ментор. Моя задача — задавать правильные вопросы, чтобы ты сам нашел ответ. С какой задачей мы сегодня разбираемся? (Выбери язык справа и напиши код, либо опиши проблему)'
        }
      ]);
    } catch (error) {
      console.error(error);
      setMessages([
        {
          id: 'error',
          role: 'model',
          content: 'Ошибка: Необходим API ключ Gemini (GEMINI_API_KEY) для запуска ментора.'
        }
      ]);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (text: string, isCodeAudit = false) => {
    if ((!text.trim() && !selectedImage) || !chatRef.current) return;

    const currentImage = selectedImage;
    const newMessage: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: text,
      image: currentImage || undefined
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setSelectedImage(null);
    setIsTyping(true);

    try {
      let response;
      if (currentImage) {
        const base64Data = currentImage.split(',')[1];
        const mimeType = currentImage.split(',')[0].split(':')[1].split(';')[0];
        
        response = await chatRef.current.sendMessage({
          message: [
            { text: text || "Проанализируй этот скриншот." },
            { inlineData: { data: base64Data, mimeType } }
          ]
        });
      } else {
        response = await chatRef.current.sendMessage({ message: text });
      }
      
      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: response.text || '...'
      };
      setMessages(prev => [...prev, responseMessage]);
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.message?.includes("429") || error.message?.includes("квота")
        ? "⚠️ **Превышена квота запросов.** Режим бесплатного Gemini API ограничен 5 запросами в минуту. Пожалуйста, подождите 30-60 секунд и попробуйте снова."
        : "*Ошибка!* Произошел сбой при генерации ответа. Проверьте API ключ или попробуйте позже.";
        
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: errorMessage
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCheckCode = async () => {
    setIsTyping(true);
    try {
      const responseText = await auditCode(code, language, output || "Ошибок при исполнении не было (или код не запускался).");
      const responseMessage: Message = {
        id: Date.now().toString(),
        role: 'model',
        content: responseText
      };
      setMessages(prev => [...prev, responseMessage]);
    } catch (e: any) {
      console.error(e);
      const errorMessage = e.message?.includes("429") || e.message?.includes("квота")
        ? "⚠️ **Превышена квота запросов.** Пожалуйста, подождите минуту."
        : "*Ошибка аудита!* Не удалось проанализировать код.";
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        content: errorMessage
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleExecuteCode = async () => {
    setIsRunning(true);
    setOutput(null);
    try {
      const res = await runCode(code, language);
      setOutput(res.output);
      
      // Auto-audit if error
      if (!res.success) {
        setIsTyping(true);
        try {
          const responseText = await auditCode(code, language, res.output);
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'model',
            content: `**Я заметил ошибку при выполнении кода.**\n\n${responseText}`
          }]);
        } catch (auditErr: any) {
          console.error("Auto-audit failed:", auditErr);
          // Don't show error message for auto-audit to not clutter UI if rate limited
        }
        setIsTyping(false);
      }
    } catch (err: any) {
      setOutput(`Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const clearHistory = () => {
    chatRef.current = createChatSession();
    setMessages([{
      id: Date.now().toString(),
      role: 'model',
      content: 'История очищена. Начнем с чистого листа! Что будем изучать?'
    }]);
  };

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      
      {/* LEFT PANE: Chat */}
      <div className="w-1/2 flex flex-col border-r border-zinc-800 bg-zinc-900/40">
        <header className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              S
            </div>
            <div>
              <h1 className="font-semibold text-zinc-100 text-sm">Ментор Сократ</h1>
              <p className="text-[11px] text-indigo-400 font-medium tracking-wide">Метод Сократа</p>
            </div>
          </div>
          <button 
            onClick={clearHistory} 
            className="p-2 text-zinc-500 hover:text-zinc-200 transition-colors rounded-lg hover:bg-zinc-800"
            title="Сбросить историю"
          >
            <RefreshCw size={16} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[85%] rounded-2xl px-5 py-3.5 leading-relaxed text-[15px] shadow-sm",
                msg.role === 'user' 
                  ? "bg-indigo-600 font-medium text-white rounded-br-sm shadow-indigo-600/10" 
                  : "bg-zinc-800/80 text-zinc-200 rounded-bl-sm border border-zinc-700/50"
              )}>
                {msg.image && (
                  <img src={msg.image} alt="Upload" className="max-w-full rounded-lg mb-3 object-cover max-h-60" />
                )}
                {msg.role === 'user' ? (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                ) : (
                  <div className="markdown-body prose prose-invert max-w-none prose-p:my-1 prose-pre:my-3 prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800 prose-code:text-indigo-300">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-5 py-4 bg-zinc-800/80 rounded-bl-sm border border-zinc-700/50 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" />
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '0.15s' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '0.3s' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 backdrop-blur">
          <div className="flex gap-2 mb-3">
            <button 
              onClick={() => handleSendMessage('Понял! Эврика! Давай закрепим.')}
              className="flex items-center gap-1.5 text-[11px] font-semibold bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 px-3 py-1.5 rounded-full transition-colors border border-amber-500/20"
            >
              <Lightbulb size={13} fill="currentColor" className="opacity-80" />
              Ага-момент!
            </button>
            <button 
              onClick={() => handleSendMessage('Я застрял, можешь дать аналогию из реальной жизни?')}
              className="flex items-center gap-1.5 text-[11px] font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 px-3 py-1.5 rounded-full transition-colors border border-zinc-700"
            >
              <AlertCircle size={13} />
              Нужна подсказка
            </button>
          </div>
          
          {selectedImage && (
            <div className="mb-3 relative inline-block">
               <img src={selectedImage} alt="Preview" className="h-16 rounded border border-zinc-700" />
               <button 
                 onClick={() => setSelectedImage(null)}
                 className="absolute -top-2 -right-2 bg-zinc-800 rounded-full p-1 border border-zinc-600 hover:bg-zinc-700"
               >
                 <X size={12} className="text-zinc-300"/>
               </button>
            </div>
          )}

          <div className="relative flex items-center bg-zinc-900 border border-zinc-700 rounded-xl focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="pl-3 pr-2 text-zinc-400 hover:text-indigo-400 transition-colors"
              title="Прикрепить скриншот"
            >
              <Paperclip size={18} />
            </button>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleImageUpload}
            />
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                }
              }}
              placeholder="Спроси или опиши логику..."
              className="w-full bg-transparent py-3 pr-12 focus:outline-none resize-none text-[15px]"
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
            <button 
              onClick={() => handleSendMessage(inputValue)}
              disabled={(!inputValue.trim() && !selectedImage) || isTyping}
              className="absolute right-2 p-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:bg-zinc-800/50 disabled:text-zinc-500 transition-colors shadow-sm"
            >
              <Send size={16} />
            </button>
          </div>
          <div className="mt-2 text-center text-[10px] text-zinc-500 uppercase tracking-widest font-medium">
            Shift + Enter для новой строки
          </div>
        </div>
      </div>

      {/* RIGHT PANE: Code Editor */}
      <div className="w-1/2 flex flex-col bg-zinc-950">
        <header className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex gap-1.5 p-1 bg-zinc-900 rounded-lg border border-zinc-800">
              {(['python', 'javascript', 'sql', 'plaintext'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    setLanguage(lang);
                    if (currentProject) updateProject(currentProject.id, { language: lang });
                  }}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold rounded-md transition-all capitalize",
                    language === lang 
                      ? "bg-zinc-800 text-indigo-300 shadow-sm" 
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                  )}
              >
                {lang === 'plaintext' ? 'Excel / Text' : lang}
              </button>
            ))}
          </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleExecuteCode}
              disabled={isRunning || language === 'plaintext'}
              className="flex items-center gap-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 tracking-wide uppercase shadow-[0_0_15px_-3px_rgba(99,102,241,0.1)] border border-indigo-500/20"
            >
              <TerminalSquare size={14} />
              {isRunning ? 'Run...' : 'Run Code'}
            </button>
            <button 
              onClick={handleCheckCode}
              disabled={isTyping}
              className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 tracking-wide uppercase shadow-[0_0_15px_-3px_rgba(16,185,129,0.1)]"
            >
              <Lightbulb size={14} />
              Аудит Логики
            </button>
          </div>
        </header>
        
        <div className="flex-1 relative pt-2">
          <Editor
            height={output !== null ? "70%" : "100%"}
            language={language}
            theme="vs-dark"
            value={code}
            onChange={(val) => setCode(val || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
              padding: { top: 16 },
              lineNumbersMinChars: 4,
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              formatOnPaste: true,
              inlineSuggest: { enabled: true }
            }}
          />
          {output !== null && (
            <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-zinc-950 border-t border-zinc-800 flex flex-col shadow-2xl">
              <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/50 bg-zinc-900/50">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <TerminalSquare size={12} /> Execution Output
                </span>
                <button 
                  onClick={() => setOutput(null)} 
                  className="text-zinc-500 hover:text-zinc-300"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4 text-[13px] font-mono text-zinc-300 whitespace-pre-wrap">
                {output}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
