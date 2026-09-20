import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 1. ユーザー情報の型定義
export type UserInfo = {
  role: 'teacher' | 'student';
  class_id: string;
  student_id: string;
} | null;

// 2. Zustand ストア全体の型定義
export type UserState = {
  user: UserInfo;                                // 👈 追加されているか確認
  setUser: (user: NonNullable<UserInfo>) => void;
  clearUser: () => void;                         // 👈 追加されているか確認
};

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