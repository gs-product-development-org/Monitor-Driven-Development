'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useSync } from '@/components/realtime/SyncContainer';
import './title.css';

type TitleData = {
  title_id: number | null;
  title_name: string;
  title_detail: string;
  image: string;
};

// 初回・未取得時のデフォルトデータ
const DEFAULT_TITLE: TitleData = {
  title_id: null,
  title_name: 'まだないよ',
  title_detail: '意見を公開して称号をゲットしよう！',
  image: '/images/animals/non_animal.png',
};

export default function TitleDetailPage() {
  const router = useRouter();

  // 1. SyncContext から共通の classId, userId, isLoading を取得
  const { classId, userId, isLoading: isSyncLoading } = useSync();

  const [titleData, setTitleData] = useState<TitleData>(DEFAULT_TITLE);
  const [loading, setLoading] = useState<boolean>(true);

  // 2. 称号取得ロジック
  const fetchTitle = useCallback(async (cId: number, uId: number) => {
    setLoading(true);

    try {
      const { data, error: rpcError } = await supabase.rpc('get_title', {
        p_class_id: cId,
        p_user_number: uId, // RPCの定義に合わせて userId (または userNumber) を渡す
      });

      if (rpcError || !data || data.length === 0) {
        // データがない・エラー時はデフォルトを表示
        setTitleData(DEFAULT_TITLE);
      } else {
        const result = data[0];

        // title_image_path の先頭に `/images/animals/` を結合
        let imagePath = DEFAULT_TITLE.image;
        if (result.title_image_path) {
          const rawPath = result.title_image_path.startsWith('/')
            ? result.title_image_path.slice(1)
            : result.title_image_path;
          imagePath = `/images/animals/${rawPath}`;
        }

        setTitleData({
          title_id: Number(result.title_id),
          title_name: result.title_name || '称号なし',
          title_detail: result.title_detail || '',
          image: imagePath,
        });
      }
    } catch (err) {
      console.error('称号取得エラー:', err);
      setTitleData(DEFAULT_TITLE);
    } finally {
      setLoading(false);
    }
  }, []);

  // 3. classId と userId が確定したタイミングで称号を取得
  useEffect(() => {
    if (!isSyncLoading) {
      if (classId && userId) {
        fetchTitle(classId, userId);
      } else {
        setLoading(false);
      }
    }
  }, [classId, userId, isSyncLoading, fetchTitle]);

  if (isSyncLoading || loading) {
    return (
      <div className="title-detail-container">
        <p className="loading-text">称号を計算中...</p>
      </div>
    );
  }

  return (
    <div className="title-detail-container">
      {/* 画面左上: 「◀ もどる」ボタン */}
      <button
        type="button"
        onClick={() => router.push('/home')}
        className="title-back-button"
        aria-label="もどる"
      >
        <span className="back-arrow">▲</span>
        <span className="back-text">もどる</span>
      </button>

      {/* 画面上部: 称号ヘッダーテキスト */}
      <div className="title-header">
        <p className="title-sub">あなたの称号は</p>
        <h1 className="title-main">{titleData.title_name}！</h1>
      </div>

      {/* 画面中央: イラスト */}
      <div className="title-image-container">
        <img
          src={titleData.image || '/images/animals/title-example.png'}
          alt={titleData.title_name}
          className="title-image"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/animals/title-example.png';
          }}
        />
      </div>

      {/* 画面下部: 称号の説明文 */}
      <div className="title-footer">
        <p className="title-description">{titleData.title_detail}</p>
      </div>
    </div>
  );
}