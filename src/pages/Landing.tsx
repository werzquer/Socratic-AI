import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Code2, Sparkles, Cloud, ArrowRight } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleLogin = async () => {
    await login('test@example.com', 'password');
    navigate('/dashboard');
  };

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#11111B] text-[#CDD6F4] font-sans">
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="bg-[#89B4FA] text-[#11111B] p-2 rounded-lg font-bold">∑</div>
          <span className="font-bold text-xl tracking-tight text-white">Сократ</span>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleLogin}
            className="hover:text-white transition-colors"
          >
            Войти
          </button>
          <button 
            onClick={handleLogin}
            className="bg-[#89B4FA] text-[#11111B] px-4 py-2 rounded-lg font-semibold hover:bg-opacity-90 transition-all"
          >
            Начать бесплатно
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
          Пиши код. Учись быстрее. <br/>
          <span className="text-[#89B4FA]">С ИИ-помощником.</span>
        </h1>
        <p className="text-xl text-[#A6ADC8] mb-12 max-w-2xl mx-auto">
          Сократ — бесплатный интерактивный ментор по программированию, который объясняет, 
          исправляет и улучшает твой код в реальном времени.
        </p>

        <div className="flex justify-center gap-4 mb-24">
          <button 
            onClick={handleLogin}
            className="flex items-center gap-2 bg-[#89B4FA] text-[#11111B] px-6 py-3 rounded-lg font-bold text-lg hover:bg-opacity-90 transition-all"
          >
            Начать бесплатно <ArrowRight size={20} />
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 text-left">
          <div className="bg-[#181825] p-6 rounded-2xl border border-[#313244]">
            <div className="bg-[#1E1E2E] w-12 h-12 rounded-lg flex items-center justify-center mb-6">
              <Code2 className="text-[#A6E3A1]" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">Редактор как VS Code</h3>
            <p className="text-[#A6ADC8]">Мощный встроенный редактор с подсветкой синтаксиса, автодополнением и поддержкой всех языков.</p>
          </div>
          
          <div className="bg-[#181825] p-6 rounded-2xl border border-[#313244]">
            <div className="bg-[#1E1E2E] w-12 h-12 rounded-lg flex items-center justify-center mb-6">
              <Sparkles className="text-[#89B4FA]" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">ИИ-ментор Сократ</h3>
            <p className="text-[#A6ADC8]">Объясняет сложный код, находит баги и предлагает лучшие практики прямо во время написания.</p>
          </div>

          <div className="bg-[#181825] p-6 rounded-2xl border border-[#313244]">
            <div className="bg-[#1E1E2E] w-12 h-12 rounded-lg flex items-center justify-center mb-6">
              <Cloud className="text-[#F5C2E7]" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">Облачные проекты</h3>
            <p className="text-[#A6ADC8]">Ваш код всегда с вами. Автосохранение в облако и возможность поделиться ссылкой.</p>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#313244] mt-20 py-8 text-center text-[#6C7086]">
        <p>Сделано в Казахстане 🇰🇿</p>
      </footer>
    </div>
  );
}
