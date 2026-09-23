'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import './anonymous-reveal.css';

export type Genre = '学校' | '日常' | '趣味' | '雑学' | 'おもしろ';

interface ReactionOption {
  id: string;
  label: string;
  emoji: string;
  colorClass: string;
}

// 5種類のジャンルごとに異なる4つのリアクションセット
// 左から順に: [感嘆系(黄), 共感系(橙), 賞賛系(青), 交流系(緑)]
const REACTION_SETS: Record<Genre, ReactionOption[]> = {
  学校: [
    { id: 'naruhodo', label: 'なるほど！', emoji: '💡', colorClass: 'btn-exclamation' },
    { id: 'wakaru', label: 'わかる！', emoji: '🤝', colorClass: 'btn-empathy' },
    { id: 'sugoi', label: 'すごーい！', emoji: '✨', colorClass: 'btn-praise' },
    { id: 'shiritai', label: 'もっと教えて！', emoji: '💬', colorClass: 'btn-interaction' },
  ],
  日常: [
    { id: 'oishisou', label: 'おいしそう！', emoji: '😋', colorClass: 'btn-exclamation' },
    { id: 'iine', label: 'いいね！', emoji: '👍', colorClass: 'btn-empathy' },
    { id: 'saikou', label: '最高！', emoji: '👑', colorClass: 'btn-praise' },
    { id: 'issho', label: '一緒に行きたい！', emoji: '🙌', colorClass: 'btn-interaction' },
  ],
  趣味: [
    { id: 'shiranakatta', label: '奥が深い！', emoji: '😲', colorClass: 'btn-exclamation' },
    { id: 'nakama', label: '仲間！', emoji: '❤️', colorClass: 'btn-empathy' },
    { id: 'kami', label: 'プロ級！', emoji: '🔥', colorClass: 'btn-praise' },
    { id: 'habata', label: '語りたい！', emoji: '🗣️', colorClass: 'btn-interaction' },
  ],
  雑学: [
    { id: 'hee', label: 'へぇ〜！', emoji: '🧠', colorClass: 'btn-exclamation' },
    { id: 'suru', label: '確かに！', emoji: '👌', colorClass: 'btn-empathy' },
    { id: 'tensai', label: '物知り！', emoji: '👏', colorClass: 'btn-praise' },
    { id: 'tameshita', label: '試したい！', emoji: '🧪', colorClass: 'btn-interaction' },
  ],
  おもしろ: [
    { id: 'waw', label: 'ウケる！', emoji: '🤣', colorClass: 'btn-exclamation' },
    { id: 'yabai', label: 'ツボった！', emoji: '😆', colorClass: 'btn-empathy' },
    { id: 'hasou', label: '発想の神！', emoji: '💡', colorClass: 'btn-praise' },
    { id: 'tuduki', label: '続き気になる！', emoji: '👀', colorClass: 'btn-interaction' },
  ],
};

interface AnswerData {
  id: string;
  content: string;
}

interface AnonymousRevealPageProps {
  genre?: Genre;
  topicText?: string;
  answers?: AnswerData[];
}

export default function AnonymousRevealPage({
  genre = '学校',
  topicText = '今日の授業で一番なるほどと思ったことは？',
  answers = [
    { id: '1', content: '光の屈折でプールの中の足が短く見えること！' },
    { id: '2', content: '植物も夜に呼吸をしていること。' },
    { id: '3', content: '分数の割り算はひっくり返して掛ける理由。' },
    { id: '4', content: '歴史の年代の覚え方の語呂合わせ。' },
  ],
}: AnonymousRevealPageProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const totalAnswers = answers.length;
  const currentAnswer = answers[currentIndex];

  const currentReactions = REACTION_SETS[genre] || REACTION_SETS['学校'];

  const handleSelectReaction = (reactionId: string) => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < totalAnswers) {
      setCurrentIndex(nextIndex);
    } else {
      router.push('/wait?mode=reaction_completed');
    }
  };

  return (
    <div className="reveal-container">
      {/* 1. お題表示 */}
      <header className="stock-main-topic">
        <h1 className="stock-topic-title">「{topicText}」</h1>
      </header>

      {/* 2. 卵インジケーター */}
      <div className="egg-indicator-bar">
        {answers.map((_, index) => {
          const isActive = index <= currentIndex;
          return (
            <div
              key={index}
              className={`egg-wrapper ${isActive ? 'active' : 'inactive'}`}
            >
              <img
                src="/images/contents/egg.png"
                alt={`卵 ${index + 1}`}
                className="egg-image"
              />
            </div>
          );
        })}
      </div>

      {/* 3. 卵背景の回答表示 */}
      <main className="egg-answer-container">
        <div className="egg-background-wrapper">
          <img
            src="/images/contents/answer-egg.png"
            alt="回答背景の卵"
            className="egg-background-image"
          />
          <div className="egg-answer-content">
            <p className="answer-text">{currentAnswer?.content}</p>
          </div>
        </div>
      </main>

      {/* 4. 4択リアクションボタン */}
      <footer className="reaction-buttons-row">
        {currentReactions.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`reaction-btn ${option.colorClass}`}
            onClick={() => handleSelectReaction(option.id)}
          >
            <span className="reaction-emoji">{option.emoji}</span>
            <span className="reaction-label">{option.label}</span>
          </button>
        ))}
      </footer>
    </div>
  );
}