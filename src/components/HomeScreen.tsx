import React, { useState } from 'react';
import { 
  MessageSquare, Sliders, Sparkles, Zap, Brain, Rocket, 
  ArrowRight, Cpu, Flame, Layers, BookOpen, Quote
} from 'lucide-react';
import { AiModelType, SocraticMode } from './SettingsModal';
import { SOCRATIC_QUOTES } from '../data/socraticQuotes';

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
  { prompt: "Разбери отступы, типы данных и поток выполнения в моём Python коде", tag: "Python", icon: Sparkles },
  { prompt: "Как мыслить классами и объектами в Java при проектировании?", tag: "Java", icon: Layers },
  { prompt: "Как правильно выстроить смысловой каркас страницы на HTML?", tag: "HTML", icon: Cpu },
  { prompt: "Почему CSS элементы 'толкают' и 'перекрывают' друг друга на странице?", tag: "CSS", icon: Flame }
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartChat,
  onOpenSettings,
  aiModel,
  setAiModel
}) => {
  const [activeTab, setActiveTab] = useState<'tech' | 'philosophy'>('tech');

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
            <span className="font-bold text-base text-white tracking-tight block leading-tight">Socratic AI mentor</span>
            <span className="text-[10px] text-[#A6ADC8] font-mono">v2.5 • Ментор & Философ</span>
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
      <main className="relative z-10 flex-1 w-full max-w-3xl mx-auto px-6 py-8 sm:py-12 flex flex-col justify-center items-center text-center space-y-8">
        
        {/* Main Logo & Headline */}
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#161822] border border-[#212435] text-xs font-medium text-[#89B4FA]">
            <Sparkles size={13} className="text-[#F9E2AF]" />
            <span>Сократовский ИИ-ментор по программированию и философии</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Задавай вопросы. <br />
            <span className="bg-gradient-to-r from-[#89B4FA] via-[#CBA6F7] to-[#F9E2AF] bg-clip-text text-transparent">
              Развивай код и мышление.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-[#A6ADC8] leading-relaxed max-w-xl mx-auto">
            Живой диалог, наводящие вопросы Сократа, чистые примеры кода и философские мысли древности.
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
            <span>Начать диалог с Сократом</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Section Tabs Switcher (IT vs Philosophy) */}
        <div className="w-full pt-4 space-y-4">
          <div className="flex items-center justify-between border-b border-[#212435] pb-2 px-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('tech')}
                className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider pb-1 transition-all border-b-2 ${
                  activeTab === 'tech'
                    ? 'text-[#89B4FA] border-[#89B4FA]'
                    : 'text-[#A6ADC8] border-transparent hover:text-white'
                }`}
              >
                <Cpu size={14} />
                <span>Код & Алгоритмы</span>
              </button>
              <button
                onClick={() => setActiveTab('philosophy')}
                className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider pb-1 transition-all border-b-2 ${
                  activeTab === 'philosophy'
                    ? 'text-[#CBA6F7] border-[#CBA6F7]'
                    : 'text-[#A6ADC8] border-transparent hover:text-white'
                }`}
              >
                <Quote size={14} />
                <span>Философия Сократа</span>
              </button>
            </div>
            <span className="text-[10px] text-[#6C7086]">Выберите тему</span>
          </div>

          {/* Tab 1: Tech Prompts */}
          {activeTab === 'tech' && (
            <div className="grid sm:grid-cols-2 gap-2.5 text-left animate-fade-in">
              {QUICK_PROMPTS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => onStartChat(q.prompt)}
                  className="p-3.5 rounded-xl bg-[#161822] border border-[#212435] hover:border-[#89B4FA]/50 hover:bg-[#1A1D2B] transition-all flex items-center justify-between group text-left"
                >
                  <div className="truncate pr-2">
                    <span className="text-[10px] font-bold text-[#89B4FA] uppercase tracking-wider block">{q.tag}</span>
                    <span className="text-xs text-[#CDD6F4] group-hover:text-white transition-colors truncate block">{q.prompt}</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[#212435] group-hover:bg-[#89B4FA] group-hover:text-[#0D0E15] text-[#A6ADC8] transition-all shrink-0">
                    <ArrowRight size={13} />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Tab 2: Socratic Philosophical Quotes */}
          {activeTab === 'philosophy' && (
            <div className="grid sm:grid-cols-2 gap-2.5 text-left animate-fade-in">
              {SOCRATIC_QUOTES.slice(0, 6).map((q) => (
                <button
                  key={q.id}
                  onClick={() => onStartChat(q.prompt)}
                  className="p-3.5 rounded-xl bg-[#161822] border border-[#212435] hover:border-[#CBA6F7]/50 hover:bg-[#1A1D2B] transition-all flex flex-col justify-between group text-left space-y-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#CBA6F7] uppercase tracking-wider">{q.category}</span>
                      <BookOpen size={12} className="text-[#A6ADC8] group-hover:text-[#CBA6F7] transition-colors" />
                    </div>
                    <p className="text-xs font-semibold text-white group-hover:text-[#F9E2AF] transition-colors italic leading-snug">
                      «{q.quote}»
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-[#212435]/50 text-[10px] text-[#A6ADC8]">
                    <span className="truncate pr-2">{q.explanation}</span>
                    <span className="text-[#CBA6F7] font-bold group-hover:translate-x-0.5 transition-transform shrink-0">Обсудить →</span>
                  </div>
                </button>
              ))}
            </div>
          )}
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

