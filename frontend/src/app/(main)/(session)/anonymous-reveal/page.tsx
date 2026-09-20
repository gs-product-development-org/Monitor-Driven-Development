'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import './anonymous-reveal.css';

// 回答データ（卵）の型定義
type AnswerEgg = {
  id: string;
  authorName: string;
  text: string;
};

// 4種類のリアクション定義
type ReactionType = 'like' | 'laugh' | 'suprise' | 'great';

const REACTION_LIST: { type: ReactionType; label: string; icon: string }[] = [
  { type: 'like', label: 'いいね', icon: '👍' },
  { type: 'laugh', label: 'おもしろい', icon: '🤣' },
  { type: 'suprise', label: 'びっくり', icon: '😲' },
  { type: 'great', label: 'すごい', icon: '✨' },
];

// ダミーデータ（仮で4つの卵）
const MOCK_EGGS: AnswerEgg[] = [
  { id: '1', authorName: 'たろう', text: '朝起きてすぐに冷たい水を一杯飲むことです！' },
  { id: '2', authorName: 'はなこ', text: '飼っている犬の散歩に行って挨拶をすること。' },
  { id: '3', authorName: 'ケン', text: '二度寝を限界まで楽しむこと！' },
  { id: '4', authorName: 'サクラ', text: '好きな音楽を聴いてテンションを上げます。' },
];

export default function ReactionPage() {
  const router = useRouter();

  // お題タイトル
  const [topicTitle] = useState<string>('朝起きて最初にすることは？');

  // 卵データ一覧
  const [eggs] = useState<AnswerEgg[]>(MOCK_EGGS);

  // 現在表示中の卵のインデックス
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // アニメーション用 State ('idle' | 'sliding-out')
  const [slideState, setSlideState] = useState<'idle' | 'sliding-out'>('idle');

  // 終了状態フラグ
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // リアクションボタン押下時の処理
  const handleReaction = (reaction: ReactionType) => {
    if (slideState !== 'idle' || isCompleted) return;

    const currentEgg = eggs[currentIndex];
    console.log(`卵ID: ${currentEgg.id} にリアクション [${reaction}] を送信しました`);

    // 左へスライドアウトのアニメーション開始
    setSlideState('sliding-out');

    // アニメーション完了後に次の卵へ切り替え
    setTimeout(() => {
      if (currentIndex + 1 < eggs.length) {
        setCurrentIndex((prev) => prev + 1);
        setSlideState('idle');
      } else {
        // すべての卵をチェックし終えた場合
        setIsCompleted(true);
      }
    }, 350); // CSSアニメーション時間と合わせる
  };

  const currentEgg = eggs[currentIndex];

  return (
    <div className="reaction-container">
      {/* 1. 画面一番上: お題表示 */}
      <div className="reaction-topic-header">
        <span className="reaction-topic-label">みんなのお題</span>
        <h1 className="reaction-topic-title">{topicTitle}</h1>
      </div>

      {/* 2. 画面中央: 投稿内容が書かれた卵（カード）エリア */}
      <div className="reaction-egg-stage">
        {!isCompleted && currentEgg ? (
          <div className="egg-card-wrapper">
            <div className={`egg-card ${slideState === 'sliding-out' ? 'slide-left' : ''}`}>
              <div className="egg-author">{currentEgg.authorName} さんの回答</div>
              <p className="egg-content-text">{currentEgg.text}</p>
              <div className="egg-counter">
                {currentIndex + 1} / {eggs.length}
              </div>
            </div>
          </div>
        ) : (
          <div className="reaction-complete-card">
            <p className="complete-emoji">🎉</p>
            <p className="complete-text">すべての回答にリアクションしました！</p>
            <button
              onClick={() => router.push('/zoo')}
              className="complete-finish-button"
            >
              動物園へ戻る
            </button>
          </div>
        )}
      </div>

      {/* 3. 画面下部: 4種類のリアクションボタン */}
      <div className="reaction-buttons-row">
        {REACTION_LIST.map((item) => (
          <button
            key={item.type}
            onClick={() => handleReaction(item.type)}
            disabled={isCompleted || slideState !== 'idle'}
            className="reaction-action-button"
          >
            <span className="reaction-icon">{item.icon}</span>
            <span className="reaction-label">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}