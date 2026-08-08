import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  loginWithGoogle: () => void;
  loginWithGitHub: () => void;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null, // By default, not logged in. For testing we could mock a user.
  accessToken: null,
  isLoading: false,
  
  login: async (email, password) => {
    set({ isLoading: true });
    // Simulate API call
    setTimeout(() => {
      set({ 
        user: { id: '1', name: 'Иван', email },
        accessToken: 'mock-token',
        isLoading: false 
      });
    }, 500);
  },
  
  loginWithGoogle: () => {
    // In a real app this redirects to OAuth
    set({
      user: { id: '1', name: 'Google User', email: 'test@gmail.com' },
      accessToken: 'mock-token'
    });
  },
  
  loginWithGitHub: () => {
    set({
      user: { id: '2', name: 'GitHub User', email: 'github@test.com' },
      accessToken: 'mock-token'
    });
  },
  
  logout: async () => {
    set({ user: null, accessToken: null });
  },
  
  refreshToken: async () => {
    // Mock refresh logic
  }
}));
