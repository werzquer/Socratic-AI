import { create } from 'zustand';

export interface Project {
  id: string;
  title: string;
  language: string;
  isPublic: boolean;
  updatedAt: string;
  previewCode?: string;
}

interface ProjectStore {
  projects: Project[];
  isLoading: boolean;
  fetchProjects: () => Promise<void>;
  createProject: (title: string, language: string, isPublic: boolean) => Promise<string>;
  deleteProject: (id: string) => Promise<void>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
}

const mockProjects: Project[] = [
  { id: '1', title: 'Hello World Server', language: 'javascript', isPublic: true, updatedAt: '2 часа назад', previewCode: 'console.log("Hello");' },
  { id: '2', title: 'Data Processing', language: 'python', isPublic: false, updatedAt: 'вчера', previewCode: 'def process(data):\n  pass' }
];

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  isLoading: false,
  
  fetchProjects: async () => {
    set({ isLoading: true });
    // Simulate API call
    setTimeout(() => {
      set({ projects: mockProjects, isLoading: false });
    }, 300);
  },
  
  createProject: async (title, language, isPublic) => {
    const newProject: Project = {
      id: Math.random().toString(36).substring(7),
      title,
      language,
      isPublic,
      updatedAt: 'только что'
    };
    set({ projects: [...get().projects, newProject] });
    return newProject.id;
  },
  
  deleteProject: async (id) => {
    set({ projects: get().projects.filter(p => p.id !== id) });
  },
  
  updateProject: async (id, data) => {
    set({
      projects: get().projects.map(p => p.id === id ? { ...p, ...data } : p)
    });
  }
}));
