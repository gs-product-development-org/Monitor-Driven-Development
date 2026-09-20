'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import './all-posts.css';

// 投稿データの型定義
type AnswerItem = {
  id: string;
  text: string;
};

// ダミーデータ（スクロールを確認できるように多めに配置）
const MOCK_ANSWERS: AnswerItem[] = [
  { id: '1', text: '朝起きてすぐに冷たい水を一杯飲むことです！' },
  { id: '2', text: '飼っている犬の散歩に行って挨拶をすること。' },
  { id: '3', text: '二度寝を限界まで楽しむこと！' },
  { id: '4', text: '好きな音楽を聴いてテンションを上げます。' },
  { id: '5', text: 'カーテンをあけて太陽の光をあびる。' },
  { id: '6', text: 'ストレッチをして体をほぐす！' },
  { id: '7', text: '今日やることを頭の中で整理する。' },
  { id: '8', text: '家族に「おはよう」と大きな声で言う。' },
  { id: '9', text: '白湯をのんで体を温める。' },
  { id: '10', text: 'お気に入りの服に着替える！' },
  { id: '11', text: '歯磨きをして目を覚ます。' },
  { id: '12', text: '布団の中でスマホのニュースを見る。' },
];

export default function AnswersListPage() {
  const router = useRouter();

  // お題 State
  const [topicTitle] = useState<string>('朝起きて最初にすることは？');

  // 投稿一覧 State
  const [answers] = useState<AnswerItem[]>(MOCK_ANSWERS);

  // ロール判定（画面確認用に切り替え可能。本来は認証コンテキストやpropsから取得）
  const [isTeacher] = useState<boolean>(true);

  // ガチャ画面へ遷移する処理
  const handleGoToGacha = () => {
    router.push('/teacher/gacha');
  };

  return (
    <div className="answers-container">
      {/* 画面上部: お題表示 */}
      <div className="answers-topic-header">
        <span className="answers-topic-label">みんなの回答一覧のお題</span>
        <h1 className="answers-topic-title">{topicTitle}</h1>
      </div>

      {/* 画面中央〜下部: 縦スクロール可能な卵グリッドエリア */}
      <div className="answers-scroll-area">
        <div className="answers-egg-grid">
          {answers.map((item, index) => {
            // 偶数行・奇数行でオフセット（互い違い）のクラスを付与
            const rowIndex = Math.floor(index / 4);
            const isOddRow = rowIndex % 2 === 1;

            return (
              <div
                key={item.id}
                className={`answers-egg-card ${isOddRow ? 'shift-row' : ''}`}
              >
                <div className="egg-card-inner">
                  <p className="egg-text">{item.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 画面右下: 先生画面にだけ表示される「ガチャへ」ボタン */}
      {isTeacher && (
        <div className="answers-teacher-action">
          <Button onClick={handleGoToGacha} className="go-gacha-button">
            ガチャへ進む ➔
          </Button>
        </div>
      )}
    </div>
  );
}