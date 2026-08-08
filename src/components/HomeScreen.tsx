import React from 'react';
import { 
  MessageSquare, Sliders, Sparkles, Zap, Brain, Rocket, 
  Code2, HelpCircle, ArrowRight, ShieldCheck, Cpu, Compass, BookOpen,
  CheckCircle2, Flame, Layers
} from 'lucide-react';
import { AiModelType, SocraticMode } from './SettingsModal';

interface HomeScreenProps {
  onStartChat: (prompt?: string) => void;
  onOpenSettings: () => void;
  aiModel: AiModelType;
  setAiModel: (model: AiModelType) => void;
  mode: SocraticMode;
}

const AI_MODEL_LABELS: Record<AiModelType, {
  title: string;
  badge: string;
  speed: string;
  desc: string;
  icon: any;
  accent: string;
  border: string;
  bg: string;
}> = {
  flash: {
    title: 'Сократ Флэш',
    badge: '⚡ Рекомендуемый',
    speed: '~1 сек',
    desc: 'Высокая точность и молниеносная реакция для повседневной учебы.',
    icon: Zap,
    accent: 'text-[#F9E2AF]',
    border: 'border-[#F9E2AF]/40',
    bg: 'bg-[#F9E2AF]/10'
  },
  thinking: {
    title: 'Думающий Сократ',
    badge: '🧠 Глубокий анализ',
    speed: '~3-5 сек',
    desc: 'Пошаговый разбор логики для сложных задач, алгоритмов и багов.',
    icon: Brain,
    accent: 'text-[#CBA6F7]',
    border: 'border-[#CBA6F7]/40',
    bg: 'bg-[#CBA6F7]/10'
  },
  express: {
    title: 'Сократ Экспресс',
    badge: '🚀 Мгновенный',
    speed: '< 1 сек',
    desc: 'Сверхкороткие ответы и сухой код без лишних размышлений.',
    icon: Rocket,
    accent: 'text-[#A6E3A1]',
    border: 'border-[#A6E3A1]/40',
    bg: 'bg-[#A6E3A1]/10'
  }
};

const FEATURE_CARDS = [
  {
    icon: HelpCircle,
    color: 'text-[#89B4FA]',
    borderColor: 'border-[#89B4FA]/20',
    bgColor: 'bg-[#89B4FA]/10',
    title: 'Сократовский метод',
    description: 'ИИ не дает сухие решения, а задает наводящие вопросы, помогая дойти до сути самостоятельно.'
  },
  {
    icon: Zap,
    color: 'text-[#F9E2AF]',
    borderColor: 'border-[#F9E2AF]/20',
    bgColor: 'bg-[#F9E2AF]/10',
    title: 'Регулируемая скорость',
    description: 'Выбирайте между ультрабыстрым ответом (< 1 сек) и глубоким аналитическим разбором.'
  },
  {
    icon: Code2,
    color: 'text-[#A6E3A1]',
    borderColor: 'border-[#A6E3A1]/20',
    bgColor: 'bg-[#A6E3A1]/10',
    title: 'Чистый код и Математика',
    description: 'Идеальное форматирование математических степеней (2⁷, 2ⁿ) и подсвеченный код.'
  },
  {
    icon: Compass,
    color: 'text-[#CBA6F7]',
    borderColor: 'border-[#CBA6F7]/20',
    bgColor: 'bg-[#CBA6F7]/10',
    title: 'Архитектура и ООП',
    description: 'Разбор SOLID, паттернов проектирования и структур данных на наглядных метафорах.'
  }
];

const POPULAR_QUESTIONS = [
  { prompt: "Объясни мне, как устроена рекурсия и стек вызовов?", tag: "Алгоритмы", icon: Sparkles },
  { prompt: "Сколько операций выполняет O(2ⁿ) при n=10 и n=20? Объясни степени.", tag: "Математика & Big O", icon: Cpu },
  { prompt: "Как работает Event Loop под капотом в JavaScript?", tag: "Асинхронность", icon: Flame },
  { prompt: "Расскажи про принципы SOLID простыми словами и с бытовыми примерами.", tag: "Архитектура", icon: Layers }
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartChat,
  onOpenSettings,
  aiModel,
  setAiModel,
  mode
}) => {
  return (
    <div className="min-h-screen bg-[#0D0E15] text-[#CDD6F4] font-sans flex flex-col justify-between selection:bg-[#89B4FA]/30 selection:text-white">
      
      {/* Background Decorative Ambient Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-[#89B4FA]/15 via-[#CBA6F7]/10 to-transparent blur-[120px] rounded-full opacity-70" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-[#89B4FA]/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-10 -right-40 w-96 h-96 bg-[#CBA6F7]/10 blur-[100px] rounded-full" />
      </div>

      {/* Top Navbar */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#89B4FA] to-[#CBA6F7] text-[#0D0E15] font-black flex items-center justify-center text-xl shadow-lg shadow-[#89B4FA]/20">
            ∑
          </div>
          <div>
            <span className="font-bold text-lg text-white tracking-tight block leading-tight">Socratic AI</span>
            <span className="text-[11px] text-[#A6ADC8] font-mono">v2.5 • Gemini Powered</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#161822] hover:bg-[#212435] border border-[#212435] text-xs font-semibold text-[#CDD6F4] transition-all hover:border-[#89B4FA]/50 shadow-sm"
          >
            <Sliders size={15} className="text-[#89B4FA]" />
            <span>Настройки</span>
          </button>

          <button
            onClick={() => onStartChat()}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#89B4FA] hover:bg-[#B4BEFE] text-[#0D0E15] text-xs font-bold transition-all shadow-lg shadow-[#89B4FA]/20 hover:scale-105 active:scale-95"
          >
            <MessageSquare size={15} />
            <span>Войти в чат</span>
          </button>
        </div>
      </header>

      {/* Main Hero Container */}
      <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto px-6 py-8 flex flex-col justify-center items-center text-center space-y-10">
        
        {/* Main Logo & Headline Badge */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#161822] border border-[#212435] text-xs font-medium text-[#89B4FA] shadow-md">
            <Sparkles size={14} className="text-[#F9E2AF] animate-spin" style={{ animationDuration: '8s' }} />
            <span>Ускоренный ИИ-ментор по программированию</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.15]">
            Задавай вопросы. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#89B4FA] via-[#CBA6F7] to-[#F9E2AF] bg-clip-text text-transparent">
              Развивай код мышлением.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#A6ADC8] leading-relaxed max-w-2xl mx-auto font-normal">
            Socratic AI подбирает наводящие вопросы, объясняет алгоритмы на простых аналогиях 
            и мгновенно демонстрирует чистый код без задержек.
          </p>
        </div>

        {/* Primary CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center max-w-md">
          <button
            onClick={() => onStartChat()}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-3 bg-gradient-to-r from-[#89B4FA] to-[#B4BEFE] hover:from-[#B4BEFE] hover:to-[#89B4FA] text-[#0D0E15] font-extrabold text-base py-4 px-8 rounded-2xl transition-all shadow-xl shadow-[#89B4FA]/25 hover:scale-[1.02] active:scale-[0.98]"
          >
            <MessageSquare size={20} />
            <span>Начать чат с Сократом</span>
            <ArrowRight size={18} />
          </button>

          <button
            onClick={onOpenSettings}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-[#161822] hover:bg-[#212435] border border-[#212435] hover:border-[#89B4FA]/60 text-white font-bold text-base py-4 px-6 rounded-2xl transition-all shadow-md"
          >
            <Sliders size={18} className="text-[#89B4FA]" />
            <span>Настройки</span>
          </button>
        </div>

        {/* Speed Selector Box */}
        <div className="w-full max-w-3xl bg-[#161822]/80 border border-[#212435] backdrop-blur-md rounded-3xl p-5 text-left shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-[#212435] pb-3">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-[#F9E2AF]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#CDD6F4]">Выбери скорость работы ИИ</span>
            </div>
            <span className="text-[11px] text-[#A6ADC8] font-mono">Переключение на лету</span>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            {(Object.keys(AI_MODEL_LABELS) as AiModelType[]).map((mKey) => {
              const cfg = AI_MODEL_LABELS[mKey];
              const MIcon = cfg.icon;
              const isSelected = aiModel === mKey;
              return (
                <button
                  key={mKey}
                  onClick={() => setAiModel(mKey)}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                    isSelected 
                      ? `${cfg.bg} ${cfg.border} shadow-lg ring-1 ring-white/10` 
                      : 'bg-[#11111B]/80 border-[#212435] text-[#A6ADC8] hover:border-[#45475A] hover:bg-[#181825]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                      <MIcon size={15} className={cfg.accent} />
                      <span>{cfg.title}</span>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${cfg.bg} ${cfg.accent}`}>
                      {cfg.speed}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A6ADC8] leading-tight mt-1.5">{cfg.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-2">
          {FEATURE_CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <div 
                key={i}
                className="p-5 rounded-2xl bg-[#161822]/60 border border-[#212435] hover:border-[#313244] transition-all flex items-start gap-4"
              >
                <div className={`p-3 rounded-xl ${card.bgColor} ${card.color} shrink-0`}>
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white mb-1">{card.title}</h3>
                  <p className="text-xs text-[#A6ADC8] leading-relaxed">{card.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Launch Questions */}
        <div className="w-full max-w-4xl space-y-3 pt-4">
          <div className="text-xs font-bold uppercase tracking-wider text-[#A6ADC8] text-left px-1">
            Популярные вопросы для быстрого старта
          </div>

          <div className="grid sm:grid-cols-2 gap-2 text-left">
            {POPULAR_QUESTIONS.map((q, idx) => {
              const QIcon = q.icon;
              return (
                <button
                  key={idx}
                  onClick={() => onStartChat(q.prompt)}
                  className="p-3.5 rounded-2xl bg-[#161822] border border-[#212435] hover:border-[#89B4FA] hover:bg-[#1A1D2B] transition-all flex items-center justify-between group"
                >
                  <div className="space-y-0.5 truncate pr-2">
                    <span className="text-[10px] font-bold text-[#89B4FA] uppercase tracking-wider block">{q.tag}</span>
                    <span className="text-xs text-[#CDD6F4] group-hover:text-white transition-colors truncate block">{q.prompt}</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[#212435] group-hover:bg-[#89B4FA] group-hover:text-[#0D0E15] text-[#A6ADC8] transition-all shrink-0">
                    <ArrowRight size={14} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </main>

      {/* Footer with credit */}
      <footer className="relative z-10 w-full py-6 border-t border-[#212435]/60 bg-[#0D0E15] text-center">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#6C7086]">
          <span>© Socratic AI • Внимание к мелочам и качеству кода</span>
          
          {/* Requested specific credit text */}
          <span className="font-mono text-xs text-[#89B4FA]/80 tracking-widest bg-[#161822] px-3 py-1 rounded-full border border-[#212435]">
            designed by Daniyar
          </span>
        </div>
      </footer>

    </div>
  );
};
