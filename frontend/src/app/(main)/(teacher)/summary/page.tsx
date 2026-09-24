'use client';

import React, { useEffect, useState } from 'react';
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
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { supabase } from '@/lib/supabase';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import './summary.css';

// グラフ表示用のデータ型（rate を number | null に拡張）
type MonthlyData = {
  month: string;
  monthNum: number;
  rate: number | null; // データがない月は null にする
  hasData: boolean;
};

type RateRecord = {
  topic_id: number;
  rate: number;
  created_at: string;
};

const MONTH_ORDER = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];

export default function RaisingHandsRatePage() {
  const router = useRouter();
  const { user } = useRequireAuth();

  const [classInfo, setClassInfo] = useState({
    gradeClass: 'クラス',
    schoolYear: '2026年度',
  });

  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRates = async () => {
      setLoading(true);
      setError(null);

      try {
        let classId: number | null = null;
        let className = 'クラス';

        if (user) {
          classId = Number((user as any)?.class_id);
          if ((user as any)?.class_name) className = (user as any).class_name;
        }

        if (!classId || isNaN(classId)) {
          const { data: sessionData } = await supabase.auth.getSession();
          const sessionUser = sessionData?.session?.user;
          if (sessionUser) {
            classId = Number(sessionUser.user_metadata?.class_id);
            if (sessionUser.user_metadata?.class_name) {
              className = sessionUser.user_metadata.class_name;
            }
          }
        }

        if (!classId || isNaN(classId)) {
          throw new Error('所属クラスの情報を取得できませんでした。');
        }

        setClassInfo({
          gradeClass: className,
          schoolYear: `${new Date().getFullYear()}年度`,
        });

        const { data, error: rpcError } = await supabase.rpc('get_rates', {
          p_class_id: classId,
        });

        if (rpcError) {
          throw new Error(`[Code: ${rpcError.code}] ${rpcError.message}`);
        }

        // 月別集計バッファ
        const monthlyStats: Record<number, { sumRate: number; count: number }> = {};
        MONTH_ORDER.forEach((m) => {
          monthlyStats[m] = { sumRate: 0, count: 0 };
        });

        // 追跡用：データが存在した一番最近（最後）の月インデックス
        let lastActiveMonthIndex = -1;

        if (data && Array.isArray(data)) {
          (data as RateRecord[]).forEach((item) => {
            if (!item.created_at) return;
            const date = new Date(item.created_at);
            const month = date.getMonth() + 1; // 1~12

            if (monthlyStats[month] !== undefined) {
              monthlyStats[month].sumRate += Number(item.rate) || 0;
              monthlyStats[month].count += 1;

              // 該当月が MONTH_ORDER の何番目か特定し、最新インデックスを更新
              const orderIndex = MONTH_ORDER.indexOf(month);
              if (orderIndex > lastActiveMonthIndex) {
                lastActiveMonthIndex = orderIndex;
              }
            }
          });
        }

        // 4. グラフ表示用配列の作成
        // 最新データがある月までのデータのみ計算し、それ以降の月は rate を null にする
        const formattedChartData: MonthlyData[] = MONTH_ORDER.map((m, index) => {
          const stat = monthlyStats[m];
          const hasData = stat.count > 0;

          // 一番最近のデータがある月 index よりも後ろの月は rate を null に設定
          let rate: number | null = null;

          if (index <= lastActiveMonthIndex) {
            rate = hasData ? Math.round((stat.sumRate / stat.count) * 100) / 100 : 0;
          }

          return {
            month: `${m}月`,
            monthNum: m,
            rate: rate, // null の場合 Recharts はプロットを描画しません
            hasData: hasData,
          };
        });

        setMonthlyData(formattedChartData);
      } catch (err: any) {
        console.error('公開率データの取得エラー:', err);
        setError(err.message || 'データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, [user]);

  return (
    <div className="rate-container">
      <button
        type="button"
        onClick={() => router.push('/home')}
        className="rate-back-button"
        aria-label="もどる"
      >
        <span className="back-arrow">▲</span>
        <span className="back-text">もどる</span>
      </button>

      <div className="rate-header">
        <h1 className="rate-title">{classInfo.gradeClass}の公開率の変化</h1>
        <span className="rate-sub-title">{classInfo.schoolYear}</span>
      </div>

      <div className="rate-chart-wrapper">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <p>データを読み込み中...</p>
          </div>
        ) : error ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <p style={{ color: 'red' }}>{error}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={monthlyData}
              margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />

              <XAxis
                dataKey="month"
                stroke="#334155"
                tick={{ fontSize: 14, fontWeight: 'bold' }}
              />

              <YAxis
                domain={[0, 100]}
                ticks={[0, 20, 40, 60, 80, 100]}
                stroke="#334155"
                tick={{ fontSize: 14, fontWeight: 'bold' }}
                label={{
                  value: '公開率（%）',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 0,
                  style: { textAnchor: 'middle', fontWeight: 'bold', fill: '#334155' },
                }}
              />

              <Tooltip
                formatter={(value: ValueType | undefined) => [
                  value !== null && value !== undefined ? `${value} %` : 'データなし',
                  '平均公開率',
                ]}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '10px',
                  border: '2px solid #3b82f6',
                  fontWeight: 'bold',
                }}
              />

              {/* connectNulls={false}（デフォルト）により、null の箇所はプロットされず線も引かれません */}
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#2563eb"
                strokeWidth={4}
                dot={{ r: 6, fill: '#2563eb', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 8, fill: '#1d4ed8' }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}