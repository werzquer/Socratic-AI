import React from 'react';
import { 
  X, Sliders, Zap, Brain, Rocket, HelpCircle, BookOpen, 
  Code2, Trash2, Key, Check, ShieldCheck, RefreshCw
} from 'lucide-react';

export type AiModelType = 'flash' | 'thinking' | 'express';
export type SocraticMode = 'socratic' | 'verbal' | 'code';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiModel: AiModelType;
  setAiModel: (model: AiModelType) => void;
  mode: SocraticMode;
  setMode: (mode: SocraticMode) => void;
  onClearHistory: () => void;
  hasApiKey: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  aiModel,
  setAiModel,
  mode,
  setMode,
  onClearHistory,
  hasApiKey
}) => {
  const [customKey, setCustomKey] = React.useState<string>(() => {
    try {
      return localStorage.getItem('socratic_custom_api_key') || '';
    } catch (e) {
      return '';
    }
  });
  const [showKeyInput, setShowKeyInput] = React.useState(false);

  const handleSaveKey = (val: string) => {
    setCustomKey(val);
    try {
      if (val.trim()) {
        localStorage.setItem('socratic_custom_api_key', val.trim());
      } else {
        localStorage.removeItem('socratic_custom_api_key');
      }
    } catch (e) {
      console.error("Failed to set key:", e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-[#161822] border border-[#212435] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#212435] flex items-center justify-between bg-[#1E1E2E]/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#89B4FA]/10 text-[#89B4FA] border border-[#89B4FA]/20">
              <Sliders size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Настройки Сократика</h2>
              <p className="text-xs text-[#A6ADC8]">Персонализация скорости, режимов и параметров ИИ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#A6ADC8] hover:text-white rounded-xl hover:bg-[#212435] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
          
          {/* AI Speed & Model Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-[#89B4FA] block">
              Модель ИИ и Скорость Ответа
            </label>
            <div className="grid gap-2.5">
              
              <button
                onClick={() => setAiModel('flash')}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                  aiModel === 'flash'
                    ? 'bg-[#F9E2AF]/10 border-[#F9E2AF] text-white shadow-lg'
                    : 'bg-[#11111B] border-[#212435] text-[#A6ADC8] hover:border-[#45475A]'
                }`}
              >
                <div className="p-2 rounded-xl bg-[#F9E2AF]/20 text-[#F9E2AF] mt-0.5">
                  <Zap size={18} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">Сократ Флэш</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#F9E2AF]/20 text-[#F9E2AF] font-mono font-bold">
                      ~1 сек (Рекомендуется)
                    </span>
                  </div>
                  <p className="text-xs text-[#A6ADC8] mt-1">
                    Сбалансированная модель с высокой точностью и мгновенным откликом для ежедневного обучения.
                  </p>
                </div>
              </button>

              <button
                onClick={() => setAiModel('thinking')}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                  aiModel === 'thinking'
                    ? 'bg-[#CBA6F7]/10 border-[#CBA6F7] text-white shadow-lg'
                    : 'bg-[#11111B] border-[#212435] text-[#A6ADC8] hover:border-[#45475A]'
                }`}
              >
                <div className="p-2 rounded-xl bg-[#CBA6F7]/20 text-[#CBA6F7] mt-0.5">
                  <Brain size={18} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">Думающий Сократ</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#CBA6F7]/20 text-[#CBA6F7] font-mono font-bold">
                      ~3-5 сек
                    </span>
                  </div>
                  <p className="text-xs text-[#A6ADC8] mt-1">
                    Пошаговое глубокое рассуждение. Идеально для тяжелых алгоритмов, архитектуры и сложных багов.
                  </p>
                </div>
              </button>

              <button
                onClick={() => setAiModel('express')}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                  aiModel === 'express'
                    ? 'bg-[#A6E3A1]/10 border-[#A6E3A1] text-white shadow-lg'
                    : 'bg-[#11111B] border-[#212435] text-[#A6ADC8] hover:border-[#45475A]'
                }`}
              >
                <div className="p-2 rounded-xl bg-[#A6E3A1]/20 text-[#A6E3A1] mt-0.5">
                  <Rocket size={18} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">Сократ Экспресс</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#A6E3A1]/20 text-[#A6E3A1] font-mono font-bold">
                      &lt; 1 сек
                    </span>
                  </div>
                  <p className="text-xs text-[#A6ADC8] mt-1">
                    Сверхбыстрые короткие ответы и чистый код без вводных размышлений.
                  </p>
                </div>
              </button>

            </div>
          </div>

          {/* Socratic Teaching Mode */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-[#89B4FA] block">
              Предпочитаемый режим обучения
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              
              <button
                onClick={() => setMode('socratic')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  mode === 'socratic'
                    ? 'bg-[#212435] border-[#89B4FA] text-white font-medium'
                    : 'bg-[#11111B] border-[#212435] text-[#A6ADC8] hover:border-[#45475A]'
                }`}
              >
                <HelpCircle size={16} className="text-[#89B4FA] mb-1.5" />
                <div className="text-xs font-bold">Сократовский</div>
                <div className="text-[10px] text-[#A6ADC8] mt-0.5">Наводящие вопросы</div>
              </button>

              <button
                onClick={() => setMode('verbal')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  mode === 'verbal'
                    ? 'bg-[#212435] border-[#89B4FA] text-white font-medium'
                    : 'bg-[#11111B] border-[#212435] text-[#A6ADC8] hover:border-[#45475A]'
                }`}
              >
                <BookOpen size={16} className="text-[#F9E2AF] mb-1.5" />
                <div className="text-xs font-bold">Устный разбор</div>
                <div className="text-[10px] text-[#A6ADC8] mt-0.5">Простые аналогии</div>
              </button>

              <button
                onClick={() => setMode('code')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  mode === 'code'
                    ? 'bg-[#212435] border-[#89B4FA] text-white font-medium'
                    : 'bg-[#11111B] border-[#212435] text-[#A6ADC8] hover:border-[#45475A]'
                }`}
              >
                <Code2 size={16} className="text-[#A6E3A1] mb-1.5" />
                <div className="text-xs font-bold">Пример кода</div>
                <div className="text-[10px] text-[#A6ADC8] mt-0.5">Чистая реализация</div>
              </button>

            </div>
          </div>

          {/* System Environment & Storage */}
          <div className="space-y-3 pt-2 border-t border-[#212435]">
            <label className="text-xs font-bold uppercase tracking-wider text-[#89B4FA] block">
              Состояние системы и данных
            </label>

            <div className="p-3.5 rounded-2xl bg-[#11111B] border border-[#212435] text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Key size={16} className="text-[#89B4FA]" />
                  <div>
                    <div className="font-semibold text-white">Gemini API Key</div>
                    <div className="text-[11px] text-[#A6ADC8]">
                      {customKey ? 'Используется пользовательский ключ' : 'Интегрирован через серверный прокси'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowKeyInput(!showKeyInput)}
                    className="text-[11px] text-[#89B4FA] hover:underline"
                  >
                    {showKeyInput ? 'Скрыть' : (customKey ? 'Изменить' : 'Свой ключ')}
                  </button>
                  <span className="flex items-center gap-1 text-[11px] text-[#A6E3A1] font-mono font-medium bg-[#A6E3A1]/10 px-2.5 py-1 rounded-full border border-[#A6E3A1]/20">
                    <ShieldCheck size={12} /> Активен
                  </span>
                </div>
              </div>

              {showKeyInput && (
                <div className="pt-2 border-t border-[#212435] flex items-center gap-2">
                  <input
                    type="password"
                    placeholder="Вставьте AI Studio / Gemini API key..."
                    value={customKey}
                    onChange={(e) => handleSaveKey(e.target.value)}
                    className="flex-1 bg-[#161822] border border-[#212435] focus:border-[#89B4FA] text-white text-xs px-3 py-1.5 rounded-xl outline-none font-mono"
                  />
                  {customKey && (
                    <button
                      onClick={() => handleSaveKey('')}
                      className="px-2.5 py-1.5 rounded-xl bg-[#212435] hover:bg-[#313244] text-[#F38BA8] text-[11px] font-semibold"
                    >
                      Сбросить
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#11111B] border border-[#212435] text-xs">
              <div>
                <div className="font-semibold text-white">История чатов</div>
                <div className="text-[11px] text-[#A6ADC8]">Локальное хранилище сессий</div>
              </div>
              <button
                onClick={() => {
                  if (confirm("Вы уверены, что хотите очистить всю историю диалогов?")) {
                    onClearHistory();
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-[#F38BA8]/10 hover:bg-[#F38BA8]/20 text-[#F38BA8] font-semibold transition-all flex items-center gap-1.5"
              >
                <Trash2 size={13} /> Очистить
              </button>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#212435] bg-[#1E1E2E]/40 flex items-center justify-between">
          <span className="text-[11px] font-mono text-[#6C7086]">designed by Daniyar</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#89B4FA] hover:bg-[#B4BEFE] text-[#0D0E15] font-bold text-xs transition-all shadow-md"
          >
            Сохранить и Закрыть
          </button>
        </div>

      </div>
    </div>
  );
};
