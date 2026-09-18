'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import './answer.css';

// 書き溜めたお題の型定義
type StockTopic = {
  id: string;
  text: string;
};

// 5種類のジャンル
type Genre = '日常' | '好きなもの' | '雑学' | 'おもしろ' | '授業';

export default function TopicStockPage() {
  const router = useRouter();

  // 1. 先生が前画面で選んだ1つのジャンル
  const [selectedGenre] = useState<Genre>('日常');

  // 2. 書き溜めたお題を保存・管理する配列 State
  const [stockList, setStockList] = useState<StockTopic[]>([]);

  // 3. 下部の記述ボックスに入力中のテキスト State
  const [inputText, setInputText] = useState<string>('');

  // 4. 中央エリアで選択されたお題のID State
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  // 【書き溜めロジック】入力したテキストを配列(stockList)に追加保存する
  const handleAddStock = () => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      alert('お題を入力してください');
      return;
    }

    const newId = Date.now().toString();
    const newStock: StockTopic = {
      id: newId,
      text: trimmed,
    };

    setStockList((prevList) => {
      // 一番最初の書き溜めの場合、そのお題を自動的に選択状態にする
      if (prevList.length === 0) {
        setSelectedTopicId(newId);
      }
      return [...prevList, newStock];
    });

    // 入力欄をクリア
    setInputText('');
  };

  // 【選択ロジック】吹き出しを1つ選択（再度クリックで解除）
  const handleSelectTopic = (id: string) => {
    setSelectedTopicId((prevId) => (prevId === id ? null : id));
  };

  // 【確定ロジック】選択中の1つを確定して次の処理へ
  const handleConfirm = () => {
    const selectedTopic = stockList.find((item) => item.id === selectedTopicId);
    if (!selectedTopic) return;

    console.log('確定されたお題:', {
      genre: selectedGenre,
      topic: selectedTopic.text,
    });

    router.push('/zoo');
  };

  return (
    <div className="stock-container">
      {/* 画面上部: 5ジャンルから選ばれた1つのジャンルのみ表示 */}
      <div className="stock-main-topic">
        <span className="stock-topic-label">選択されたジャンル</span>
        <h1 className="stock-topic-title">{selectedGenre}</h1>
      </div>

      {/* 画面中央: 書き溜めたお題が縦に並ぶLINE風エリア */}
      <div className="stock-center-wrapper">
        <div className="stock-chat-area">
          {stockList.length > 0 ? (
            stockList.map((item) => {
              const isSelected = item.id === selectedTopicId;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectTopic(item.id)}
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

        {/* 中央エリアの右下: 1つ選択されている時のみ押せる確定ボタン */}
        <div className="stock-confirm-wrapper">
          <Button
            onClick={handleConfirm}
            disabled={!selectedTopicId}
            className="stock-confirm-button"
          >
            確定
          </Button>
        </div>
      </div>

      {/* 画面下部: 記述ボックス + 書き溜めボタン */}
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
    </div>
  );
}