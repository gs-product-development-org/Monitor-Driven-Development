'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/stores/useUserStore';

export function useRequireAuth() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    if (!user) {
      const savedUser = sessionStorage.getItem('user_info');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          sessionStorage.removeItem('user_info');
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
    }
  }, [user, setUser, router]);

  return { user, isTeacher: user?.role === 'teacher' };
}