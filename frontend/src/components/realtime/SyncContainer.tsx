'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface SyncContextType {
  isTeacher: boolean;
  classId: number | null;
  isLoading: boolean;
  navigateAll: (destination: string) => Promise<void>;
  broadcastEvent: (event: string, payload?: any) => Promise<void>;
  channel: ReturnType<typeof supabase.channel> | null;
}

const SyncContext = createContext<SyncContextType>({
  isTeacher: false,
  classId: null,
  isLoading: true,
  navigateAll: async () => {},
  broadcastEvent: async () => {},
  channel: null,
});

export const useSync = () => useContext(SyncContext);

export default function SyncContainer({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isTeacher, setIsTeacher] = useState<boolean>(false);
  const [classId, setClassId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // 1. sessionStorage ('user_info') からユーザー情報を取得
  useEffect(() => {
    try {
      const rawItem = sessionStorage.getItem('user_info');

      if (rawItem) {
        const userInfo = JSON.parse(rawItem);
        const currentClassId = userInfo?.class_id ? Number(userInfo.class_id) : null;
        const currentRole = userInfo?.role;

        if (currentClassId) {
          setClassId(currentClassId);
        }
        if (currentRole === 'teacher') {
          setIsTeacher(true);
        }
      } else {
        console.warn('sessionStorage(user_info) からユーザー情報を検出できませんでした');
      }
    } catch (err) {
      console.error('user_info のパースエラー:', err);
    } finally {
      setIsLoading(false); // ★ 読み込み完了
    }
  }, []);

  // 2. class_id 確定後、Realtime チャンネルへ接続
  useEffect(() => {
    if (!classId) return;

    const channel = supabase.channel(`classroom_${classId}`);
    channelRef.current = channel;

    channel
      .on(
        'broadcast',
        { event: 'PAGE_TRANSITION' },
        (payload: { payload: { destination: string } }) => {
          if (payload.payload?.destination) {
            router.push(payload.payload.destination);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [classId, router]);

  const navigateAll = async (destination: string) => {
    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'PAGE_TRANSITION',
        payload: { destination },
      });
    }
    router.push(destination);
  };

  const broadcastEvent = async (event: string, payload: any = {}) => {
    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event,
        payload,
      });
    }
  };

  // ★ 修正ポイント: sessionStorageの確認が終わるまでは「読み込み中」を表示し、子画面を描画させない
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        読み込み中...
      </div>
    );
  }

  return (
    <SyncContext.Provider
      value={{
        isTeacher,
        classId,
        isLoading,
        navigateAll,
        broadcastEvent,
        channel: channelRef.current,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}