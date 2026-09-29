'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// =========================================================
// ガチャ結果の保存先
// =========================================================

const GACHA_RESULT_ITEMS_KEY = 'gacha_result_items';

// =========================================================
// 配置するアイテムの型
// =========================================================

export type PlacementItem = {
  obtained_item_id?: number;
  item_id?: number;
  item_name?: string;
  item_image: string;
  rarity?: string;
  class_id?: number;
};

// =========================================================
// Contextの型
// =========================================================

interface SyncContextType {
  // -------------------------------------------------------
  // ユーザー情報
  // -------------------------------------------------------
  isTeacher: boolean;
  classId: number | null;
  userId: number | null;
  sessionId: number | null;
  isLoading: boolean;
  channelReady: boolean;
  placementItems: PlacementItem[];
  placementCurrentIndex: number;
  placementSelectedAreaId: string | null;

  // -------------------------------------------------------
  // class_sessionのphase変更
  // -------------------------------------------------------

  updateSessionPhase: (
    phase: string
  ) => Promise<void>;

  // -------------------------------------------------------
  // 配置アイテムを先生に要求
  // -------------------------------------------------------

  requestPlacementItems: () => Promise<void>;

  // -------------------------------------------------------
  // 配置場所を選択
  // -------------------------------------------------------

  selectPlacementArea: (
    areaId: string | null
  ) => Promise<void>;

  // -------------------------------------------------------
  // 次のアイテムへ
  // -------------------------------------------------------

  nextPlacement: (
    nextIndex: number
  ) => Promise<void>;

  // -------------------------------------------------------
  // 配置完了
  // -------------------------------------------------------

  completePlacement: () => Promise<void>;

  // -------------------------------------------------------
  // 既存のBroadcast機能
  // -------------------------------------------------------

  navigateAll: (
    destination: string
  ) => Promise<void>;

  broadcastEvent: (
    event: string,
    payload?: any
  ) => Promise<void>;

  // -------------------------------------------------------
  // 共有チャンネル
  // -------------------------------------------------------

  channel:
    ReturnType<typeof supabase.channel> | null;
}

// =========================================================
// Context初期値
// =========================================================

const SyncContext =
  createContext<SyncContextType>({
    isTeacher: false,
    classId: null,
    userId: null,
    sessionId: null,
    isLoading: true,
    channelReady: false,
    placementItems: [],
    placementCurrentIndex: 0,
    placementSelectedAreaId: null,
    updateSessionPhase: async () => {},
    requestPlacementItems: async () => {},
    selectPlacementArea: async () => {},
    nextPlacement: async () => {},
    completePlacement: async () => {},
    navigateAll: async () => {},
    broadcastEvent: async () => {},
    channel: null,
  });

// =========================================================
// useSync
// =========================================================

export const useSync = () =>
  useContext(SyncContext);

// =========================================================
// SyncContainer
// =========================================================

export default function SyncContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  // =======================================================
  // ユーザー情報
  // =======================================================

  const [isTeacher, setIsTeacher] =
    useState<boolean>(false);

  const [classId, setClassId] =
    useState<number | null>(null);

  const [userId, setUserId] =
    useState<number | null>(null);

  // =======================================================
  // class_session
  // =======================================================

  const [sessionId, setSessionId] =
    useState<number | null>(null);

  // =======================================================
  // Loading
  // =======================================================

  const [isLoading, setIsLoading] =
    useState<boolean>(true);

  // =======================================================
  // Realtime
  // =======================================================

  const [channelReady, setChannelReady] =
    useState<boolean>(false);

  const channelRef =
    useRef<
      ReturnType<typeof supabase.channel> | null
    >(null);

  // =======================================================
  // 配置アイテム
  // =======================================================

  const [placementItems, setPlacementItems] =
    useState<PlacementItem[]>([]);

  // =======================================================
  // 現在配置しているアイテムのindex
  // =======================================================

  const [
    placementCurrentIndex,
    setPlacementCurrentIndex,
  ] = useState<number>(0);

  // =======================================================
  // 現在選択されているエリア
  // =======================================================

  const [
    placementSelectedAreaId,
    setPlacementSelectedAreaId,
  ] = useState<string | null>(null);

  // =========================================================
  // sessionStorageからガチャ結果を取得
  // =========================================================

  const loadTeacherGachaResult =
    useCallback((): PlacementItem[] => {
      if (
        typeof window === 'undefined'
      ) {
        return [];
      }

      const raw =
        sessionStorage.getItem(
          GACHA_RESULT_ITEMS_KEY
        );

      if (!raw) {
        console.warn(
          'gacha_result_items がsessionStorageにありません'
        );

        return [];
      }

      try {
        const parsed = JSON.parse(raw);

        if (!Array.isArray(parsed)) {
          console.warn(
            'gacha_result_items が配列ではありません'
          );

          return [];
        }

        const validItems =
          parsed.filter((item) => {
            return (
              item &&
              typeof item.item_image ===
                'string'
            );
          });

        return validItems as PlacementItem[];
      } catch (error) {
        console.error(
          'gacha_result_items のJSONパースエラー:',
          error
        );

        return [];
      }
    }, []);

  // =========================================================
  // 1. sessionStorageからユーザー情報を取得
  // =========================================================

  useEffect(() => {
    try {
      const rawItem =
        sessionStorage.getItem(
          'user_info'
        );

      if (rawItem) {
        const userInfo =
          JSON.parse(rawItem);

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

        if (
          currentRole === 'teacher'
        ) {
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
    if (!classId) {
      return;
    }

    const fetchCurrentSession =
      async () => {
        const { data, error } =
          await supabase
            .from('class_sessions')
            .select(
              'session_id, class_id, topic_id, phase, updated_at'
            )
            .eq(
              'class_id',
              classId
            )
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

          // -------------------------------------------------
          // 先生がPLACEMENT中にリロードした場合
          // -------------------------------------------------

          if (
            isTeacher &&
            data.phase ===
              'PLACEMENT'
          ) {
            const items =
              loadTeacherGachaResult();

            if (
              items.length > 0
            ) {
              setPlacementItems(
                items
              );

              setPlacementCurrentIndex(
                0
              );

              setPlacementSelectedAreaId(
                null
              );
            }
          }
        }
      };

    fetchCurrentSession();
  }, [
    classId,
    isTeacher,
    loadTeacherGachaResult,
  ]);

  // =========================================================
  // 3. class_id確定後、Realtimeチャンネルへ接続
  // =========================================================

  useEffect(() => {
    if (!classId) {
      return;
    }

    console.log(
      `Realtime接続開始: classroom_${classId}`
    );

    const channel =
      supabase.channel(
        `classroom_${classId}`
      );

    channelRef.current =
      channel;

    // =======================================================
    // class_sessions UPDATE
    // class_sessionsのphase変更を検知してイベントを起こす
    // =======================================================

    channel.on(
      'postgres_changes',  //postgres_changesという名前のイベント受信したら以降の関数実施
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
        // ---------------------------------------------------
        // session_id更新
        // ---------------------------------------------------
        setSessionId(
          newSession.session_id
        );
        console.log(
          '新しいphase:',
          newSession.phase
        );

        // ---------------------------------------------------
        // GACHA開始時
        // ---------------------------------------------------
        if (
          newSession.phase ===
          'GACHA'
        ) {
          setPlacementItems(
            []
          );
          setPlacementCurrentIndex(
            0
          );
          setPlacementSelectedAreaId(
            null
          );
        }

        // ---------------------------------------------------
        // PLACEMENT開始時
        //
        // 先生は自分のsessionStorageから取得
        // ---------------------------------------------------

        if (
          newSession.phase ===
            'PLACEMENT' &&
          isTeacher
        ) {
          const items =
            loadTeacherGachaResult();
          if (
            items.length > 0
          ) {
            setPlacementItems(
              items
            );
            setPlacementCurrentIndex(
              0
            );
            setPlacementSelectedAreaId(
              null
            );
          }
        }

        // ---------------------------------------------------
        // phaseによる画面遷移
        // 先生の操作によりphaseが変更されると、それを生徒側の端末で検知して画面遷移する
        // ---------------------------------------------------

        if (
          newSession.phase ===
          'ANSWERING'
        ) {
          router.push(
            '/wait?mode=topic_cushion'
          );
        }

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
          router.push('/gacha');
        }

        if (
          newSession.phase ===
          'PLACEMENT'
        ) {
          router.push(
            '/placement'
          );
        }

        if (
          newSession.phase ===
          'HOME'
        ) {
          router.push('/home');
        }
      }
    );

    // =======================================================
    // PAGE_TRANSITION
    // 上のpage_transitionを受信する側のロジック
    // =======================================================

    channel.on(
      'broadcast',
      {
        event:
          'PAGE_TRANSITION',  //page_transitionという名前でイベント受信したら行うこと
      },
      (
        payload: {
          payload?: {
            destination?: string;
          };
        }
      ) => {
        const destination =
          payload.payload
            ?.destination;

        if (destination) {
          router.push(
            destination
          );
        }
      }
    );

    // =======================================================
    // PLACEMENT_REQUEST
    //
    // 生徒が先生に
    // 「配置する動物をください」
    // と要求
    // =======================================================

    channel.on(
      'broadcast',
      {
        event:
          'PLACEMENT_REQUEST',
      },
      async (
        payload: {
          payload?: {
            class_id?: number;
            user_id?: number;
          };
        }
      ) => {
        console.log(
          'PLACEMENT_REQUEST受信:',
          payload
        );
        // ---------------------------------------------------
        // 先生だけが応答
        // ---------------------------------------------------
        if (!isTeacher) {
          return;
        }
        // ---------------------------------------------------
        // 先生のsessionStorageからガチャ結果取得
        // ---------------------------------------------------

        const items =
          loadTeacherGachaResult();
        if (
          items.length === 0
        ) {
          console.warn(
            '先生側にガチャ結果がありません'
          );
          return;
        }
        // ---------------------------------------------------
        // 先生自身のstateにも保存
        // ---------------------------------------------------
        setPlacementItems(
          items
        );
        setPlacementCurrentIndex(
          0
        );
        setPlacementSelectedAreaId(
          null
        );

        // ---------------------------------------------------
        // 同じclassroomチャンネルへ送信
        // ---------------------------------------------------

        await channel.send({
          type: 'broadcast',
          event:
            'PLACEMENT_INIT',  //イベント名place_initで情報送る
          payload: {
            items,  //ガチャアイテムを送る
          },
        });

        console.log(
          'PLACEMENT_INIT送信:',
          items
        );
      }
    );

    // =======================================================
    // PLACEMENT_INIT
    //
    // 先生が送ったガチャ結果を生徒が受信
    // =======================================================

    channel.on(
      'broadcast',
      {
        event:
          'PLACEMENT_INIT',  // placement_initがきたら
      },
      (
        payload: {
          payload?: {
            items?: PlacementItem[];  // 先生から送られたアイテムを受け取る
          };
        }
      ) => {
        console.log(
          'PLACEMENT_INIT受信:',
          payload
        );

        const items =
          payload.payload?.items;

        if (
          !Array.isArray(items) ||
          items.length === 0
        ) {
          console.warn(
            'PLACEMENT_INITに有効なitemsがありません'
          );
          return;
        }

        // ---------------------------------------------------
        // 生徒側SyncContainerに保存
        // ---------------------------------------------------

        setPlacementItems(
          items  // placementItemsが/placementで使えるようになる
        );
        setPlacementCurrentIndex(
          0
        );
        setPlacementSelectedAreaId(
          null
        );
        console.log(
          'placementItems更新:',
          items
        );
      }
    );

    // =======================================================
    // PLACEMENT_SELECT
    //
    // 先生がどのエリアを選択したか同期
    // =======================================================

    channel.on(
      'broadcast',
      {
        event:
          'PLACEMENT_SELECT',
      },
      (
        payload: {
          payload?: {
            currentIndex?: number;
            selectedAreaId?:
              | string
              | null;
          };
        }
      ) => {
        console.log(
          'PLACEMENT_SELECT受信:',
          payload
        );

        const currentIndex =
          payload.payload
            ?.currentIndex;

        const selectedAreaId =
          payload.payload
            ?.selectedAreaId;

        // ---------------------------------------------------
        // 現在の動物
        // ---------------------------------------------------

        if (
          typeof currentIndex ===
          'number'
        ) {
          setPlacementCurrentIndex(
            currentIndex
          );
        }

        // ---------------------------------------------------
        // 選択されたエリア
        // ---------------------------------------------------

        if (
          selectedAreaId ===
            null ||
          typeof selectedAreaId ===
            'string'
        ) {
          setPlacementSelectedAreaId(
            selectedAreaId ??
              null
          );
        }
      }
    );

    // =======================================================
    // PLACEMENT_NEXT
    //
    // 次の動物へ進む
    // =======================================================

    channel.on(
      'broadcast',
      {
        event:
          'PLACEMENT_NEXT',  // placement_nextというイベントを受信したときに起きる
      },
      (
        payload: {
          payload?: {
            currentIndex?: number;
          };
        }
      ) => {
        console.log(
          'PLACEMENT_NEXT受信:',
          payload
        );
        const currentIndex =
          payload.payload
            ?.currentIndex;
        if (
          typeof currentIndex ===
          'number'
        ) {
          setPlacementCurrentIndex(
            currentIndex
          );
        }

        // ---------------------------------------------------
        // 次の動物ではエリア選択を解除
        // ---------------------------------------------------

        setPlacementSelectedAreaId(
          null
        );
      }
    );

    // =======================================================
    // PLACEMENT_COMPLETE
    //
    // 全動物の配置が完了
    // =======================================================

    channel.on(
      'broadcast',
      {
        event:
          'PLACEMENT_COMPLETE',  // placement_completeという名前でイベント起きる
      },
      (
        payload: {
          payload?: {
            completed?: boolean;
          };
        }
      ) => {
        console.log(
          'PLACEMENT_COMPLETE受信:',
          payload
        );

        if (
          payload.payload
            ?.completed
        ) {
          router.push('/home');
        }
      }
    );

    // =======================================================
    // subscribe
    // =======================================================

    channel.subscribe(
      (status) => {
        console.log(
          `Realtime channel status: ${status}`
        );

        if (
          status ===
          'SUBSCRIBED'
        ) {
          setChannelReady(
            true
          );

          console.log(
            `classroom_${classId} に接続完了`
          );
        }
      }
    );

    // =======================================================
    // cleanup
    // =======================================================

    return () => {
      console.log(
        `Realtime切断: classroom_${classId}`
      );
      setChannelReady(
        false
      );
      supabase.removeChannel(
        channel
      );
      channelRef.current =
        null;
    };
  }, [
    classId,
    router,
    isTeacher,
    loadTeacherGachaResult,
  ]);

  // =========================================================
  // 4. 生徒がガチャ結果を要求
  // =========================================================

  const requestPlacementItems =
    useCallback(
      async () => {
        if (
          !channelRef.current
        ) {
          console.warn(
            'Realtime channelが存在しません'
          );
          return;
        }
        if (!channelReady) {
          console.warn(
            'Realtime channelがまだ接続されていません'
          );
          return;
        }
        if (!classId) {
          console.warn(
            'classIdがありません'
          );
          return;
        }
        console.log(
          'PLACEMENT_REQUEST送信'
        );
        await channelRef.current.send(
          {
            type: 'broadcast',
            event:
              'PLACEMENT_REQUEST',  // placement_requestというイベント名で情報を送る
            payload: {
              class_id:
                classId,
              user_id:
                userId,
            },
          }
        );
      },
      [
        channelReady,
        classId,
        userId,
      ]
    );

  // =========================================================
  // 5. 配置エリアを選択
  // =========================================================

  const selectPlacementArea =
    useCallback(
      async (
        areaId: string | null
      ) => {
        // ---------------------------------------------------
        // まず自分の画面を更新
        //
        // Broadcastは送信者自身に返ってこない場合があるため、
        // 先にstateを更新しておく
        // ---------------------------------------------------
        setPlacementSelectedAreaId(
          areaId
        );

        // ---------------------------------------------------
        // Realtime送信
        // ---------------------------------------------------

        if (
          !channelRef.current
        ) {
          console.warn(
            'Realtime channelが存在しません'
          );
          return;
        }

        await channelRef.current.send(
          {
            type: 'broadcast',
            event:
              'PLACEMENT_SELECT',  //placement_selectという名前で情報を送る
            payload: {
              currentIndex:
                placementCurrentIndex,
              selectedAreaId:
                areaId,
            },
          }
        );

        console.log(
          'PLACEMENT_SELECT送信:',
          {
            currentIndex:
              placementCurrentIndex,
            selectedAreaId:
              areaId,
          }
        );
      },
      [
        placementCurrentIndex,
      ]
    );

  // =========================================================
  // 6. 次の配置へ進む
  // =========================================================

  const nextPlacement =
    useCallback(
      async (
        nextIndex: number
      ) => {
        // ---------------------------------------------------
        // 自分の画面を先に更新
        // ---------------------------------------------------
        setPlacementCurrentIndex(
          nextIndex
        );
        setPlacementSelectedAreaId(
          null
        );

        // ---------------------------------------------------
        // Realtime送信
        // ---------------------------------------------------
        if (
          !channelRef.current
        ) {
          console.warn(
            'Realtime channelが存在しません'
          );
          return;
        }

        await channelRef.current.send(
          {
            type: 'broadcast',
            event:
              'PLACEMENT_NEXT',  //placement_nextという名前で情報送る
            payload: {
              currentIndex:
                nextIndex,
            },
          }
        );

        console.log(
          'PLACEMENT_NEXT送信:',
          {
            currentIndex:
              nextIndex,
          }
        );
      },
      []
    );

  // =========================================================
  // 7. 配置完了
  // =========================================================

  const completePlacement =
    useCallback(
      async () => {
        // ---------------------------------------------------
        // 自分自身はHOMEへ
        // ---------------------------------------------------
        router.push('/home');
        // ---------------------------------------------------
        // 他端末へ通知
        // ---------------------------------------------------
        if (
          !channelRef.current
        ) {
          console.warn(
            'Realtime channelが存在しません'
          );
          return;
        }

        await channelRef.current.send(
          {
            type: 'broadcast',
            event:
              'PLACEMENT_COMPLETE',
            payload: {
              completed: true,
            },
          }
        );
        console.log(
          'PLACEMENT_COMPLETE送信'
        );
      },
      [router]
    );

  // =========================================================
  // 8. class_sessions.phaseを変更
  // =========================================================
  const updateSessionPhase =
    async (
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
            p_user_id:
              userId,
            p_session_id:
              sessionId,
            p_phase:
              phase,
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
  // 9. 既存Broadcastによる一斉遷移
  // =========================================================
  const navigateAll =
    async (
      destination: string
    ) => {
      if (
        channelRef.current
      ) {
        await channelRef.current.send(
          {
            type: 'broadcast',
            event:
              'PAGE_TRANSITION',  //page_transitionという名前にイベント名で情報を送る
            payload: {
              destination,
            },
          }
        );
      }
      router.push(
        destination
      );
    };

  // =========================================================
  // 10. その他Broadcast
  // =========================================================

  const broadcastEvent =
    async (
      event: string,
      payload: any = {}
    ) => {
      if (
        channelRef.current
      ) {
        await channelRef.current.send(
          {
            type: 'broadcast',
            event,
            payload,
          }
        );
      }
    };

  // =========================================================
  // 11. Context
  // =========================================================

  return (
    <SyncContext.Provider
      value={{
        // ---------------------------------------------------
        // ユーザー
        // ---------------------------------------------------
        isTeacher,
        classId,
        userId,
        // ---------------------------------------------------
        // session
        // ---------------------------------------------------
        sessionId,
        // ---------------------------------------------------
        // loading
        // ---------------------------------------------------
        isLoading,
        // ---------------------------------------------------
        // Realtime
        // ---------------------------------------------------
        channelReady,
        // ---------------------------------------------------
        // 配置
        // ---------------------------------------------------
        placementItems,
        placementCurrentIndex,
        placementSelectedAreaId,
        // ---------------------------------------------------
        // functions
        // ---------------------------------------------------
        updateSessionPhase,
        requestPlacementItems,
        selectPlacementArea,
        nextPlacement,
        completePlacement,
        navigateAll,
        broadcastEvent,
        // ---------------------------------------------------
        // channel
        // ---------------------------------------------------

        channel:
          channelRef.current,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}
