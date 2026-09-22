'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import './wait.css';

type WaitMode = 'answer_submitted' | 'topic_cushion';

const OBTAINED_GACHA_IMAGES = [
  '/images/animals/title-example.png',
  '/images/animals/title-example.png',
  '/images/animals/title-example.png',
  '/images/animals/title-example.png',
  '/images/animals/title-example.png',
];

interface WaitPageProps {
  mode?: WaitMode;
  isTeacher?: boolean;
  waitingCount?: number;
  totalCount?: number;
}

// ① URLからクエリパラメータ(?mode=xxx)を取得するコンポーネント
export default function WaitPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WaitContent />
    </Suspense>
  );
}

// ② 実際の画面レンダリングを行うコンポーネント
function WaitContent({
  isTeacher = true,
  waitingCount = 18,
  totalCount = 30,
}: WaitPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ★ URLから ?mode= を取得。無ければ 'answer_submitted'
  const mode = (searchParams.get('mode') as WaitMode) || 'answer_submitted';

  const [randomImage, setRandomImage] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * OBTAINED_GACHA_IMAGES.length);
    setRandomImage(OBTAINED_GACHA_IMAGES[randomIndex]);

    // お題決定後のワンクッション（3秒タイマー）
    const timer = setTimeout(() => {
      if (mode === 'topic_cushion') {
        router.push('/answer');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [mode, router]);

  const handleConfirmTransition = () => {
    setIsModalOpen(false);
    router.push('/anonymous-reveal');
  };

  // モードごとのテキストをJSXで直接定義
  const renderMessage = () => {
    if (mode === 'topic_cushion') {
      return (
        <>
          まもなくワークが始まるよ！
          <br />
          準備はいいかな？
        </>
      );
    }
    return (
      <>
        みんなが終わるのを待ってね！
        <br />
        他の人の画面をのぞいたり、じゃましたりしないでね！
      </>
    );
  };

  return (
    <div className="wait-container">
      {/* 画面中央: 画像 */}
      <div className="wait-image-container">
        {randomImage && (
          <img
            src={randomImage}
            alt="獲得済み動物イラスト"
            className="wait-image"
          />
        )}
      </div>

      {/* 画像の下: テキスト */}
      <div className="wait-message-container">
        <p className="wait-message-text">{renderMessage()}</p>
      </div>

      {/* 回答後 ＋ 教師画面のみ表示する右下エリア */}
      {mode === 'answer_submitted' && isTeacher && (
        <div className="teacher-control-area">
          <div className="waiting-counter">
            待機中: <span className="count-highlight">{waitingCount}</span> / {totalCount}
          </div>
          <button
            type="button"
            className="transition-btn"
            onClick={() => setIsModalOpen(true)}
          >
            リアクション画面へ
          </button>
        </div>
      )}

      {/* モーダルダイアログ */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <p className="modal-subtext">
              「移動する」を押すと、児童全員とあなたの端末で
              <br />
              リアクション画面がスタートします。
            </p>

            <div className="modal-buttons-row">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="modal-btn modal-btn-cancel"
              >
                いいえ
              </button>
              <button
                type="button"
                onClick={handleConfirmTransition}
                className="modal-btn modal-btn-confirm"
              >
                移動する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}