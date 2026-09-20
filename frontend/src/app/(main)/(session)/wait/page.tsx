'use client';

import React, { useState } from 'react';
import './wait.css';

// フェーズごとの表示データ定義
type WaitPhase = 'answer_submitted' | 'waiting_teacher' | 'phase_completed';

type WaitMessageConfig = {
  image: string;
  message: string;
};

// フェーズごとの画像と黒文字文章のマッピング
const PHASE_CONFIGS: Record<WaitPhase, WaitMessageConfig> = {
  answer_submitted: {
    image: '/images/wait-egg.png',
    message: 'みんなの とうこうを まっているよ！',
  },
  waiting_teacher: {
    image: '/images/wait-animal.png',
    message: 'せんせいが がちゃを まわすのを まってね！',
  },
  phase_completed: {
    image: '/images/wait-complete.png',
    message: 'きょうの つぶサファは これでおわりです。おつかれさまでした！',
  },
};

export default function WaitPage() {
  // 現在のフェーズ State（実際のアプリでは WebSocket や Props / Context で制御）
  const [currentPhase] = useState<WaitPhase>('answer_submitted');

  const config = PHASE_CONFIGS[currentPhase] || PHASE_CONFIGS.answer_submitted;

  return (
    <div className="wait-container">
      {/* 画面中央: 画像 */}
      <div className="wait-image-container">
        <img
          src={config.image}
          alt="待機中のイラスト"
          className="wait-image"
        />
      </div>

      {/* 画像の下: フェーズごとの黒文字文章 */}
      <div className="wait-message-container">
        <p className="wait-message-text">{config.message}</p>
      </div>
    </div>
  );
}