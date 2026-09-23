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

interface TitleData {
  id: string;
  name: string;
  description: string;
  characterImage: string;
}

const INITIAL_REACTIONS: ReactionItem[] = [
  { type: 'like', name: 'いいね', count: 5, color: '#3b82f6' },
  { type: 'laugh', name: 'おもしろい', count: 8, color: '#f59e0b' },
  { type: 'surprise', name: 'びっくり', count: 0, color: '#ec4899' },
  { type: 'great', name: 'すごい', count: 3, color: '#10b981' },
];

export default function ResultPage() {
  const router = useRouter();

  const [isPrivate] = useState<boolean>(false);

  // ★ 称号データ
  const [titleData] = useState<TitleData>({
    id: 'humor-star',
    name: 'ユーモアスター',
    description:
      'みんなの朝を笑顔にする最高の発想力を持っています。',
    characterImage: '/images/animals/title-example.png',
  });

  const [reactions] = useState<ReactionItem[]>(INITIAL_REACTIONS);

  const activeChartData = reactions.filter((item) => item.count > 0);

  const handleGoToAllAnswers = () => {
    router.push('/all-posts');
  };

  return (
    <div className="result-container">
      {/* メインコンテンツエリア */}
      <div className="result-main-content">
        {/* 左半分: 称号表示 */}
        <div className="result-left-section-clean">
          {!isPrivate ? (
            /* 通常時（公開選択時） */
            <>
              <div className="title-header-box">
                <h2 className="title-main-text">
                  <span className="title-sub-text">あなたの称号は</span>
                  <br />
                  <span className="title-highlight-text">【{titleData.name}】タイプ！</span>
                </h2>
              </div>

              <div className="title-image-wrapper">
                <img
                  src={titleData.characterImage}
                  alt={titleData.name}
                  className="title-character-image"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                    const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div className="title-image-fallback" style={{ display: 'none' }}>
                  <img
                    src="/images/animals/title-example.png"
                    alt="称号フォールバック画像"
                    className="fallback-image"
                  />
                </div>
              </div>

              <div className="title-description-box">
                <p className="description-text">{titleData.description}</p>
              </div>
            </>
          ) : (
            /* ★ 非公開選択時 */
            <div className="private-title-placeholder">
              <h2 className="title-main-text">こんな称号があるよ！</h2>
              <div className="title-image-wrapper">
                <div className="title-image-fallback" style={{ display: 'flex' }}>
                  <img
                    src="/images/animals/title-example.png"
                    alt="称号紹介画像"
                    className="fallback-image"
                  />
                </div>
              </div>
              <div className="title-description-box">
                <p className="description-text">
                  非公開選択時は、獲得称号ではなく全体で用意されている称号の紹介・一覧メッセージが表示されます。
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 右エリア: 白い枠（グラフ） ＋ 下部ボタン */}
        <div className="result-right-section">
          {/* 白い枠組み（カードエリア） */}
          <div className="chart-card">
            <h3 className="chart-title">リアクションの内訳</h3>

            {activeChartData.length > 0 ? (
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={activeChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={0}
                      outerRadius={100}
                      paddingAngle={0}
                      dataKey="count"
                      nameKey="name"
                      label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {activeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={() => ['', '']} labelFormatter={(name) => `${name}`} />
                  </PieChart>
                </ResponsiveContainer>

                {/* 凡例 */}
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

          {/* 白い枠の外（右エリアの下部）に配置するボタン */}
          <div className="right-section-footer">
            <Button onClick={handleGoToAllAnswers} className="go-answers-button">
              みんなの回答へ
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}