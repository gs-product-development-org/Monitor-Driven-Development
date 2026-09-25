'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import './gacha.css';

// ----------------------------------------------------
// 設定定数
// ----------------------------------------------------
// ガチャを引ける回数（0 〜 3 で設定可能）
const TOTAL_GACHA_COUNT: number = 3;

// 排出アイテムをセッションに保存するキー名
export const GACHA_RESULT_ITEMS_KEY = 'gacha_result_items';

// GIFアニメーションの再生時間（ミリ秒）
const GIF_DURATION_MS = 6700;

// RPC関数の返り値に合わせた型定義
type Item = {
  obtained_item_id: number;
  item_name: string;
  item_image: string; // 例: "bear.png" などのファイル名＋拡張子
  rarity: string;
};

// ガチャの内部ステータス型
type GachaState = 'start' | 'animating' | 'result' | 'empty';

export default function GachaPage() {
  const router = useRouter();
  const { user } = useRequireAuth(); // 教員認証フック

  // 現在のステータス
  const [gachaState, setGachaState] = useState<GachaState>(
    (TOTAL_GACHA_COUNT === 0 ? 'empty' : 'start') as GachaState
  );

  // ガチャを引いた回数カウンタ
  const [currentCount, setCurrentCount] = useState<number>(0);

  // 現在画面に表示中の排出アイテム
  const [currentItem, setCurrentItem] = useState<Item | null>(null);

  // これまで獲得した全アイテムの履歴
  const [obtainedItems, setObtainedItems] = useState<Item[]>([]);

  // アニメーション中（連打防止ガードフラグ）
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  // GIFのキャッシュバスター用タイムスタンプ（毎実行ごとに新しくして最初から再生）
  const [gifTimestamp, setGifTimestamp] = useState<number>(Date.now());

  // タイマー参照
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // コンポーネント破棄時にタイマーをクリア
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // ガチャを1回実行する（RPC呼び出し ＋ GIF再生タイマー）
  const executeGacha = useCallback(async () => {
    setIsAnimating(true);
    setGachaState('animating');
    setCurrentItem(null);

    // GIFを最初から再生させるためにタイムスタンプを更新
    setGifTimestamp(Date.now());

    try {
      // Supabase の RPC 関数 draw_gacha() を呼び出し
      const { data, error } = await supabase.rpc('draw_gacha');

      if (error) {
        console.error('draw_gacha の実行に失敗しました:', error);
        alert('ガチャの実行中にエラーが発生しました');
        setIsAnimating(false);
        setGachaState('start');
        return;
      }

      const selectedItem: Item | null =
        Array.isArray(data) && data.length > 0 ? data[0] : null;

      if (!selectedItem) {
        alert('アイテムを取得できませんでした');
        setIsAnimating(false);
        setGachaState('start');
        return;
      }

      // GIFアニメーション再生時間後に結果表示ステータスに切り替え
      timerRef.current = setTimeout(() => {
        setCurrentItem(selectedItem);
        setObtainedItems((prev) => [...prev, selectedItem]);
        setCurrentCount((prev) => prev + 1);

        setGachaState('result');
        setIsAnimating(false);
      }, GIF_DURATION_MS);
    } catch (err) {
      console.error('予期せぬエラーが発生しました:', err);
      setIsAnimating(false);
      setGachaState('start');
    }
  }, []);

  // メイン進行アクション（クリック または Enterキー 押下時）
  const handleNextStep = useCallback(() => {
    // GIFアニメーション中のクリックは無効化（判定スキップ）
    if (isAnimating) return;

    // パターンA: 回数が 0 回の場合 -> ホーム画面へ戻る
    if (TOTAL_GACHA_COUNT === 0 || gachaState === 'empty') {
      router.push('/home');
      return;
    }

    // パターンB: 初期状態「ガチャスタート！」表示中 -> 1回目のガチャ開始
    if (gachaState === 'start') {
      executeGacha();
      return;
    }

    // パターンC: ガチャ結果表示中
    if (gachaState === 'result') {
      if (currentCount < TOTAL_GACHA_COUNT) {
        // まだガチャを引ける回数が残っている場合 -> 次のガチャを開始
        executeGacha();
      } else {
        // すべてのガチャを引き終わった場合 -> セッションに獲得アイテム情報を保存して配置画面へ遷移
        sessionStorage.setItem(
          GACHA_RESULT_ITEMS_KEY,
          JSON.stringify(obtainedItems)
        );
        console.log('排出アイテムを保存しました:', obtainedItems);
        router.push('/placement');
      }
    }
  }, [
    isAnimating,
    gachaState,
    currentCount,
    executeGacha,
    obtainedItems,
    router,
  ]);

  // キーボード (Enterキー) イベントの購読
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

  return (
    <div className="gacha-container" onClick={handleNextStep}>
      {/* バックグラウンド背景 */}
      <div className="gacha-background" />

      {/* メイン中央表示コンテンツエリア */}
      <div className="gacha-center-content">
        {/* 1. ガチャ回数が 0 回の場合 */}
        {gachaState === 'empty' && (
          <div className="gacha-start-wrapper">
            <div className="gacha-image-container">
              <img
                src="/images/contents/gacha-back.png"
                alt="ガチャ機"
                className="gacha-center-image"
              />
              <div className="gacha-overlay-title">ガチャはありません</div>
            </div>
          </div>
        )}

        {/* 2. 初期状態（「ガチャスタート！」表示） */}
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

        {/* 3 & 4. ガチャアニメーション中 ＋ ガチャ結果表示 */}
        {(gachaState === 'animating' || gachaState === 'result') && (
          <div className="gacha-result-wrapper">
            <div className="gacha-image-container">
              {/* GIF画像（結果画面の時は dim-gif クラスを付与して薄くする） */}
              <img
                src={`/images/contents/gacha-animation.gif?timestamp=${gifTimestamp}`}
                alt="ガチャアニメーション"
                className={`gacha-gif-image ${
                  gachaState === 'result' ? 'dim-gif' : ''
                }`}
              />

              {/* ガチャ結果表示（GIFの上に重ねて表示） */}
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

      {/* 残りガチャ回数のステータス表示 */}
      {TOTAL_GACHA_COUNT > 0 && (
        <div className="gacha-count-badge">
          ガチャ回数: {currentCount} / {TOTAL_GACHA_COUNT}
        </div>
      )}
    </div>
  );
}