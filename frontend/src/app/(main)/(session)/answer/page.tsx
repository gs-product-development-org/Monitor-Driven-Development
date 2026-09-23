'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import './answer.css';

type StockTopic = {
  id: string;
  text: string;
};

type Genre = '日常' | '好きなもの' | '雑学' | 'おもしろ' | '授業';
type ActionType = 'chest' | 'announce';

export default function TopicStockPage() {
  const router = useRouter();

  const [step, setStep] = useState<'input' | 'action'>('input');
  const [selectedGenre] = useState<Genre>('日常');
  const [stockList, setStockList] = useState<StockTopic[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  // --- モーダル管理用 State ---
  // フェーズ1の確定用モーダル
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  // フェーズ2のアクション確認用モーダル ('chest' | 'announce' | null)
  const [pendingAction, setPendingAction] = useState<ActionType | null>(null);

  // --- スクロール検知用 ---
  const chatAreaRef = useRef<HTMLDivElement | null>(null);
  const [canScroll, setCanScroll] = useState<boolean>(false);

  // スクロール可能か＆最下部までスクロールしていないかを判定する関数
  const checkScrollable = () => {
    const el = chatAreaRef.current;
    if (!el) return;

    // コンテンツの高さが要素の高さを超えているか
    const hasScroll = el.scrollHeight > el.clientHeight;
    // 最下部に到達しているかどうか (誤差を吸収するため - 5px)
    const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 5;

    // スクロール可能かつ、まだ最下部までスクロールしていない場合に表示
    setCanScroll(hasScroll && !isAtBottom);
  };

  // お題リストが更新された際、または画面サイズ変更時に判定
  useEffect(() => {
    checkScrollable();
    window.addEventListener('resize', checkScrollable);
    return () => window.removeEventListener('resize', checkScrollable);
  }, [stockList, step]);

  const handleAddStock = () => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      alert('お題を入力してください');
      return;
    }

    const newId = Date.now().toString();
    const newStock: StockTopic = { id: newId, text: trimmed };

    setStockList((prevList) => [...prevList, newStock]);
    setInputText('');
  };

  // フェーズ1の「確定」ボタン押下時: モーダルを開く
  const handleFirstConfirm = () => {
    if (!selectedTopicId) return;
    setIsModalOpen(true);
  };

  // フェーズ1モーダルの「これにする」ボタン押下時: モーダルを閉じてフェーズ2へ遷移
  const handlePhase1ModalSubmit = () => {
    setIsModalOpen(false);
    setStep('action');
  };

  // フェーズ2のボタン選択時: モーダルを表示
  const handleActionSelect = (action: ActionType) => {
    setPendingAction(action);
  };

  // フェーズ2モーダルの「保存する/始める」ボタン押下時: 最終確定処理
  const handleActionModalSubmit = () => {
    const selectedTopic = stockList.find((item) => item.id === selectedTopicId);
    if (!selectedTopic || !pendingAction) return;

    console.log('最終確定結果:', {
      genre: selectedGenre,
      topic: selectedTopic.text,
      action: pendingAction,
    });

    if (pendingAction === 'chest') {
      // 宝箱に保存する場合の追加処理があればここに記述
    } else if (pendingAction === 'announce') {
      // 発表（ワーク開始）する場合の追加処理があればここに記述
    }

    setPendingAction(null);
    router.push('/wait');
  };

  const currentSelectedTopic = stockList.find((item) => item.id === selectedTopicId);

  return (
    <div className="stock-container">
      {/* 上部: 常に表示されるジャンル名 */}
      <div className="stock-main-topic">
        <h1 className="stock-topic-title">{selectedGenre}</h1>
      </div>

      {/* ================= フェーズ 1: 書き溜め・選択 ================= */}
      {step === 'input' && (
        <>
          <div className="stock-center-wrapper">
            <div
              ref={chatAreaRef}
              onScroll={checkScrollable}
              className="stock-chat-area"
            >
              {stockList.length > 0 ? (
                <>
                  <p className="stock-instruction-text">
                    ※書き留めた回答の中から1つ選んで「確定」ボタンを押してね
                  </p>

                  {stockList.map((item) => {
                    const isSelected = item.id === selectedTopicId;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedTopicId(item.id)}
                        className={`chat-bubble ${isSelected ? 'selected' : ''}`}
                      >
                        <p className="chat-text">{item.text}</p>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="stock-empty-text">
                  ※下部の入力欄から回答を書き溜めてください
                </div>
              )}
            </div>

            {canScroll && (
              <div className="scroll-indicator">
                <span>▼</span>
                <span>スクロール</span>
              </div>
            )}
          </div>

          {/* 下部: 入力欄 ＋ 確定ボタン */}
          <div className="stock-input-area">
            <div className="stock-input-wrapper">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="回答を入力して書き溜める..."
                className="stock-input-box"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddStock();
                }}
              />
              <button
                type="button"
                onClick={handleAddStock}
                className="stock-icon-submit-button"
                aria-label="書き溜める"
              >
                <svg
                  className="stock-send-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>

            <Button
              onClick={handleFirstConfirm}
              disabled={!selectedTopicId}
              className="stock-confirm-button"
            >
              確定
            </Button>
          </div>
        </>
      )}

      {/* ================= フェーズ 2: アクション選択 ================= */}
      {step === 'action' && (
        <div className="action-phase-wrapper">
          <div className="action-illustration-box">
            <img
              src="/images/contents/answer-egg.png"
              alt="決定お題ボード"
              className="action-illustration"
            />
            <div className="action-topic-preview">
              <p className="preview-text">{currentSelectedTopic?.text}</p>
            </div>
          </div>

          <div className="action-buttons-row">
            <button
              type="button"
              className="action-toggle-btn"
              onClick={() => handleActionSelect('chest')}
            >
              宝箱にしまう
            </button>
            <button
              type="button"
              className="action-toggle-btn action-toggle-btn-primary"
              onClick={() => handleActionSelect('announce')}
            >
              公開する
            </button>
          </div>

          {/* フェーズ 2 確認モーダル */}
          {pendingAction && (
            <div className="modal-overlay">
              <div className="modal-card">
                <p className="modal-message">回答</p>
                <p className="modal-message-topic">
                  「<span className="modal-topic-highlight">{currentSelectedTopic?.text}</span>」
                </p>

                <p className="modal-subtext">
                  {pendingAction === 'chest' ? (
                    <>
                      この回答を自分だけの宝箱にしまいますか？<br />
                      しまった回答は後から確認できるよ
                    </>
                  ) : (
                    <>
                      この回答を公開しますか？<br />
                      誰が公開したかはわからないよ
                    </>
                  )}
                </p>

                <div className="modal-buttons-row">
                  <button
                    type="button"
                    onClick={() => setPendingAction(null)}
                    className="modal-btn modal-btn-cancel"
                  >
                    いいえ
                  </button>
                  <button
                    type="button"
                    onClick={handleActionModalSubmit}
                    className="modal-btn modal-btn-confirm"
                  >
                    {pendingAction === 'chest' ? 'しまう' : '公開する'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= フェーズ 1 確認モーダル ================= */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <p className="modal-message">回答</p>
            <p className="modal-message-topic">
              「<span className="modal-topic-highlight">{currentSelectedTopic?.text}</span>」
            </p>

            <p className="modal-subtext">
              「これにする」を押すと<br />
              もう回答の変更はできません
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
                onClick={handlePhase1ModalSubmit}
                className="modal-btn modal-btn-confirm"
              >
                これにする
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}