'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
import { useSync } from '@/components/realtime/SyncContainer';
import './summary.css';

// =====================================================
// グラフ表示用データ
// =====================================================
type MonthlyData = {
  month: string;
  monthNum: number;
  rate: number | null;
  hasData: boolean;
};

// =====================================================
// get_rates RPCの戻り値
// =====================================================
type RateRecord = {
  month_num: number;
  rate: number;
};

// =====================================================
// 4月 → 翌年3月の順番
// =====================================================
const MONTH_ORDER = [
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  1,
  2,
  3,
];

export default function RaisingHandsRatePage() {
  const router = useRouter();
  const { user } = useRequireAuth();

  // ===================================================
  // SyncContainerからclassIdを取得
  // ===================================================
  const {
    classId: syncClassId,
    isLoading: isSyncLoading,
  } = useSync();

  // ===================================================
  // クラス情報
  // ===================================================
  const [classInfo, setClassInfo] = useState({
    gradeClass: 'クラス',
    schoolYear: `${new Date().getFullYear()}年度`,
  });

  // ===================================================
  // グラフデータ
  // ===================================================
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);

  const [loading, setLoading] = useState<boolean>(true);

  const [error, setError] = useState<string | null>(null);

  // ===================================================
  // 公開率データ取得
  // ===================================================
  const fetchRates = useCallback(
    async (targetClassId: number) => {
      setLoading(true);
      setError(null);

      try {
        // =================================================
        // ① クラス名取得
        // =================================================
        let className = 'クラス';

        if (user && (user as any)?.class_name) {
          className = (user as any).class_name;
        } else {
          const { data: classData, error: classError } =
            await supabase
              .from('classes')
              .select('class_name')
              .eq('class_id', targetClassId)
              .maybeSingle();

          if (classError) {
            console.error(
              'クラス情報取得エラー:',
              classError
            );
          }

          if (classData?.class_name) {
            className = classData.class_name;
          }
        }

        setClassInfo({
          gradeClass: className,

          // 4月〜3月の年度表示
          schoolYear:
            new Date().getMonth() + 1 >= 4
              ? `${new Date().getFullYear()}年度`
              : `${new Date().getFullYear() - 1}年度`,
        });

        // =================================================
        // ② get_rates RPC
        // =================================================
        const {
          data,
          error: rpcError,
        } = await supabase.rpc('get_rates', {
          p_class_id: targetClassId,
        });

        if (rpcError) {
          throw new Error(
            `[Code: ${rpcError.code}] ${rpcError.message}`
          );
        }

        // =================================================
        // ③ RPC結果をmonth_numでMap化
        //
        // RPC側ですでに、
        //
        // topic_idごとの公開率
        //        ↓
        // 月ごとの平均
        //
        // まで計算済み
        // =================================================
        const rateMap = new Map<number, number>();

        if (data && Array.isArray(data)) {
          (data as RateRecord[]).forEach((item) => {
            const monthNum = Number(item.month_num);
            const rate = Number(item.rate);

            if (
              !Number.isNaN(monthNum) &&
              !Number.isNaN(rate)
            ) {
              rateMap.set(monthNum, rate);
            }
          });
        }

        // =================================================
        // ④ グラフ表示用データを作成
        // =================================================
        let lastActiveMonthIndex = -1;

        MONTH_ORDER.forEach((month, index) => {
          if (rateMap.has(month)) {
            lastActiveMonthIndex = index;
          }
        });

        const formattedChartData: MonthlyData[] =
          MONTH_ORDER.map((month, index) => {
            const hasData = rateMap.has(month);

            let rate: number | null = null;

            if (index <= lastActiveMonthIndex) {
              rate = hasData
                ? rateMap.get(month) ?? 0
                : 0;
            }

            return {
              month: `${month}月`,
              monthNum: month,
              rate,
              hasData,
            };
          });

        setMonthlyData(formattedChartData);
      } catch (err: any) {
        console.error(
          '公開率データの取得エラー:',
          err
        );

        setError(
          err.message ||
            'データの取得に失敗しました'
        );
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // ===================================================
  // classId取得後に公開率取得
  // ===================================================
  useEffect(() => {
    if (isSyncLoading) {
      return;
    }

    if (syncClassId) {
      fetchRates(syncClassId);
    } else {
      setLoading(false);

      setError(
        '所属クラスの情報を取得できませんでした。'
      );
    }
  }, [
    syncClassId,
    isSyncLoading,
    fetchRates,
  ]);

  // ===================================================
  // 画面
  // ===================================================
  return (
    <div className="rate-container">

      {/* 戻るボタン */}
      <button
        type="button"
        onClick={() => router.push('/home')}
        className="rate-back-button"
        aria-label="もどる"
      >
        <span className="back-arrow">
          ▲
        </span>

        <span className="back-text">
          もどる
        </span>
      </button>

      {/* ヘッダー */}
      <div className="rate-header">

        <h1 className="rate-title">
          {classInfo.gradeClass}
          の公開率の変化
        </h1>

        <span className="rate-sub-title">
          {classInfo.schoolYear}
        </span>

      </div>

      {/* グラフ */}
      <div className="rate-chart-wrapper">

        {loading || isSyncLoading ? (

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
            }}
          >
            <p>
              データを読み込み中...
            </p>
          </div>

        ) : error ? (

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
            }}
          >
            <p style={{ color: 'red' }}>
              {error}
            </p>
          </div>

        ) : (

          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart
              data={monthlyData}
              margin={{
                top: 20,
                right: 30,
                left: 10,
                bottom: 20,
              }}
            >

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
              />

              <XAxis
                dataKey="month"
                stroke="#334155"
                tick={{
                  fontSize: 14,
                  fontWeight: 'bold',
                }}
              />

              <YAxis
                domain={[0, 100]}
                ticks={[
                  0,
                  20,
                  40,
                  60,
                  80,
                  100,
                ]}
                stroke="#334155"
                tick={{
                  fontSize: 14,
                  fontWeight: 'bold',
                }}
                label={{
                  value: '公開率（%）',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 0,
                  style: {
                    textAnchor: 'middle',
                    fontWeight: 'bold',
                    fill: '#334155',
                  },
                }}
              />

              <Tooltip
                formatter={(
                  value: ValueType | undefined
                ) => [
                  value !== null &&
                  value !== undefined
                    ? `${value} %`
                    : 'データなし',

                  '平均公開率',
                ]}
                contentStyle={{
                  backgroundColor:
                    'rgba(255, 255, 255, 0.95)',
                  borderRadius: '10px',
                  border:
                    '2px solid #3b82f6',
                  fontWeight: 'bold',
                }}
              />

              <Line
                type="monotone"
                dataKey="rate"
                stroke="#2563eb"
                strokeWidth={4}
                dot={{
                  r: 6,
                  fill: '#2563eb',
                  strokeWidth: 2,
                  stroke: '#ffffff',
                }}
                activeDot={{
                  r: 8,
                  fill: '#1d4ed8',
                }}
                connectNulls={false}
              />

            </LineChart>
          </ResponsiveContainer>

        )}

      </div>
    </div>
  );
}