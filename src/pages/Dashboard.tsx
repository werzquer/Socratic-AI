import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useProjectStore } from '../stores/projectStore';
import { Plus, Search, LogOut, Code2 } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const { projects, fetchProjects, createProject, isLoading } = useProjectStore();
  
  const [search, setSearch] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newLang, setNewLang] = useState('javascript');

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    const id = await createProject(newTitle, newLang, false);
    setModalOpen(false);
    navigate(`/editor/${id}`);
  };

  const filtered = projects.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#11111B] text-[#CDD6F4] font-sans">
      <nav className="border-b border-[#313244] bg-[#181825] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-[#89B4FA] text-[#11111B] p-1.5 rounded-md font-bold text-sm">∑</div>
          <span className="font-bold text-lg">Сократик ИИ</span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-[#A6ADC8]">{user?.name}</span>
          <button onClick={handleLogout} className="text-[#F38BA8] hover:text-white transition-colors" title="Выйти">
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl font-bold">Мои проекты</h1>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6C7086]" size={18} />
              <input 
                type="text" 
                placeholder="Поиск..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-[#181825] border border-[#313244] rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-[#89B4FA] transition-colors"
              />
            </div>
            <button 
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 bg-[#89B4FA] text-[#11111B] px-4 py-2 rounded-lg font-semibold hover:bg-opacity-90 transition-all"
            >
              <Plus size={20} /> Новый проект
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-[#A6ADC8]">Загрузка проектов...</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(p => (
              <div 
                key={p.id} 
                onClick={() => navigate(`/editor/${p.id}`)}
                className="bg-[#181825] border border-[#313244] rounded-xl p-5 hover:border-[#89B4FA] hover:-translate-y-1 transition-all cursor-pointer shadow-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold truncate">{p.title}</h3>
                  <Code2 className="text-[#89B4FA]" size={20} />
                </div>
                <div className="text-sm border-t border-[#313244] mt-3 pt-3 flex justify-between text-[#A6ADC8]">
                  <span>{p.language}</span>
                  <span>{p.updatedAt}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[#181825] border border-[#313244] rounded-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">Создать проект</h2>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm text-[#A6ADC8] mb-2">Название проекта</label>
                <input 
                  type="text" 
                  autoFocus
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full bg-[#1E1E2E] border border-[#313244] rounded-lg px-4 py-2 focus:outline-none focus:border-[#89B4FA]"
                  placeholder="Например: My Awesome App"
                />
              </div>
              <div>
                <label className="block text-sm text-[#A6ADC8] mb-2">Язык</label>
                <select 
                  value={newLang}
                  onChange={e => setNewLang(e.target.value)}
                  className="w-full bg-[#1E1E2E] border border-[#313244] rounded-lg px-4 py-2 focus:outline-none focus:border-[#89B4FA]"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="typescript">TypeScript</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-lg text-[#A6ADC8] hover:bg-[#313244] transition-colors"
              >
                Отмена
              </button>
              <button 
                onClick={handleCreate}
                className="bg-[#89B4FA] text-[#11111B] px-4 py-2 rounded-lg font-semibold hover:bg-opacity-90 transition-all"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
