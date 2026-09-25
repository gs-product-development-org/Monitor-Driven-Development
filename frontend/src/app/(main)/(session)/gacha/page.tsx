'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import './gacha.css';

export const GACHA_RESULT_ITEMS_KEY = 'gacha_result_items';
const CURRENT_WORK_TOPIC_KEY = 'current_work_topic';
const GIF_DURATION_MS = 6700;

type Item = {
  obtained_item_id: number;
  item_name: string;
  item_image: string;
  rarity: string;
};

type GachaState = 'start' | 'animating' | 'result' | 'empty';

export default function GachaPage() {
  const router = useRouter();
  const { user } = useRequireAuth();

  const [gachaState, setGachaState] = useState<GachaState>('start');
  const [totalGachaCount, setTotalGachaCount] = useState<number>(0);
  const [currentCount, setCurrentCount] = useState<number>(0);
  const [currentItem, setCurrentItem] = useState<Item | null>(null);
  const [obtainedItems, setObtainedItems] = useState<Item[]>([]);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [gifTimestamp, setGifTimestamp] = useState<number>(Date.now());

  // メーター用 State
  const [meterValue, setMeterValue] = useState<number>(0);
  const [needValue, setNeedValue] = useState<number>(1);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // メーターのみ最新化する関数
  const refreshMeter = useCallback(async (classId: number) => {
    try {
      const { data, error } = await supabase.rpc('get_meter', {
        p_class_id: classId,
      });

      if (!error && Array.isArray(data) && data.length > 0) {
        setMeterValue(data[0].gacha_meter ?? 0);
        setNeedValue(data[0].need_value > 0 ? data[0].need_value : 1);
      }
    } catch (err) {
      console.error('get_meter の取得エラー:', err);
    }
  }, []);

  // 初期読み込み：ガチャ分配計算RPC呼び出し
  useEffect(() => {
    const initGachaData = async () => {
      try {
        // class_id の特定
        let classId: number | null = (user as any)?.class_id ? Number((user as any).class_id) : null;
        if (!classId) {
          const { data: sessionData } = await supabase.auth.getSession();
          classId = Number(sessionData?.session?.user?.user_metadata?.class_id);
        }

        // topic_id の特定（sessionStorageから復元）
        let topicId: number | null = null;
        const storedTopic = sessionStorage.getItem(CURRENT_WORK_TOPIC_KEY);
        if (storedTopic) {
          try {
            const parsed = JSON.parse(storedTopic);
            if (parsed.topic_id) topicId = Number(parsed.topic_id);
          } catch (e) {
            console.error('sessionStorage の読み込み失敗:', e);
          }
        }

        if (!classId || !topicId) {
          console.warn('class_id または topic_id が不足しています');
          // メーター初期化のみ試行
          if (classId) await refreshMeter(classId);
          return;
        }

        // get_gacha_distribution 実行
        const { data, error } = await supabase.rpc('get_gacha_distribution', {
          p_class_id: classId,
          p_topic_id: topicId,
        });

        if (error) {
          console.error('get_gacha_distribution エラー:', error);
          await refreshMeter(classId);
          return;
        }

        if (Array.isArray(data) && data.length > 0) {
          const res = data[0];
          const quotient = res.quotient ?? 0;
          setTotalGachaCount(quotient);

          if (quotient === 0) {
            setGachaState('empty');
          } else {
            setGachaState('start');
          }
        }

        // メーター表示用の最新データも反映
        await refreshMeter(classId);
      } catch (err) {
        console.error('ガチャデータ初期化例外エラー:', err);
      }
    };

    initGachaData();
  }, [user, refreshMeter]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // ガチャの実行ロジック
  const executeGacha = useCallback(async () => {
    setIsAnimating(true);
    setGachaState('animating');
    setCurrentItem(null);
    setGifTimestamp(Date.now());

    try {
      const { data, error } = await supabase.rpc('draw_gacha');

      if (error || !Array.isArray(data) || data.length === 0) {
        alert('ガチャの実行に失敗しました');
        setIsAnimating(false);
        setGachaState('start');
        return;
      }

      const selectedItem: Item = data[0];

      timerRef.current = setTimeout(async () => {
        setCurrentItem(selectedItem);
        setObtainedItems((prev) => [...prev, selectedItem]);
        setCurrentCount((prev) => prev + 1);
        setGachaState('result');
        setIsAnimating(false);

        // 実行後にメーターを再更新
        let classId: number | null = (user as any)?.class_id ? Number((user as any).class_id) : null;
        if (classId) refreshMeter(classId);
      }, GIF_DURATION_MS);
    } catch (err) {
      console.error('予期せぬエラー:', err);
      setIsAnimating(false);
      setGachaState('start');
    }
  }, [user, refreshMeter]);

  // アクション制御
  const handleNextStep = useCallback(() => {
    if (isAnimating) return;

    if (totalGachaCount === 0 || gachaState === 'empty') {
      router.push('/home');
      return;
    }

    if (gachaState === 'start') {
      executeGacha();
      return;
    }

    if (gachaState === 'result') {
      if (currentCount < totalGachaCount) {
        executeGacha();
      } else {
        sessionStorage.setItem(
          GACHA_RESULT_ITEMS_KEY,
          JSON.stringify(obtainedItems)
        );
        router.push('/placement');
      }
    }
  }, [
    isAnimating,
    gachaState,
    currentCount,
    totalGachaCount,
    executeGacha,
    obtainedItems,
    router,
  ]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleNextStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextStep]);

  // ゲージ率の計算（0 ~ 100%）
  const fillPercentage = Math.min(
    100,
    Math.max(0, Math.floor((meterValue / needValue) * 100))
  );

  return (
    <div className="gacha-container" onClick={handleNextStep}>
      <div className="gacha-background" />

      {/* --- カスタムガチャメーターUI --- */}
      <div className="gacha-meter-container" onClick={(e) => e.stopPropagation()}>
        <div className="gacha-meter-label">
          <span>ガチャ</span>
          <span>ゲージ</span>
        </div>

        <div className="gacha-meter-bar-outer">
          <div
            className="gacha-meter-bar-inner"
            style={{ width: `${fillPercentage}%` }}
          />
        </div>

        <div className="gacha-meter-eggs">
          {[0, 1, 2].map((index) => {
            // 引ける回数（totalGachaCount - currentCount）に基づいて表示状態を切替
            const remainingDraws = totalGachaCount - currentCount;
            const isAvailable = index < remainingDraws;

            return (
              <img
                key={index}
                src="/images/contents/gacha-egg.png"
                alt="ガチャ卵"
                className={`gacha-egg-icon ${isAvailable ? 'active' : 'inactive'}`}
              />
            );
          })}
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="gacha-center-content">
        {gachaState === 'empty' && (
          <div className="gacha-start-wrapper">
            <div className="gacha-image-container">
              <img
                src="/images/contents/gacha-back.png"
                alt="ガチャ機"
                className="gacha-center-image"
              />
              <div className="gacha-overlay-title">まだひけないよ</div>
            </div>
          </div>
        )}

        {gachaState === 'start' && (
          <div className="gacha-start-wrapper">
            <div className="gacha-image-container">
              <img
                src="/images/contents/gacha-back.png"
                alt="ガチャ機"
                className="gacha-center-image"
              />
              <div className="gacha-overlay-title">ガチャスタート！</div>
            </div>
          </div>
        )}

        {(gachaState === 'animating' || gachaState === 'result') && (
          <div className="gacha-result-wrapper">
            <div className="gacha-image-container">
              <img
                src={`/images/contents/gacha-animation.gif?timestamp=${gifTimestamp}`}
                alt="ガチャアニメーション"
                className={`gacha-gif-image ${
                  gachaState === 'result' ? 'dim-gif' : ''
                }`}
              />

              {gachaState === 'result' && currentItem && (
                <div className="gacha-item-overlay">
                  <img
                    src={`/images/animals/${currentItem.item_image}`}
                    alt={currentItem.item_name}
                    className="gacha-item-image"
                  />
                  <p className="gacha-item-name">{currentItem.item_name}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}