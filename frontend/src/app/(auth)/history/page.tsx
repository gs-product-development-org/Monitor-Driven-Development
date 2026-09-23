'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import './history.css';

// 宝箱の保管データ型
type TreasureItem = {
  id: string;
  topicTitle: string;
  answerText: string;
};

// ダミーデータ（過去に宝箱にしまったお題と回答）
const MOCK_TREASURES: TreasureItem[] = [
  {
    id: '1',
    topicTitle: '朝起きて最初にすることは？',
    answerText: '布団の中で少しだけ深呼吸をする',
  },
  {
    id: '2',
    topicTitle: '好きなお弁当のおかずは？',
    answerText: '甘い卵焼きとウィンナー',
  },
  {
    id: '3',
    topicTitle: 'タイムマシンがあったらどこに行きたい？',
    answerText: '未来の自ああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああ',
  },
];

export default function TreasureBoxPage() {
  const router = useRouter();

  // 現在表示中の宝箱アイテムのインデックス
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const treasures = MOCK_TREASURES;
  const currentItem = treasures[currentIndex];

  // もどるボタン押下
  const handleBack = () => {
    router.back();
  };

  // 左へスライド（前のお題へ）
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : treasures.length - 1));
  };

  // 右へスライド（次のお題へ）
  const handleNext = () => {
    setCurrentIndex((prev) => (prev < treasures.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="treasure-container">
      {/* 画面左上: もどるボタン（左向きの黒い▲＋黒文字） */}
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
        {currentItem ? (
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
        ) : (
          <div className="treasure-empty">宝箱はまだからっぽです</div>
        )}

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