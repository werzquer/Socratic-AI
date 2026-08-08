import React from 'react';
import { 
  MessageSquare, Sliders, Sparkles, Zap, Brain, Rocket, 
  ArrowRight, Cpu, Flame, Layers
} from 'lucide-react';
import { AiModelType, SocraticMode } from './SettingsModal';

interface HomeScreenProps {
  onStartChat: (prompt?: string) => void;
  onOpenSettings: () => void;
  aiModel: AiModelType;
  setAiModel: (model: AiModelType) => void;
  mode: SocraticMode;
}

const AI_MODELS: { id: AiModelType; name: string; speed: string; icon: any; color: string }[] = [
  { id: 'flash', name: 'Флэш', speed: '~1 сек', icon: Zap, color: 'text-[#F9E2AF]' },
  { id: 'thinking', name: 'Думающий', speed: '~3 сек', icon: Brain, color: 'text-[#CBA6F7]' },
  { id: 'express', name: 'Экспресс', speed: '< 1 сек', icon: Rocket, color: 'text-[#A6E3A1]' },
];

const QUICK_PROMPTS = [
  { prompt: "Как устроена рекурсия и стек вызовов?", tag: "Алгоритмы", icon: Sparkles },
  { prompt: "Сколько операций выполняет O(2ⁿ)? Объясни степени.", tag: "Математика & Big O", icon: Cpu },
  { prompt: "Как работает Event Loop под капотом в JavaScript?", tag: "Асинхронность", icon: Flame },
  { prompt: "Принципы SOLID простыми словами и с примерами.", tag: "Архитектура", icon: Layers }
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartChat,
  onOpenSettings,
  aiModel,
  setAiModel
}) => {
  return (
    <div className="min-h-screen bg-[#0D0E15] text-[#CDD6F4] font-sans flex flex-col justify-between selection:bg-[#89B4FA]/30 selection:text-white">
      
      {/* Background Decorative Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-[#89B4FA]/15 via-[#CBA6F7]/10 to-transparent blur-[120px] rounded-full opacity-60" />
      </div>

      {/* Top Navbar */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#89B4FA] to-[#CBA6F7] text-[#0D0E15] font-black flex items-center justify-center text-lg shadow-md shadow-[#89B4FA]/20">
            ∑
          </div>
          <div>
            <span className="font-bold text-base text-white tracking-tight block leading-tight">Socratic AI</span>
            <span className="text-[10px] text-[#A6ADC8] font-mono">v2.5 • Gemini Powered</span>
          </div>
        </div>

        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#161822] hover:bg-[#212435] border border-[#212435] text-xs font-semibold text-[#CDD6F4] transition-all hover:border-[#89B4FA]/50 shadow-sm"
        >
          <Sliders size={14} className="text-[#89B4FA]" />
          <span>Настройки</span>
        </button>
      </header>

      {/* Main Hero Container */}
      <main className="relative z-10 flex-1 w-full max-w-3xl mx-auto px-6 py-12 flex flex-col justify-center items-center text-center space-y-8">
        
        {/* Main Logo & Headline */}
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#161822] border border-[#212435] text-xs font-medium text-[#89B4FA]">
            <Sparkles size={13} className="text-[#F9E2AF]" />
            <span>Сократовский ИИ-ментор по программированию</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Задавай вопросы. <br />
            <span className="bg-gradient-to-r from-[#89B4FA] via-[#CBA6F7] to-[#F9E2AF] bg-clip-text text-transparent">
              Развивай код мышлением.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-[#A6ADC8] leading-relaxed max-w-xl mx-auto">
            Наводящие вопросы, чистые примеры кода и быстрая обратная связь без задержек.
          </p>
        </div>

        {/* Minimalist Model Speed Selector */}
        <div className="flex items-center justify-center gap-1.5 p-1.5 bg-[#161822] border border-[#212435] rounded-2xl shadow-lg">
          {AI_MODELS.map((m) => {
            const Icon = m.icon;
            const isSelected = aiModel === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setAiModel(m.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-[#212435] text-white shadow-sm border border-[#89B4FA]/30'
                    : 'text-[#A6ADC8] hover:text-white hover:bg-[#1E1E2E]/50'
                }`}
              >
                <Icon size={14} className={m.color} />
                <span>{m.name}</span>
                <span className="text-[10px] font-mono text-[#A6ADC8]/80">{m.speed}</span>
              </button>
            );
          })}
        </div>

        {/* Primary CTA Button */}
        <div className="w-full max-w-sm pt-2">
          <button
            onClick={() => onStartChat()}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-[#89B4FA] to-[#B4BEFE] hover:from-[#B4BEFE] hover:to-[#89B4FA] text-[#0D0E15] font-extrabold text-base py-3.5 px-6 rounded-2xl transition-all shadow-xl shadow-[#89B4FA]/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            <MessageSquare size={18} />
            <span>Начать чат с Сократом</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Quick Start Questions */}
        <div className="w-full space-y-2.5 pt-6 text-left">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#A6ADC8] px-1">
            Быстрый старт
          </div>

          <div className="grid sm:grid-cols-2 gap-2">
            {QUICK_PROMPTS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => onStartChat(q.prompt)}
                className="p-3 rounded-xl bg-[#161822] border border-[#212435] hover:border-[#89B4FA]/50 hover:bg-[#1A1D2B] transition-all flex items-center justify-between group text-left"
              >
                <div className="truncate pr-2">
                  <span className="text-[10px] font-bold text-[#89B4FA] uppercase tracking-wider block">{q.tag}</span>
                  <span className="text-xs text-[#CDD6F4] group-hover:text-white transition-colors truncate block">{q.prompt}</span>
                </div>
                <div className="p-1 rounded-lg bg-[#212435] group-hover:bg-[#89B4FA] group-hover:text-[#0D0E15] text-[#A6ADC8] transition-all shrink-0">
                  <ArrowRight size={13} />
                </div>
              </button>
            ))}
          </div>
        </div>

      </main>

      {/* Footer with credit */}
      <footer className="relative z-10 w-full py-5 border-t border-[#212435]/60 bg-[#0D0E15] text-center">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#6C7086]">
          <span>© Socratic AI • Внимание к мелочам и качеству кода</span>
          
          <span className="font-mono text-xs text-[#89B4FA]/80 tracking-widest bg-[#161822] px-3 py-1 rounded-full border border-[#212435]">
            designed by Daniyar
          </span>
        </div>
      </footer>

    </div>
  );
};
