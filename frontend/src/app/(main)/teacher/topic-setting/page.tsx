'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import './topic-setting.css';

type Genre = '日常' | '好きなもの' | '雑学' | 'おもしろ' | '授業';
type InputMode = 'template' | 'custom';

const TEMPLATE_DATABASE: Record<Genre, string[]> = {
  日常: [
    '今日のご飯で一番おいしかったものは？',
    '朝起きて最初にすることは？',
    '今一番行きたい場所はどこ？',
  ],
  好きなもの: [
    '一番好きな動物とその理由は？',
    '好きな季節とおすすめの過ごし方は？',
    '最近ハマっているアニメやゲームは？',
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
  授業: [
    '今日の授業で一番なるほどと思ったことは？',
    'グループワークで工夫したポイントは？',
    '今回の単元で一番難しかった部分は？',
  ],
};

export default function SetTopicPage() {
  const router = useRouter();

  const [selectedGenre, setSelectedGenre] = useState<Genre>('日常');
  const [inputMode, setInputMode] = useState<InputMode>('template');
  const [selectedTemplateText, setSelectedTemplateText] = useState<string>(
    TEMPLATE_DATABASE['日常'][0]
  );
  const [customText, setCustomText] = useState<string>('');

  const handleGenreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newGenre = e.target.value as Genre;
    setSelectedGenre(newGenre);
    setSelectedTemplateText(TEMPLATE_DATABASE[newGenre][0] || '');
  };

  const handleConfirm = () => {
    const finalTopic =
      inputMode === 'template' ? selectedTemplateText : customText;

    if (!finalTopic.trim()) {
      alert('お題を入力してください');
      return;
    }

    console.log('設定されたお題:', {
      genre: selectedGenre,
      mode: inputMode,
      topic: finalTopic,
    });

    router.push('/zoo');
  };

  return (
    <div className="topic-container">
      {/* 1. 上部: 横並びの2つのセレクトボックス */}
      <div className="topic-header-selects">
        <select
          value={selectedGenre}
          onChange={handleGenreChange}
          className="topic-select"
        >
          <option value="日常">日常</option>
          <option value="好きなもの">好きなもの</option>
          <option value="雑学">雑学</option>
          <option value="おもしろ">おもしろ</option>
          <option value="授業">授業</option>
        </select>

        <select
          value={inputMode}
          onChange={(e) => setInputMode(e.target.value as InputMode)}
          className="topic-select"
        >
          <option value="template">テンプレート</option>
          <option value="custom">カスタム</option>
        </select>
      </div>

      {/* 2. 中央: 動的入力ボックスパーツ */}
      <div className="topic-center-box">
        {inputMode === 'template' ? (
          <select
            value={selectedTemplateText}
            onChange={(e) => setSelectedTemplateText(e.target.value)}
            className="topic-template-select"
          >
            {TEMPLATE_DATABASE[selectedGenre].map((item, index) => (
              <option key={index} value={item}>
                {item}
              </option>
            ))}
          </select>
        ) : (
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="お題を自由に入力してください..."
            className="topic-custom-textarea"
          />
        )}
      </div>

      {/* 3. 右下: 確定ボタン（共通コンポーネント） */}
      <div className="topic-footer">
        <Button onClick={handleConfirm} className="topic-confirm-button">
          確定
        </Button>
      </div>
    </div>
  );
}