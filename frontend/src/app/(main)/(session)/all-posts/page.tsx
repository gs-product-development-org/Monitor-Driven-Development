'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSync } from '@/components/realtime/SyncContainer';
import './all-posts.css';

// 共通の背景卵画像パス
const EGG_IMAGE_PATH = '/images/contents/answer-egg.png';

// 投稿データ型（IDとテキストのみ）
interface AnswerItem {
  id: string;
  answerText: string;
}

// サンプルデータ（全員分）
const DUMMY_ANSWERS: AnswerItem[] = Array.from({ length: 24 }).map((_, index) => ({
  id: `ans-${index + 1}`,
  answerText: `これは${index + 1}番目の回答メッセージです！`,
}));

export default function AnswersListPage() {
  const router = useRouter();
  const { isTeacher: syncIsTeacher, navigateAll } = useSync();

  const [selectedGenre] = useState<string>('「こんな朝ごはんは嫌だ」どんな朝ごはん？');
  const [answers] = useState<AnswerItem[]>(DUMMY_ANSWERS);

  // SyncContainer の isTeacher を優先使用
  const isTeacher = syncIsTeacher;

  // 1行に表示する「投稿データ」の数は最大3つ
  const POSTS_PER_ROW = 3;
  // 全投稿数から必要な行数を計算
  const totalRows = Math.ceil(answers.length / POSTS_PER_ROW);

  // ★ ガチャ画面へ全員一斉に移動するハンドラー
  const handleGoToGacha = async () => {
    if (navigateAll) {
      await navigateAll('/gacha');
    } else {
      router.push('/gacha');
    }
  };

  return (
    <div className="answers-container">
      {/* 画面中央上部: お題表示エリア */}
      <header className="topic-header-wrapper">
        <div className="stock-main-topic">
          <h1 className="stock-topic-title">{selectedGenre}</h1>
        </div>
      </header>

      {/* スクロール可能なメインエリア */}
      <main className="answers-scroll-area">
        <div className="answers-egg-grid">
          {Array.from({ length: totalRows }).map((_, rowIndex) => {
            const isOffsetRow = rowIndex % 2 === 1;

            const rowAnswers = answers.slice(
              rowIndex * POSTS_PER_ROW,
              (rowIndex + 1) * POSTS_PER_ROW
            );

            return (
              <div
                key={`row-${rowIndex}`}
                className={`egg-row ${isOffsetRow ? 'offset-row' : ''}`}
              >
                {/* ズレ時に左端にチラ見えさせる「文字なし卵」 */}
                {isOffsetRow && (
                  <div className="egg-card-wrapper dummy-half-egg">
                    <img src={EGG_IMAGE_PATH} alt="背景卵" className="egg-bg-image" />
                  </div>
                )}

                {/* メインの投稿用卵 */}
                {rowAnswers.map((answer) => (
                  <div key={answer.id} className="egg-card-wrapper">
                    <img src={EGG_IMAGE_PATH} alt="背景卵" className="egg-bg-image" />
                    <div className="egg-content-overlay">
                      <p className="egg-answer-text">{answer.answerText}</p>
                    </div>
                  </div>
                ))}

                {/* ズレていない行で右端にチラ見えさせる「文字なし卵」 */}
                {!isOffsetRow && (
                  <div className="egg-card-wrapper dummy-half-egg">
                    <img src={EGG_IMAGE_PATH} alt="背景卵" className="egg-bg-image" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* ★ 教師のみ表示する右下のガチャボタン */}
      {isTeacher && (
        <div className="teacher-gacha-button-wrapper">
          <button onClick={handleGoToGacha} className="gacha-action-button">
            ガチャ画面へ
          </button>
        </div>
      )}
    </div>
  );
}