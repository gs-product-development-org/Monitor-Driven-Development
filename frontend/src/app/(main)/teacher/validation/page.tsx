'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import './validation.css';

// 初期データのモック（ダミー）
const INITIAL_NG_WORDS = [
  'ばか',
  'あほ',
  'しね',
  'きもい',
  'うざい',
];

export default function NgWordsPage() {
  const router = useRouter();

  // NGワード一覧 State
  const [ngWords, setNgWords] = useState<string[]>(INITIAL_NG_WORDS);

  // 入力フォーム State
  const [newWord, setNewWord] = useState<string>(''); // 追加用
  const [searchQuery, setSearchQuery] = useState<string>(''); // 検索入力用
  const [activeSearchTerm, setActiveSearchTerm] = useState<string>(''); // 検索実行中のワード

  // 1. ワード追加処理
  const handleAddWord = () => {
    const trimmed = newWord.trim();
    if (!trimmed) {
      alert('NGワードを入力してください');
      return;
    }
    if (ngWords.includes(trimmed)) {
      alert('すでに登録されているNGワードです');
      return;
    }

    setNgWords([trimmed, ...ngWords]);
    setNewWord('');
  };

  // 2. 検索実行処理
  const handleSearch = () => {
    setActiveSearchTerm(searchQuery.trim());
  };

  // 3. ワード削除処理
  const handleDeleteWord = (targetWord: string) => {
    setNgWords(ngWords.filter((word) => word !== targetWord));
  };

  // 表示用リストのフィルタリング（検索語が入っていれば絞り込み、無ければ全件）
  const displayedWords = activeSearchTerm
    ? ngWords.filter((word) =>
        word.toLowerCase().includes(activeSearchTerm.toLowerCase())
      )
    : ngWords;

  return (
    <div className="ng-words-container">
      {/* 画面右上: 戻るボタン */}
      <div className="ng-words-header">
        <Button
          onClick={() => router.push('/zoo')}
          className="ng-back-button"
        >
          戻る
        </Button>
      </div>

      <div className="ng-words-content">
        {/* 1. 一番上: ワード入力ボックス + 右に追加ボタン */}
        <div className="ng-form-row">
          <input
            type="text"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            placeholder="新しいNGワードを入力..."
            className="ng-input"
          />
          <Button onClick={handleAddWord} className="ng-action-button">
            追加
          </Button>
        </div>

        {/* 2. その下: 既存ワード検索ボックス + 右に検索ボタン */}
        <div className="ng-form-row">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="登録済みワードを検索..."
            className="ng-input"
          />
          <Button onClick={handleSearch} className="ng-action-button">
            検索
          </Button>
        </div>

        {/* 3. さらに下: NGワードを縦に一覧表示 */}
        <div className="ng-list-container">
          <div className="ng-list-header">
            {activeSearchTerm ? (
              <span>「{activeSearchTerm}」の検索結果 ({displayedWords.length}件)</span>
            ) : (
              <span>登録済みNGワード一覧 ({displayedWords.length}件)</span>
            )}
            {activeSearchTerm && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveSearchTerm('');
                }}
                className="ng-search-clear"
              >
                クリア
              </button>
            )}
          </div>

          <ul className="ng-list">
            {displayedWords.length > 0 ? (
              displayedWords.map((word, index) => (
                <li key={index} className="ng-item">
                  <span className="ng-word-text">{word}</span>
                  <button
                    onClick={() => handleDeleteWord(word)}
                    className="ng-delete-button"
                  >
                    削除
                  </button>
                </li>
              ))
            ) : (
              <li className="ng-empty-item">該当するNGワードはありません</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}