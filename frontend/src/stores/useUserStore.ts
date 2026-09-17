// src/stores/useUserStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'teacher' | 'student' | null;

type UserState = {
  role: UserRole;
  class_id: string | null;
  student_id: string | null;
  setUser: (user: { role: UserRole; class_id: string; student_id: string }) => void;
  logout: () => void;
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      role: null,
      class_id: null,
      student_id: null,
      setUser: (user) => set(user),
      logout: () => set({ role: null, class_id: null, student_id: null }),
    }),
    {
      name: 'user-session-storage', // ブラウザの LocalStorage に保存されるキー名
    }
  )
);