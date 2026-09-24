'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import './history.css';

// 宝箱の保管データ型（SQL関数の戻り値に合わせた型定義）
type TreasureItem = {
  post_id: number;
  topic_id: number;
  topicTitle: string;
  answerText: string;
  created_at: string;
};

export default function TreasureBoxPage() {
  const router = useRouter();
  const { user } = useRequireAuth();

  const [treasures, setTreasures] = useState<TreasureItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTreasures = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. セッションまたは useRequireAuth から user_id を特定
        let targetUserId: number | null = null;

        if (user) {
          const parsed = Number((user as any)?.user_id || (user as any)?.id || (user as any)?.student_id);
          if (!isNaN(parsed) && parsed > 0) {
            targetUserId = parsed;
          }
        }

        // user から直接取得できなかった場合、Supabase セッションを直接確認
        if (!targetUserId) {
          const { data: sessionData } = await supabase.auth.getSession();
          const sessionUser = sessionData?.session?.user;

          if (sessionUser) {
            // カスタムメタデータや ID から数値の user_id を取得
            const metaUserId = Number(
              sessionUser.user_metadata?.user_id || sessionUser.user_metadata?.student_id || sessionUser.id
            );
            if (!isNaN(metaUserId) && metaUserId > 0) {
              targetUserId = metaUserId;
            }
          }
        }

        // ログイン情報または user_id が取得できない場合
        if (!targetUserId) {
          throw new Error('ユーザーセッションを取得できませんでした。ログインし直してください。');
        }

        // 2. Supabase RPC 関数 `get_treasure_box_posts` の呼び出し
        const { data, error: rpcError } = await supabase.rpc('get_treasure_box_posts', {
          p_user_id: targetUserId,
        });

        if (rpcError) {
          throw new Error(`[Code: ${rpcError.code}] ${rpcError.message}`);
        }

        // 3. 取得データの整形とState更新
        if (data && data.length > 0) {
          const formattedData: TreasureItem[] = data.map((item: any) => ({
            post_id: item.post_id,
            topic_id: item.topic_id,
            topicTitle: item.topic_content || '',
            answerText: item.post_content || '',
            created_at: item.created_at,
          }));

          setTreasures(formattedData);
        } else {
          setTreasures([]);
        }
      } catch (err: any) {
        console.error('宝箱データ取得エラー:', err);
        setError(err.message || 'データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchTreasures();
  }, [user]);

  const currentItem = treasures[currentIndex];

  // 左へスライド（前のお題へ）
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : treasures.length - 1));
  };

  // 右へスライド（次のお題へ）
  const handleNext = () => {
    setCurrentIndex((prev) => (prev < treasures.length - 1 ? prev + 1 : 0));
  };

  // 読み込み中の表示
  if (loading) {
    return (
      <div className="treasure-container">
        <button
          type="button"
          onClick={() => router.push('/home')}
          className="history-back-button"
          aria-label="もどる"
        >
          <span className="back-arrow">▲</span>
          <span className="back-text">もどる</span>
        </button>
        <div className="treasure-empty-wrapper">
          <p className="treasure-empty-text">宝箱を開けているよ...</p>
        </div>
      </div>
    );
  }

  // 宝箱が空（またはエラー発生時）の表示
  if (error || treasures.length === 0) {
    return (
      <div className="treasure-container">
        {/* 画面左上: もどるボタン */}
        <button
          type="button"
          onClick={() => router.push('/home')}
          className="history-back-button"
          aria-label="もどる"
        >
          <span className="back-arrow">▲</span>
          <span className="back-text">もどる</span>
        </button>

        {/* 画面中央: 空メッセージのみ表示 */}
        <div className="treasure-empty-wrapper">
          <p className="treasure-empty-text">宝箱はまだ空だよ</p>
        </div>
      </div>
    );
  }

  return (
    <div className="treasure-container">
      {/* 画面左上: もどるボタン */}
      <button
        type="button"
        onClick={() => router.push('/home')}
        className="history-back-button"
        aria-label="もどる"
      >
        <span className="back-arrow">▲</span>
        <span className="back-text">もどる</span>
      </button>

      {/* 画面上側: タイトル */}
      <div className="treasure-header">
        <h1 className="treasure-title">宝箱の中身</h1>
      </div>

      {/* 画面中央: スライド表示エリア */}
      <div className="treasure-slider-area">
        {/* 左向きの黒い三角ボタン */}
        <button
          className="slider-arrow-button prev"
          onClick={handlePrev}
          aria-label="前のお題へ"
        >
          ▲
        </button>

        {/* 中央コンテンツ領域 */}
        <div className="treasure-content-box">
          {/* 上側: お題テキスト */}
          <p className="treasure-topic-text">お題：{currentItem.topicTitle}</p>

          {/* 下側: 横向きの卵画像 ＋ 中の回答テキスト */}
          <div className="horizontal-egg-wrapper">
            <img
              src="/images/contents/history-egg.png"
              alt="横向きの卵"
              className="horizontal-egg-img"
            />
            <div className="egg-text-overlay">
              <p className="egg-answer-text">{currentItem.answerText}</p>
            </div>
          </div>

          {/* カウンター表示（例: 1/3） */}
          <div className="treasure-counter">
            {currentIndex + 1} / {treasures.length}
          </div>
        </div>

        {/* 右向きの黒い三角ボタン */}
        <button
          className="slider-arrow-button next"
          onClick={handleNext}
          aria-label="次のお題へ"
        >
          ▲
        </button>
      </div>
    </div>
  );
}