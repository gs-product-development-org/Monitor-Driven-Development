'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import './title.css';

type TitleData = {
  name: string;
  image: string;
  description: string;
};

// ダミーデータ（実際のアプリではユーザー情報や獲得称号に応じて変更）
const MOCK_CURRENT_TITLE: TitleData = {
  name: 'アイデア探検家',
  image: '/images/titles/title-explorer.png',
  description: 'たくさんの思いつきを宝箱に集めたあかし！',
};

export default function TitleDetailPage() {
  const router = useRouter();
  const [currentTitle] = useState<TitleData>(MOCK_CURRENT_TITLE);

  // ホーム画面等に戻る処理
  const handleBack = () => {
    router.back();
  };

  return (
    <div className="title-detail-container">
      {/* 画面左上: 「◀ もどる」ボタン */}
      <button className="back-button" onClick={handleBack} aria-label="もどる">
        <span className="back-arrow">▲</span>
        <span className="back-text">もどる</span>
      </button>

      {/* 画面上部: 称号ヘッダーテキスト (2行) */}
      <div className="title-header">
        <p className="title-sub">あなたの称号は</p>
        <h1 className="title-main">{currentTitle.name}！</h1>
      </div>

      {/* 画面中央: イラスト */}
      <div className="title-image-container">
        <img
          src={currentTitle.image}
          alt={currentTitle.name}
          className="title-image"
        />
      </div>

      {/* 画面下部: 称号の説明文 (1行) */}
      <div className="title-footer">
        <p className="title-description">{currentTitle.description}</p>
      </div>
    </div>
  );
}