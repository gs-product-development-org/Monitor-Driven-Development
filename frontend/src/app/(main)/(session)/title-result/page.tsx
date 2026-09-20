'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/Button';
import './title-result.css';

type ReactionType = 'like' | 'laugh' | 'surprise' | 'great';

type ReactionItem = {
  type: ReactionType;
  name: string;
  count: number;
  color: string;
};

const INITIAL_REACTIONS: ReactionItem[] = [
  { type: 'like', name: 'いいね', count: 5, color: '#3b82f6' },      // 青
  { type: 'laugh', name: 'おもしろい', count: 8, color: '#f59e0b' },  // オレンジ
  { type: 'surprise', name: 'びっくり', count: 0, color: '#ec4899' }, // ピンク (0個)
  { type: 'great', name: 'すごい', count: 3, color: '#10b981' },     // 緑
];

export default function ResultPage() {
  const router = useRouter();

  const [topicTitle] = useState<string>('朝起きて最初にすることは？');
  const [titleName] = useState<string>('ユーモアスター');
  const [titleDescription] = useState<string>(
    '「おもしろい」リアクションをたくさん獲得しました！みんなの朝を笑顔にする最高の発想力を持っています。'
  );
  const [characterImage] = useState<string>('/images/titles/humor-star.png');

  const [reactions] = useState<ReactionItem[]>(INITIAL_REACTIONS);

  // 0個のリアクションを除外
  const activeChartData = reactions.filter((item) => item.count > 0);

  const handleGoToAllAnswers = () => {
    router.push('/student/answers-list');
  };

  return (
    <div className="result-container">
      {/* 画面1番上: お題表示 */}
      <div className="result-topic-header">
        <span className="result-topic-label">お題</span>
        <h1 className="result-topic-title">{topicTitle}</h1>
      </div>

      {/* メインコンテンツエリア */}
      <div className="result-main-content">
        {/* 左半分: 称号表示 */}
        <div className="result-left-section">
          <div className="title-header-box">
            <span className="title-sub-label">獲得した称号</span>
            <h2 className="title-main-text">あなたの称号は【{titleName}】タイプ！</h2>
          </div>

          <div className="title-image-wrapper">
            <img
              src={characterImage}
              alt={titleName}
              className="title-character-image"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="title-image-fallback">
              <span className="fallback-emoji">🌟</span>
            </div>
          </div>

          <div className="title-description-box">
            <p className="description-text">{titleDescription}</p>
          </div>
        </div>

        {/* 右半分: リアクション内訳（個数は非表示） */}
        <div className="result-right-section">
          <h3 className="chart-title">リアクションの内訳</h3>

          {activeChartData.length > 0 ? (
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={activeChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="count"
                    nameKey="name"
                    /* グラフ上のラベルは割合(%)のみ表示 */
                    label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {activeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  {/* ホバー時のツールチップも個数を出さず、リアクション名のみ表示 */}
                  <Tooltip formatter={() => ['', '']} labelFormatter={(name) => `${name}`} />
                </PieChart>
              </ResponsiveContainer>

              {/* グラフ下の凡例（個数は排除し、色と名前のみを表示） */}
              <div className="chart-legend-list">
                {activeChartData.map((item) => (
                  <div key={item.type} className="legend-item">
                    <span
                      className="legend-color-dot"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="legend-label">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="no-reactions-box">まだリアクションがありません</div>
          )}
        </div>
      </div>

      {/* 画面の一番右下: 移動ボタン */}
      <div className="result-footer-action">
        <Button onClick={handleGoToAllAnswers} className="go-answers-button">
          みんなの回答一覧へ ➔
        </Button>
      </div>
    </div>
  );
}