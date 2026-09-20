'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
// Recharts から Tooltip 関連の型をインポート
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';
import './summary.css';

// 月別データ型
type MonthlyData = {
  month: string;
  count: number;
};

// 4月から3月までのダミーデータ (縦軸最大40人)
const MOCK_MONTHLY_DATA: MonthlyData[] = [
  { month: '4月', count: 12 },
  { month: '5月', count: 18 },
  { month: '6月', count: 22 },
  { month: '7月', count: 25 },
  { month: '8月', count: 20 },
  { month: '9月', count: 28 },
  { month: '10月', count: 32 },
  { month: '11月', count: 35 },
  { month: '12月', count: 30 },
  { month: '1月', count: 34 },
  { month: '2月', count: 37 },
  { month: '3月', count: 38 },
];

export default function RaisingHandsRatePage() {
  const router = useRouter();

  // クラス情報・年度情報（実際はContextやAPIから取得）
  const [classInfo] = useState({ gradeClass: '3年1組', schoolYear: '2026年度' });

  // ホームに戻る処理
  const handleBack = () => {
    router.back();
  };

  return (
    <div className="rate-container">
      {/* 画面左上: 「◀ もどる」ボタン */}
      <button className="rate-back-button" onClick={handleBack} aria-label="もどる">
        <span className="back-arrow">▲</span>
        <span className="back-text">もどる</span>
      </button>

      {/* 画面上部: タイトルと年度表記 */}
      <div className="rate-header">
        <h1 className="rate-title">{classInfo.gradeClass}の挙手率の変化</h1>
        <span className="rate-sub-title">{classInfo.schoolYear}</span>
      </div>

      {/* 画面中央〜下部: 横軸4〜3月、縦軸人数(最大40)の折れ線グラフ */}
      <div className="rate-chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={MOCK_MONTHLY_DATA}
            margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            
            {/* 横軸: 4月〜3月 */}
            <XAxis
              dataKey="month"
              stroke="#334155"
              tick={{ fontSize: 14, fontWeight: 'bold' }}
            />
            
            {/* 縦軸: 人数 (最大40) */}
            <YAxis
              domain={[0, 40]}
              ticks={[0, 10, 20, 30, 40]}
              stroke="#334155"
              tick={{ fontSize: 14, fontWeight: 'bold' }}
              label={{
                value: '人数（人）',
                angle: -90,
                position: 'insideLeft',
                offset: 0,
                style: { textAnchor: 'middle', fontWeight: 'bold', fill: '#334155' },
              }}
            />
            
            <Tooltip
            formatter={(value: ValueType | undefined) => [
                `${value ?? 0} 人`,
                '挙手人数',
            ]}
            contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '10px',
                border: '2px solid #3b82f6',
                fontWeight: 'bold',
            }}
            />
            
            {/* 折れ線 */}
            <Line
              type="monotone"
              dataKey="count"
              stroke="#2563eb"
              strokeWidth={4}
              dot={{ r: 6, fill: '#2563eb', strokeWidth: 2, stroke: '#ffffff' }}
              activeDot={{ r: 8, fill: '#1d4ed8' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}