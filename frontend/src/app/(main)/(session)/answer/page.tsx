'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import './answer.css';

type StockTopic = {
  id: string;
  text: string;
};

type Genre = '日常' | '好きなもの' | '雑学' | 'おもしろ' | '授業';
type ActionType = 'chest' | 'announce'; // 宝箱にしまう | 発表する

export default function TopicStockPage() {
  const router = useRouter();

  // フェーズ管理: 'input' (書き溜め・選択) -> 'action' (画像表示・アクション選択)
  const [step, setStep] = useState<'input' | 'action'>('input');

  // ジャンル・書き溜めリスト・入力 State
  const [selectedGenre] = useState<Genre>('日常');
  const [stockList, setStockList] = useState<StockTopic[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  // 確定後のアクション選択 State ('chest' | 'announce' | null)
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);

  // お題追加
  const handleAddStock = () => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      alert('お題を入力してください');
      return;
    }

    const newId = Date.now().toString();
    const newStock: StockTopic = { id: newId, text: trimmed };

    setStockList((prevList) => {
      if (prevList.length === 0) {
        setSelectedTopicId(newId);
      }
      return [...prevList, newStock];
    });

    setInputText('');
  };

  // 1回目の確定ボタン（書き溜めフェーズ終了）
  const handleFirstConfirm = () => {
    if (!selectedTopicId) return;
    setStep('action'); // 画面要素を切り替え
  };

  // 2回目の最終確定ボタン（アクション選択後）
  const handleFinalConfirm = () => {
    const selectedTopic = stockList.find((item) => item.id === selectedTopicId);
    if (!selectedTopic || !selectedAction) return;

    console.log('最終確定結果:', {
      genre: selectedGenre,
      topic: selectedTopic.text,
      action: selectedAction,
    });

    router.push('/zoo');
  };

  // 選択中のお題オブジェクトを取得
  const currentSelectedTopic = stockList.find((item) => item.id === selectedTopicId);

  return (
    <div className="stock-container">
      {/* 上部: 常に表示されるジャンル名 */}
      <div className="stock-main-topic">
        <span className="stock-topic-label">選択されたジャンル</span>
        <h1 className="stock-topic-title">{selectedGenre}</h1>
      </div>

      {/* ================= フェーズ 1: 書き溜め・選択 ================= */}
      {step === 'input' && (
        <>
          <div className="stock-center-wrapper">
            <div className="stock-chat-area">
              {stockList.length > 0 ? (
                stockList.map((item) => {
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
                })
              ) : (
                <div className="stock-empty-text">
                  下部の入力欄からお題を書き溜めてください
                </div>
              )}
            </div>

            {/* 中央右下: 1回目の確定ボタン */}
            <div className="stock-confirm-wrapper">
              <Button
                onClick={handleFirstConfirm}
                disabled={!selectedTopicId}
                className="stock-confirm-button"
              >
                確定
              </Button>
            </div>
          </div>

          {/* 下部: 記述欄 & 書き溜めボタン */}
          <div className="stock-input-area">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="お題を入力して書き溜める..."
              className="stock-input-box"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddStock();
              }}
            />
            <Button onClick={handleAddStock} className="stock-add-button">
              書き溜める
            </Button>
          </div>
        </>
      )}

      {/* ================= フェーズ 2: アクション選択 ================= */}
      {step === 'action' && (
        <div className="action-phase-wrapper">
          {/* 中央: 決定したお題のプレビュー画像・イラスト領域 */}
          <div className="action-image-card">
            <div className="action-topic-preview">
              <span className="preview-label">決定したお題</span>
              <p className="preview-text">{currentSelectedTopic?.text}</p>
            </div>
            {/* メインイラスト表示（例: 黒板・イラスト画像） */}
            <div className="action-illustration-box">
              <img
                src="/images/topic-board.png"
                alt="決定お題ボード"
                className="action-illustration"
              />
            </div>
          </div>

          {/* 下部: 「宝箱にしまう」「発表する」トグルボタン + 右側の確定ボタン */}
          <div className="action-buttons-row">
            <div className="action-toggle-group">
              <button
                type="button"
                className={`action-toggle-btn ${selectedAction === 'chest' ? 'active' : ''}`}
                onClick={() => setSelectedAction('chest')}
              >
                宝箱にしまう
              </button>
              <button
                type="button"
                className={`action-toggle-btn ${selectedAction === 'announce' ? 'active' : ''}`}
                onClick={() => setSelectedAction('announce')}
              >
                発表する
              </button>
            </div>

            {/* どちらかを選択しないと押せない確定ボタン */}
            <Button
              onClick={handleFinalConfirm}
              disabled={!selectedAction}
              className="action-final-confirm-button"
            >
              確定
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}