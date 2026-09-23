'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import './topic-setting.css';

type Genre = '学校' | '日常' | '趣味' | '雑学' | 'おもしろ';

const GENRES: Genre[] = ['学校', '日常', '趣味', '雑学', 'おもしろ'];

const TEMPLATE_DATABASE: Record<Genre, string[]> = {
  学校: [
    '今日の授業で一番なるほどと思ったことは？',
    'グループワークで工夫したポイントは？',
    '今回の単元で一番難しかった部分は？',
    '今日の授業で一番なるほどと思ったことは？',
    'グループワークで工夫したポイントは？',
    '今回の単元で一番難しかった部分は？',
    '今日の授業で一番なるほどと思ったことは？',
    'グループワークで工夫したポイントは？',
    '今回の単元で一番難しかった部分は？',
    '今日の授業で一番なるほどと思ったことは？',
    'グループワークで工夫したポイントは？',
    '今回の単元で一番難しかった部分は？',
    '今日の授業で一番なるほどと思ったことは？',
    'グループワークで工夫したポイントは？',
    '今回の単元で一番難しかった部分は？',
    '今日の授業で一番なるほどと思ったことは？',
    'グループワークで工夫したポイントは？',
    '今回の単元で一番難しかった部分は？',
    '今日の授業で一番なるほどと思ったことは？',
    'グループワークで工夫したポイントは？',
    '今回の単元で一番難しかった部分は？',
  ],
  日常: [
    '今日のご飯で一番おいしかったものは？',
    '朝起きて最初にすることは？',
    '今一番行きたい場所はどこ？',
  ],
  趣味: [
    '一番好きな動物とその理由は？',
    '最近ハマっているアニメやゲームは？',
    '休みの日に一番やりたいことは？',
  ],
  雑学: [
    '人に教えたくなる豆知識をひとつ教えて！',
    '世界で一番広い海の名前は？',
    '地球上に存在する一番大きい生き物は？',
  ],
  おもしろ: [
    'もし無人島に一つだけ持っていくなら？',
    '1日だけ透明人間になれたら何をする？',
    'もし超能力が一つ手に入るなら何がいい？',
  ],
};

// セレクトボックスのデフォルト説明用テキスト
const SELECT_PLACEHOLDER = '選択すると上のお題に反映されます';

export default function SetTopicPage() {
  const router = useRouter();

  // ジャンル選択 State
  const [selectedGenre, setSelectedGenre] = useState<Genre>('学校');

  // テキストボックスの入力値 State（初期状態は空）
  const [topicText, setTopicText] = useState<string>('');

  // セレクトボックスの選択値 State
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  // ドロップダウンの開閉 State
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  // モーダル表示 State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // ドロップダウン外側のクリック検知用Ref
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 外側クリックでドロップダウンを閉じる処理
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. 左側ジャンルボタン切替処理
  const handleGenreSelect = (genre: Genre) => {
    setSelectedGenre(genre);
    setSelectedTemplate('');
    setIsDropdownOpen(false);
  };

  // 2. カスタムテンプレート選択処理
  const handleTemplateSelect = (item: string) => {
    setSelectedTemplate(item);
    setTopicText(item); // お題テキストに反映
    setIsDropdownOpen(false); // ドロップダウンを閉じる
  };

  // 3. 確定ボタンクリック (モーダル開く)
  const handleOpenConfirmModal = () => {
    if (!topicText.trim()) {
      alert('お題を入力または選択してください');
      return;
    }
    setIsModalOpen(true);
  };

  // 4. モーダル内「はい」ボタンクリック処理
  const handleModalSubmit = () => {
    console.log('設定されたお題:', {
      genre: selectedGenre,
      topic: topicText,
    });
    setIsModalOpen(false);

    // クエリパラメータで mode=topic_cushion を渡して遷移する
    router.push('/wait?mode=topic_cushion');
  };

  return (
    <div className="topic-container">
      {/* 画面ヘッダー: 「◀ もどる」ボタン と 中央タイトル「お題設定」 */}
      <header className="topic-header">
        <button
          type="button"
          onClick={() => router.push('/home')}
          className="topic-back-button"
          aria-label="もどる"
        >
          <span className="back-arrow">▲</span>
          <span className="back-text">もどる</span>
        </button>
        <h1 className="topic-title">お題設定</h1>
      </header>

      {/* メインレイアウト（左: ジャンル切替 / 右: 入力・選択エリア・確定ボタン） */}
      <div className="topic-content-wrapper">
        {/* 左側: 縦並びのジャンル選択ボタン群 */}
        <div className="genre-button-group">
          {GENRES.map((genre) => {
            const isSelected = genre === selectedGenre;
            return (
              <button
                key={genre}
                type="button"
                onClick={() => handleGenreSelect(genre)}
                className={`genre-button ${isSelected ? 'active' : ''}`}
              >
                {genre}
              </button>
            );
          })}
        </div>

        {/* 右側: テキストボックス + セレクトボックス + 確定ボタン */}
        <div className="topic-input-section">
          {/* 上: お題表示・編集テキストエリア */}
          <div className="input-block">
            <label className="input-label">お題テキスト</label>
            <textarea
              value={topicText}
              onChange={(e) => setTopicText(e.target.value)}
              placeholder="お題を自由に入力するか、下のテンプレートから選択してください..."
              className="topic-custom-textarea"
            />
          </div>

          {/* 中: カスタムドロップダウン (下向き固定・最大高さ指定・大きな▼矢印) */}
          <div className="input-block">
            <label className="input-label">【{selectedGenre}】のテンプレートお題</label>
            <div className="custom-dropdown-container" ref={dropdownRef}>
              {/* トリガー表示枠 */}
              <button
                type="button"
                className={`custom-dropdown-trigger ${isDropdownOpen ? 'open' : ''}`}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span className={`trigger-text ${!selectedTemplate ? 'placeholder' : ''}`}>
                  {selectedTemplate || SELECT_PLACEHOLDER}
                </span>
                {/* 大きな▼矢印 */}
                <span className="dropdown-big-arrow">▼</span>
              </button>

              {/* 必ず下側に展開するリストメニュー */}
              {isDropdownOpen && (
                <ul className="custom-dropdown-menu">
                  {TEMPLATE_DATABASE[selectedGenre].map((item, index) => (
                    <li
                      key={index}
                      className={`dropdown-option ${selectedTemplate === item ? 'selected' : ''}`}
                      onClick={() => handleTemplateSelect(item)}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* 右下: 確定ボタン */}
          <div className="topic-footer">
            <Button onClick={handleOpenConfirmModal} className="topic-confirm-button">
              確定
            </Button>
          </div>
        </div>
      </div>

    {/* モーダルダイアログ */}
    {isModalOpen && (
      <div className="modal-overlay">
        <div className="modal-card">
          <p className="modal-message">
            お題
          </p>
          <p className="modal-message-topic">
            「<span className="modal-topic-highlight">{topicText}</span>」
          </p>

          {/* 追加：説明文 */}
          <p className="modal-subtext">
            「始める」を押すと、児童全員とあなたの端末で<br />
            このお題でのワークがスタートします。
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
              onClick={handleModalSubmit}
              className="modal-btn modal-btn-confirm"
            >
              始める
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}