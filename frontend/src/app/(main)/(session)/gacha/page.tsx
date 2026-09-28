'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useSync } from '@/components/realtime/SyncContainer';
import './gacha.css';

export const GACHA_RESULT_ITEMS_KEY =
  'gacha_result_items';

const GIF_DURATION_MS = 6600;

type Item = {
  obtained_item_id: number;
  item_name: string;
  item_image: string;
  rarity: string;
};

type GachaState =
  | 'loading'
  | 'start'
  | 'animating'
  | 'result'
  | 'empty';

type GachaInitPayload = {
  totalGachaCount: number;
  meterValue: number;
  needValue: number;
};

type GachaResultPayload = {
  drawNumber: number;
  item: Item;
  startedAt: number;
};

export default function GachaPage() {
  const router = useRouter();

  const {
    isTeacher,
    classId,
    updateSessionPhase,
  } = useSync();

  const [gachaState, setGachaState] =
    useState<GachaState>('loading');

  const [totalGachaCount, setTotalGachaCount] =
    useState<number>(0);

  const [currentCount, setCurrentCount] =
    useState<number>(0);

  const [currentItem, setCurrentItem] =
    useState<Item | null>(null);

  const [obtainedItems, setObtainedItems] =
    useState<Item[]>([]);

  const [isAnimating, setIsAnimating] =
    useState<boolean>(false);

  const [gifTimestamp, setGifTimestamp] =
    useState<number>(Date.now());

  const [meterValue, setMeterValue] =
    useState<number>(0);

  const [needValue, setNeedValue] =
    useState<number>(1);

  const [channelReady, setChannelReady] =
    useState<boolean>(false);

  const channelRef =
    useRef<ReturnType<typeof supabase.channel> | null>(
      null
    );

  const timerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  /**
   * ---------------------------------------------------------
   * class_id を取得
   * ---------------------------------------------------------
   */
  const resolvedClassId = useCallback(() => {
    if (classId) {
      return Number(classId);
    }

    try {
      const storedUser =
        sessionStorage.getItem('user_info');

      if (!storedUser) {
        return null;
      }

      const parsed = JSON.parse(storedUser);

      if (!parsed.class_id) {
        return null;
      }

      return Number(parsed.class_id);
    } catch (error) {
      console.error(
        'user_info の読み込みに失敗しました:',
        error
      );

      return null;
    }
  }, [classId]);

  /**
   * ---------------------------------------------------------
   * 現在のclass_sessionを取得
   *
   * topic_idはsessionStorageではなく、
   * class_sessions.topic_idから取得する。
   * ---------------------------------------------------------
   */
  const getCurrentSession = useCallback(
    async (targetClassId: number) => {
      try {
        const {
          data,
          error,
        } = await supabase
          .from('class_sessions')
          .select(
            'session_id, class_id, topic_id, phase'
          )
          .eq(
            'class_id',
            targetClassId
          )
          .maybeSingle();

        if (error) {
          console.error(
            'class_sessions の取得エラー:',
            error
          );

          return null;
        }

        if (!data) {
          console.warn(
            '現在のclass_sessionsが見つかりません'
          );

          return null;
        }

        console.log(
          '現在のclass_session:',
          data
        );

        return data;
      } catch (error) {
        console.error(
          'class_sessions の取得中に例外が発生しました:',
          error
        );

        return null;
      }
    },
    []
  );

  /**
   * ---------------------------------------------------------
   * ゲージ取得
   * ---------------------------------------------------------
   */
  const refreshMeter = useCallback(
    async (targetClassId: number) => {
      try {
        const {
          data,
          error,
        } = await supabase.rpc('get_meter', {
          p_class_id: targetClassId,
        });

        if (error) {
          console.error(
            'get_meter の取得エラー:',
            error
          );

          return;
        }

        if (
          Array.isArray(data) &&
          data.length > 0
        ) {
          setMeterValue(
            data[0].gacha_meter ?? 0
          );

          setNeedValue(
            data[0].need_value > 0
              ? data[0].need_value
              : 1
          );
        }
      } catch (error) {
        console.error(
          'get_meter の取得中に例外が発生しました:',
          error
        );
      }
    },
    []
  );

  /**
   * ---------------------------------------------------------
   * ガチャ専用Realtime channelを作成
   * ---------------------------------------------------------
   */
  useEffect(() => {
    const targetClassId =
      resolvedClassId();

    if (!targetClassId) {
      return;
    }

    const channelName =
      `classroom_gacha_${targetClassId}`;

    console.log(
      'ガチャRealtime channelを作成:',
      channelName
    );

    const channel =
      supabase.channel(channelName);

    channelRef.current = channel;

    /**
     * -------------------------------------------------------
     * GACHA_INIT
     * -------------------------------------------------------
     */
    channel.on(
      'broadcast',
      {
        event: 'GACHA_INIT',
      },
      (payload) => {
        console.log(
          'GACHA_INIT received:',
          payload
        );

        const data =
          payload.payload as GachaInitPayload;

        if (
          !data ||
          typeof data.totalGachaCount !==
            'number' ||
          typeof data.meterValue !==
            'number' ||
          typeof data.needValue !==
            'number'
        ) {
          console.warn(
            'GACHA_INIT のpayloadが不正です:',
            data
          );

          return;
        }

        const count =
          Math.max(
            0,
            data.totalGachaCount
          );

        setTotalGachaCount(count);

        setMeterValue(
          data.meterValue
        );

        setNeedValue(
          data.needValue > 0
            ? data.needValue
            : 1
        );

        setCurrentCount(0);
        setCurrentItem(null);
        setObtainedItems([]);

        if (count === 0) {
          setGachaState('empty');
        } else {
          setGachaState('start');
        }
      }
    );

    /**
     * -------------------------------------------------------
     * GACHA_RESULT
     * -------------------------------------------------------
     */
    channel.on(
      'broadcast',
      {
        event: 'GACHA_RESULT',
      },
      (payload) => {
        console.log(
          'GACHA_RESULT received:',
          payload
        );

        const data =
          payload.payload as GachaResultPayload;

        if (!data || !data.item) {
          console.warn(
            'GACHA_RESULT のpayloadが不正です:',
            data
          );

          return;
        }

        const {
          drawNumber,
          item,
          startedAt,
        } = data;

        if (
          typeof drawNumber !==
            'number' ||
          drawNumber <= 0
        ) {
          return;
        }

        setCurrentCount((prev) => {
          if (drawNumber <= prev) {
            return prev;
          }

          return drawNumber;
        });

        setCurrentItem(item);

        setObtainedItems((prev) => {
          if (prev.length >= drawNumber) {
            return prev;
          }

          return [
            ...prev,
            item,
          ];
        });

        setIsAnimating(true);
        setGachaState('animating');

        setGifTimestamp(
          typeof startedAt === 'number'
            ? startedAt
            : Date.now()
        );

        if (timerRef.current) {
          clearTimeout(
            timerRef.current
          );
        }

        timerRef.current =
          setTimeout(() => {
            setGachaState('result');
            setIsAnimating(false);
          }, GIF_DURATION_MS);
      }
    );

    /**
     * -------------------------------------------------------
     * channel subscribe
     * -------------------------------------------------------
     */
    channel.subscribe((status) => {
      console.log(
        'ガチャRealtime status:',
        status
      );

      if (
        status === 'SUBSCRIBED'
      ) {
        setChannelReady(true);
      }

      if (
        status === 'CHANNEL_ERROR' ||
        status === 'TIMED_OUT' ||
        status === 'CLOSED'
      ) {
        setChannelReady(false);
      }
    });

    return () => {
      console.log(
        'ガチャRealtime channelを解除:',
        channelName
      );

      if (timerRef.current) {
        clearTimeout(
          timerRef.current
        );
      }

      setChannelReady(false);

      channelRef.current = null;

      supabase.removeChannel(
        channel
      );
    };
  }, [
    resolvedClassId,
  ]);

  /**
   * ---------------------------------------------------------
   * 初期メーター取得
   * ---------------------------------------------------------
   */
  useEffect(() => {
    const targetClassId =
      resolvedClassId();

    if (!targetClassId) {
      return;
    }

    refreshMeter(
      targetClassId
    );
  }, [
    resolvedClassId,
    refreshMeter,
  ]);

  /**
   * ---------------------------------------------------------
   * 先生：
   * ガチャ回数を計算する
   *
   * topic_idはclass_sessionsから取得する。
   * ---------------------------------------------------------
   */
  useEffect(() => {
    if (!isTeacher) {
      return;
    }

    const targetClassId =
      resolvedClassId();

    if (!targetClassId) {
      console.warn(
        'class_id が不足しています'
      );

      return;
    }

    if (!channelReady) {
      return;
    }

    let cancelled = false;

    const initializeGacha =
      async () => {
        try {
          /**
           * ---------------------------------------------------
           * 現在のclass_sessionを取得
           * ---------------------------------------------------
           */
          const session =
            await getCurrentSession(
              targetClassId
            );

          if (cancelled) {
            return;
          }

          if (!session) {
            console.error(
              '現在のclass_sessionを取得できませんでした'
            );

            return;
          }

          if (!session.topic_id) {
            console.error(
              'class_sessionsにtopic_idが設定されていません'
            );

            return;
          }

          const topicId =
            Number(
              session.topic_id
            );

          console.log(
            '現在のtopic_id:',
            topicId
          );

          /**
           * ---------------------------------------------------
           * ガチャ回数を計算
           * ---------------------------------------------------
           */
          console.log(
            '先生：get_gacha_distribution() を実行'
          );

          const {
            data,
            error,
          } = await supabase.rpc(
            'get_gacha_distribution',
            {
              p_class_id:
                targetClassId,

              p_topic_id:
                topicId,
            }
          );

          if (cancelled) {
            return;
          }

          if (error) {
            console.error(
              'get_gacha_distribution エラー:',
              error
            );

            return;
          }

          if (
            !Array.isArray(data) ||
            data.length === 0
          ) {
            console.error(
              'get_gacha_distribution の結果が空です'
            );

            return;
          }

          const result =
            data[0];

          const quotient =
            Number(
              result.quotient ??
                0
            );

          const totalValue =
            Number(
              result.total_value ??
                0
            );

          const targetValue =
            Number(
              result.target_value ??
                1
            );

          const remainder =
            targetValue > 0
              ? totalValue %
                targetValue
              : 0;

          console.log(
            'ガチャ計算結果:',
            {
              totalValue,
              targetValue,
              quotient,
              remainder,
            }
          );

          setTotalGachaCount(
            quotient
          );

          setMeterValue(
            remainder
          );

          setNeedValue(
            targetValue > 0
              ? targetValue
              : 1
          );

          setCurrentCount(0);
          setCurrentItem(null);
          setObtainedItems([]);

          if (quotient === 0) {
            setGachaState(
              'empty'
            );
          } else {
            setGachaState(
              'start'
            );
          }

          /**
           * ---------------------------------------------------
           * GACHA_INITを全員へBroadcast
           * ---------------------------------------------------
           */
          if (
            channelRef.current
          ) {
            await channelRef.current.send(
              {
                type: 'broadcast',
                event: 'GACHA_INIT',
                payload: {
                  totalGachaCount:
                    quotient,

                  meterValue:
                    remainder,

                  needValue:
                    targetValue > 0
                      ? targetValue
                      : 1,
                } satisfies GachaInitPayload,
              }
            );

            console.log(
              'GACHA_INIT をBroadcastしました'
            );
          }

          await refreshMeter(
            targetClassId
          );
        } catch (error) {
          if (cancelled) {
            return;
          }

          console.error(
            'ガチャ初期化中に例外が発生しました:',
            error
          );
        }
      };

    initializeGacha();

    return () => {
      cancelled = true;
    };
  }, [
    isTeacher,
    channelReady,
    resolvedClassId,
    getCurrentSession,
    refreshMeter,
  ]);

  /**
   * ---------------------------------------------------------
   * 先生：
   * ガチャを1回引く
   * ---------------------------------------------------------
   */
  const executeGacha =
    useCallback(
      async () => {
        if (!isTeacher) {
          return;
        }

        if (isAnimating) {
          return;
        }

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
            'Realtime channelがまだSUBSCRIBEDではありません'
          );

          return;
        }

        const drawNumber =
          currentCount + 1;

        try {
          setIsAnimating(true);
          setGachaState(
            'animating'
          );
          setCurrentItem(null);

          const startedAt =
            Date.now();

          setGifTimestamp(
            startedAt
          );

          const {
            data,
            error,
          } = await supabase.rpc(
            'draw_gacha'
          );

          if (error) {
            console.error(
              'draw_gacha エラー:',
              error
            );

            alert(
              'ガチャの実行に失敗しました'
            );

            setIsAnimating(
              false
            );

            setGachaState(
              'start'
            );

            return;
          }

          if (
            !Array.isArray(data) ||
            data.length === 0
          ) {
            console.error(
              'draw_gacha の結果が空です'
            );

            alert(
              'ガチャの実行に失敗しました'
            );

            setIsAnimating(
              false
            );

            setGachaState(
              'start'
            );

            return;
          }

          const selectedItem =
            data[0] as Item;

          console.log(
            'ガチャ結果:',
            selectedItem
          );

          setCurrentItem(
            selectedItem
          );

          setCurrentCount(
            drawNumber
          );

          setObtainedItems(
            (prev) => [
              ...prev,
              selectedItem,
            ]
          );

          await channelRef.current.send(
            {
              type: 'broadcast',
              event: 'GACHA_RESULT',
              payload: {
                drawNumber,
                item: selectedItem,
                startedAt,
              } satisfies GachaResultPayload,
            }
          );

          console.log(
            'GACHA_RESULT をBroadcastしました'
          );

          if (
            timerRef.current
          ) {
            clearTimeout(
              timerRef.current
            );
          }

          timerRef.current =
            setTimeout(() => {
              setGachaState(
                'result'
              );

              setIsAnimating(
                false
              );
            }, GIF_DURATION_MS);
        } catch (error) {
          console.error(
            'ガチャ実行中に予期せぬエラー:',
            error
          );

          setIsAnimating(
            false
          );

          setGachaState(
            'start'
          );
        }
      },
      [
        isTeacher,
        isAnimating,
        channelReady,
        currentCount,
      ]
    );

  /**
   * ---------------------------------------------------------
   * 次の操作
   * ---------------------------------------------------------
   */
  const handleNextStep =
    useCallback(
      async () => {
        /**
         * 生徒は操作しない。
         */
        if (!isTeacher) {
          return;
        }

        if (isAnimating) {
          return;
        }

        /**
         * ガチャが存在しない
         */
        if (
          totalGachaCount === 0 ||
          gachaState === 'empty'
        ) {
          await updateSessionPhase(
            'HOME'
          );

          return;
        }

        /**
         * -----------------------------------------------------
         * スタート
         * -----------------------------------------------------
         */
        if (
          gachaState === 'start'
        ) {
          executeGacha();

          return;
        }

        /**
         * -----------------------------------------------------
         * 結果
         * -----------------------------------------------------
         */
        if (
          gachaState === 'result'
        ) {
          /**
           * まだ残りのガチャがある
           */
          if (
            currentCount <
            totalGachaCount
          ) {
            executeGacha();

            return;
          }

          /**
           * ---------------------------------------------------
           * 全ガチャ終了
           * ---------------------------------------------------
           */
          sessionStorage.setItem(
            GACHA_RESULT_ITEMS_KEY,
            JSON.stringify(
              obtainedItems
            )
          );

          /**
           * class_sessionsを
           * PLACEMENTへ変更する。
           *
           * Realtimeによって生徒側の
           * SyncContainerにも通知される。
           */
          await updateSessionPhase(
            'PLACEMENT'
          );

          /**
           * 先生自身もplacementへ移動
           */
          router.push(
            '/placement'
          );
        }
      },
      [
        isTeacher,
        isAnimating,
        totalGachaCount,
        gachaState,
        currentCount,
        executeGacha,
        obtainedItems,
        updateSessionPhase,
        router,
      ]
    );

  /**
   * ---------------------------------------------------------
   * Enterキー
   * ---------------------------------------------------------
   */
  useEffect(() => {
    const handleKeyDown =
      (event: KeyboardEvent) => {
        if (
          event.key !== 'Enter'
        ) {
          return;
        }

        event.preventDefault();

        handleNextStep();
      };

    window.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, [
    handleNextStep,
  ]);

  /**
   * ---------------------------------------------------------
   * cleanup
   * ---------------------------------------------------------
   */
  useEffect(() => {
    return () => {
      if (
        timerRef.current
      ) {
        clearTimeout(
          timerRef.current
        );
      }
    };
  }, []);

  /**
   * ---------------------------------------------------------
   * ゲージ表示率
   * ---------------------------------------------------------
   */
  const fillPercentage =
    Math.min(
      100,
      Math.max(
        0,
        Math.floor(
          (meterValue /
            needValue) *
            100
        )
      )
    );

  /**
   * ---------------------------------------------------------
   * 表示
   * ---------------------------------------------------------
   */
  return (
    <div
      className="gacha-container"
      onClick={
        handleNextStep
      }
    >
      <div className="gacha-background" />

      {/* =====================================================
          ガチャゲージ
          ===================================================== */}
      <div
        className="gacha-meter-container"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <div className="gacha-meter-label">
          <span>ガチャ</span>
          <span>ゲージ</span>
        </div>

        <div className="gacha-meter-bar-outer">
          <div
            className="gacha-meter-bar-inner"
            style={{
              width: `${fillPercentage}%`,
            }}
          />
        </div>

        <div className="gacha-meter-eggs">
          {[0, 1, 2].map(
            (index) => {
              const remainingDraws =
                totalGachaCount -
                currentCount;

              const isAvailable =
                index <
                remainingDraws;

              return (
                <img
                  key={index}
                  src="/images/contents/gacha-egg.png"
                  alt="ガチャ卵"
                  className={`gacha-egg-icon ${
                    isAvailable
                      ? 'active'
                      : 'inactive'
                  }`}
                />
              );
            }
          )}
        </div>
      </div>

      {/* =====================================================
          中央コンテンツ
          ===================================================== */}
      <div className="gacha-center-content">

        {/* ---------------------------------------------------
            初期ロード
            --------------------------------------------------- */}
        {gachaState ===
          'loading' && (
          <div className="gacha-start-wrapper">
            <div className="gacha-image-container">
              <img
                src="/images/contents/gacha-back.png"
                alt="ガチャ機"
                className="gacha-center-image"
              />

              <div className="gacha-overlay-title">
                ガチャ準備中！
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------
            ガチャなし
            --------------------------------------------------- */}
        {gachaState ===
          'empty' && (
          <div className="gacha-start-wrapper">
            <div className="gacha-image-container">
              <img
                src="/images/contents/gacha-back.png"
                alt="ガチャ機"
                className="gacha-center-image"
              />

              <div className="gacha-overlay-title">
                まだひけないよ
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------
            スタート
            --------------------------------------------------- */}
        {gachaState ===
          'start' && (
          <div className="gacha-start-wrapper">
            <div className="gacha-image-container">
              <img
                src="/images/contents/gacha-back.png"
                alt="ガチャ機"
                className="gacha-center-image"
              />

              <div className="gacha-overlay-title">
                ガチャスタート！
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------
            アニメーション / 結果
            --------------------------------------------------- */}
        {(
          gachaState ===
            'animating' ||
          gachaState ===
            'result'
        ) && (
          <div className="gacha-result-wrapper">
            <div className="gacha-image-container">

              <img
                src={`/images/contents/gacha-animation.gif?timestamp=${gifTimestamp}`}
                alt="ガチャアニメーション"
                className={`gacha-gif-image ${
                  gachaState ===
                  'result'
                    ? 'dim-gif'
                    : ''
                }`}
              />

              {gachaState ===
                'result' &&
                currentItem && (
                  <div className="gacha-item-overlay">
                    <img
                      src={`/images/animals/${currentItem.item_image}`}
                      alt={
                        currentItem.item_name
                      }
                      className="gacha-item-image"
                    />

                    <p className="gacha-item-name">
                      {
                        currentItem.item_name
                      }
                    </p>
                  </div>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}