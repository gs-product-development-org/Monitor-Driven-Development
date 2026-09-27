'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface SyncContextType {
  isTeacher: boolean;
  classId: number | null;
  userId: number | null;
  sessionId: number | null;
  isLoading: boolean;

  // 現在のclass_sessionのphaseを変更する
  updateSessionPhase: (phase: string) => Promise<void>;

  // 既存のBroadcast機能
  navigateAll: (destination: string) => Promise<void>;
  broadcastEvent: (
    event: string,
    payload?: any
  ) => Promise<void>;

  // 共有チャンネルの参照
  channel: ReturnType<typeof supabase.channel> | null;
}

const SyncContext = createContext<SyncContextType>({
  isTeacher: false,
  classId: null,
  userId: null,
  sessionId: null,
  isLoading: true,

  updateSessionPhase: async () => {},

  navigateAll: async () => {},
  broadcastEvent: async () => {},
  channel: null,
});

export const useSync = () => useContext(SyncContext);

export default function SyncContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [isTeacher, setIsTeacher] =
    useState<boolean>(false);

  const [classId, setClassId] =
    useState<number | null>(null);

  const [userId, setUserId] =
    useState<number | null>(null);

  const [sessionId, setSessionId] =
    useState<number | null>(null);

  const [isLoading, setIsLoading] =
    useState<boolean>(true);

  const channelRef =
    useRef<ReturnType<typeof supabase.channel> | null>(
      null
    );

  // =========================================================
  // 1. sessionStorageからユーザー情報を取得
  // =========================================================
  useEffect(() => {
    try {
      const rawItem =
        sessionStorage.getItem('user_info');

      if (rawItem) {
        const userInfo = JSON.parse(rawItem);

        const currentUserId =
          userInfo?.user_id
            ? Number(userInfo.user_id)
            : null;

        const currentClassId =
          userInfo?.class_id
            ? Number(userInfo.class_id)
            : null;

        const currentRole =
          userInfo?.role;

        if (currentUserId) {
          setUserId(currentUserId);
        }

        if (currentClassId) {
          setClassId(currentClassId);
        }

        if (currentRole === 'teacher') {
          setIsTeacher(true);
        }
      } else {
        console.warn(
          'sessionStorage(user_info) からユーザー情報を検出できませんでした'
        );
      }
    } catch (err) {
      console.error(
        'user_info のパースエラー:',
        err
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // =========================================================
  // 2. class_idから現在のclass_sessionを取得
  // =========================================================
  useEffect(() => {
    if (!classId) return;

    const fetchCurrentSession = async () => {
      const { data, error } =
        await supabase
          .from('class_sessions')
          .select(
            'session_id, class_id, topic_id, phase, updated_at'
          )
          .eq('class_id', classId)
          .order('session_id', {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

      if (error) {
        console.error(
          '現在のclass_session取得エラー:',
          error
        );
        return;
      }

      if (data) {
        setSessionId(
          data.session_id
        );

        console.log(
          '現在のclass_session:',
          data
        );
      }
    };

    fetchCurrentSession();
  }, [classId]);

  // =========================================================
  // 3. class_id確定後、Realtimeチャンネルへ接続
  // =========================================================
  useEffect(() => {
    if (!classId) return;

    const channel =
      supabase.channel(
        `classroom_${classId}`
      );

    channelRef.current = channel;

    // ---------------------------------------------------------
    // class_sessions のUPDATEを監視
    // ---------------------------------------------------------
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'class_sessions',
        filter: `class_id=eq.${classId}`,
      },
      (payload) => {
        console.log(
          'class_sessions UPDATE:',
          payload
        );

        const newSession =
          payload.new as {
            session_id: number;
            class_id: number;
            topic_id: number;
            phase: string;
            updated_at: string;
          };

        // 現在監視しているsessionではない場合は無視
        if (
          sessionId !== null &&
          newSession.session_id !== sessionId
        ) {
          return;
        }

        // session_idを保存
        setSessionId(
          newSession.session_id
        );

        console.log(
          '新しいphase:',
          newSession.phase
        );

        // -----------------------------------------------------
        // phaseによる画面遷移
        // -----------------------------------------------------

        if (
          newSession.phase ===
          'REACTION'
        ) {
          router.push(
            '/anonymous-reveal'
          );
        }

        if (
          newSession.phase ===
          'TITLE_RESULT'
        ) {
          router.push(
            '/title-result'
          );
        }

        if (
          newSession.phase ===
          'ALL_POSTS'
        ) {
          router.push(
            '/all-posts'
          );
        }

        if (
          newSession.phase ===
          'GACHA'
        ) {
          router.push(
            '/gacha'
          );
        }

        if (
          newSession.phase ===
          'PLACEMENT'
        ) {
          router.push(
            '/placement'
          );
        }
      }
    );

    // ---------------------------------------------------------
    // 既存のBroadcast
    // ---------------------------------------------------------
    channel
      .on(
        'broadcast',
        {
          event:
            'PAGE_TRANSITION',
        },
        (payload: {
          payload: {
            destination: string;
          };
        }) => {
          if (
            payload.payload
              ?.destination
          ) {
            router.push(
              payload.payload.destination
            );
          }
        }
      )
      .subscribe((status) => {
        console.log(
          `Realtime channel status: ${status}`
        );
      });

    return () => {
      supabase.removeChannel(
        channel
      );

      channelRef.current = null;
    };
  }, [
    classId,
    sessionId,
    router,
  ]);

  // =========================================================
  // 4. class_sessions.phaseを変更する
  // =========================================================
  const updateSessionPhase = async (
    phase: string
  ) => {
    if (!userId) {
      throw new Error(
        'user_idが取得できていません'
      );
    }

    if (!sessionId) {
      throw new Error(
        'session_idが取得できていません'
      );
    }

    const { data, error } =
      await supabase.rpc(
        'update_session_phase',
        {
          p_user_id: userId,
          p_session_id: sessionId,
          p_phase: phase,
        }
      );

    if (error) {
      console.error(
        'session phase更新エラー:',
        error
      );

      throw error;
    }

    console.log(
      'session phase更新成功:',
      data
    );
  };

  // =========================================================
  // 5. 既存のBroadcastによる一斉遷移
  // =========================================================
  const navigateAll = async (
    destination: string
  ) => {
    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event:
          'PAGE_TRANSITION',
        payload: {
          destination,
        },
      });
    }

    router.push(destination);
  };

  // =========================================================
  // 6. その他のBroadcastイベント
  // =========================================================
  const broadcastEvent = async (
    event: string,
    payload: any = {}
  ) => {
    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event,
        payload,
      });
    }
  };

  // =========================================================
  // 7. Context
  // =========================================================
  return (
    <SyncContext.Provider
      value={{
        isTeacher,
        classId,
        userId,
        sessionId,
        isLoading,

        updateSessionPhase,

        navigateAll,
        broadcastEvent,

        channel:
          channelRef.current,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}
