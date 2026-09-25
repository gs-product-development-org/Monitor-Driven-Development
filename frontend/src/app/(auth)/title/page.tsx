'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import './title.css';

type TitleData = {
  title_id: number;
  title_name: string;
  title_detail: string;
  image?: string;
};

// 初回・未取得時のデフォルトデータ
const DEFAULT_TITLE: TitleData = {
  title_id: 0,
  title_name: 'まだないよ',
  title_detail: '意見を公開して称号をゲットしよう！',
  image: '/images/animals/non_animal.png',
};

export default function TitleDetailPage() {
  const router = useRouter();
  const { user } = useRequireAuth();

  const [titleData, setTitleData] = useState<TitleData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchTitle = async () => {
      setLoading(true);
      setError(null);

      try {
        const classId = Number((user as any)?.class_id);
        const userNumber = Number((user as any)?.user_number || (user as any)?.student_id || (user as any)?.user_id);

        // if (isNaN(classId) || isNaN(userNumber)) {
        //   throw new Error('称号はまだないよ');
        // }

        if (isNaN(classId) || isNaN(userNumber)) {
          setTitleData(DEFAULT_TITLE);
          return;
        }

        const { data, error: rpcError } = await supabase.rpc('get_title', {
          p_class_id: classId,
          p_user_number: userNumber,
        });

        if (rpcError || !data || data.length === 0) {
          // データがない・エラー時はデフォルト（はてな画像）を表示
          setTitleData(DEFAULT_TITLE);
        } else {
          const result = data[0];
          setTitleData({
            title_id: Number(result.title_id),
            title_name: result.title_name || '称号なし',
            title_detail: result.title_detail || '',
            image: `/images/animals/title-${result.title_id}.png`,
          });
        }
      } catch (err) {
        // 例外発生時もデフォルトを表示
        setTitleData(DEFAULT_TITLE);
      } finally {
        setLoading(false);
      }
    };

    fetchTitle();
  }, [user]);

  if (loading) {
    return (
      <div className="title-detail-container">
        <p className="loading-text">称号を計算中...</p>
      </div>
    );
  }

  // titleData が入っている状態（データあり / デフォルトはてな表示 共通）
  const currentTitle = titleData || DEFAULT_TITLE;

  // if (error || !titleData) {
  //   return (
  //     <div className="title-detail-container">
  //       <button
  //         type="button"
  //         onClick={() => router.push('/home')}
  //         className="title-back-button"
  //         aria-label="もどる"
  //       >
  //         <span className="back-arrow">▲</span>
  //         <span className="back-text">もどる</span>
  //       </button>

  //       <div className="title-empty-wrapper">
  //         <p className="title-error-message">
  //           {error || '称号はまだないよ'}
  //         </p>
  //       </div>
  //     </div>
  //   );
  // }

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