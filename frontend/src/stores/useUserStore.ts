import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 1. ユーザー情報の型定義
export interface User {
  user_id?: number | string; // ★ ここを追加（UUIDや数値ID）
  class_id: string;
  user_number: number;
  // student_id: string;
  role: 'teacher' | 'student';
}

export interface UserState {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
}

// 3. ストアの作成
export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (userData) => set({ user: userData }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: 'user-storage', // localStorageのキー名
    }
  )
);