import { create } from 'zustand';
import { Project } from './projectStore';

export interface File {
  id: string;
  name: string;
  content: string;
  language: string;
}

interface EditorStore {
  currentProject: Project | null;
  currentFile: File | null;
  files: File[];
  isSaving: boolean;
  theme: 'vs-dark' | 'light';
  fontSize: number;
  output: { text: string; type: 'stdout' | 'stderr'; time?: number; memory?: number } | null;
  
  setCurrentProject: (project: Project) => void;
  setCurrentFile: (file: File) => void;
  updateFileContent: (id: string, content: string) => void;
  saveFile: () => Promise<void>;
  toggleTheme: () => void;
  setOutput: (output: EditorStore['output']) => void;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  currentProject: null,
  currentFile: null,
  files: [],
  isSaving: false,
  theme: 'vs-dark',
  fontSize: 14,
  output: null,

  setCurrentProject: (project) => {
    // mock files basic loading
    const defaultFile = { id: 'file1', name: 'main.' + (project.language === 'python' ? 'py' : 'js'), content: project.previewCode || '', language: project.language };
    set({ currentProject: project, files: [defaultFile], currentFile: defaultFile });
  },
  
  setCurrentFile: (file) => set({ currentFile: file }),
  
  updateFileContent: (id, content) => {
    set({
      files: get().files.map(f => f.id === id ? { ...f, content } : f),
      currentFile: get().currentFile?.id === id ? { ...get().currentFile!, content } : get().currentFile
    });
  },
  
  saveFile: async () => {
    set({ isSaving: true });
    // Simulate save
    setTimeout(() => {
      set({ isSaving: false });
    }, 500);
  },
  
  toggleTheme: () => set(state => ({ theme: state.theme === 'vs-dark' ? 'light' : 'vs-dark' })),
  
  setOutput: (output) => set({ output })
}));
