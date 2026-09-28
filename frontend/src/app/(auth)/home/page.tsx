'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useSync } from '@/components/realtime/SyncContainer';
import './home.css';

const MAP_WIDTH = 3200;
const MAP_HEIGHT = 3600;

type PlacedAnimal = {
  placement_id: number;
  x_coord: number;
  y_coord: number;
  item_name?: string;
  item_image?: string;
};

export default function ZooHomePage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  // SyncContext から共通情報と各種操作メソッドを取得
  const { isTeacher, classId, userId, isLoading: isSyncLoading, channel } = useSync();

  const [showScrollHint, setShowScrollHint] = useState<boolean>(true);
  const [placedAnimals, setPlacedAnimals] = useState<PlacedAnimal[]>([]);

  // ガチャメーター用 State
  const [meterValue, setMeterValue] = useState<number>(0);
  const [needValue, setNeedValue] = useState<number>(1);

  // メーター情報取得ロジック
  const fetchMeter = useCallback(async (cId: number) => {
    try {
      const { data, error } = await supabase.rpc('get_meter', {
        p_class_id: cId,
      });

      if (!error && Array.isArray(data) && data.length > 0) {
        setMeterValue(data[0].gacha_meter ?? 0);
        setNeedValue(data[0].need_value > 0 ? data[0].need_value : 1);
      }
    } catch (err) {
      console.error('get_meter の取得エラー:', err);
    }
  }, []);

  // 配置情報取得ロジック
  const fetchPlacements = useCallback(async (cId: number) => {
    try {
      const { data, error } = await supabase.rpc(
        'get_zoo_placements',
        {
          p_class_id: cId,
        }
      );

      if (error) {
        console.error('get_zoo_placements取得失敗:', error);
        return;
      }

      const formatted: PlacedAnimal[] = (data ?? []).map(
        (item: any) => ({
          placement_id: item.placement_id,
          x_coord: item.x_coord,
          y_coord: item.y_coord,
          item_name: item.item_name || '名称不明',
          item_image: item.item_image || 'default.png',
        })
      );

      setPlacedAnimals(formatted);
    } catch (err) {
      console.error('通信エラー:', err);
    }
  }, []);

  // 初期データ取得 (classId が確定したタイミングで実行)
  useEffect(() => {
    if (classId) {
      fetchMeter(classId);
      fetchPlacements(classId);
    }
  }, [classId, fetchMeter, fetchPlacements]);

  // スクロール位置制御
  useEffect(() => {
    const scrollToBottom = () => {
      if (containerRef.current) {
        containerRef.current.scrollTop =
          containerRef.current.scrollHeight - containerRef.current.clientHeight;
      }
    };

    scrollToBottom();
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleScroll = () => {
    if (!containerRef.current || !showScrollHint) return;
    const container = containerRef.current;
    const isAtBottom =
      container.scrollTop + container.clientHeight >= container.scrollHeight - 30;

    if (!isAtBottom) {
      setShowScrollHint(false);
    }
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('user_info');
    } catch (error) {
      console.error('ログアウト処理エラー:', error);
    } finally {
      router.push('/login');
    }
  };

  const handleOpenTreasure = () => router.push('/history');
  const handleOpenTitle = () => router.push('/title');
  const handleOpenNgWord = () => router.push('/validation');
  const handleSetTopic = () => router.push('/topic-setting');
  const handleOpenRaisingHandsRate = () => router.push('/summary');

  // メーターのパーセンテージ計算 (0～100%)
  const fillPercentage = Math.min(
    100,
    Math.max(0, Math.floor((meterValue / needValue) * 100))
  );

  return (
    <div className="zoo-container" ref={containerRef} onScroll={handleScroll}>
      {/* 画面右上: ガチャメーター */}
      <div className="top-right-gacha-area">
        <div className="gacha-meter-container-home">
          <div className="gacha-meter-label">
            <span>ガチャ</span>
            <span>ゲージ</span>
          </div>

          <div className="gacha-meter-bar-outer">
            <div
              className="gacha-meter-bar-inner"
              style={{ width: `${fillPercentage}%` }}
            />
          </div>

          <div className="gacha-meter-eggs">
            {[0, 1, 2].map((index) => (
              <img
                key={index}
                src="/images/contents/gacha-egg.png"
                alt="ガチャ卵"
                className="gacha-egg-icon inactive"
              />
            ))}
          </div>
        </div>
      </div>

      {/* 画面右上: 教員用アクションボタン */}
      {isTeacher && (
        <div className="top-right-teacher-area">
          <div className="teacher-actions-column">
            <div
              className="icon-button-wrapper"
              onClick={handleOpenNgWord}
              role="button"
              tabIndex={0}
            >
              <img
                src="/images/contents/NG-settings.png"
                alt="NGワード"
                className="overlap-icon"
              />
              <button type="button" className="NG-teacher-btn">
                NGワード登録
              </button>
            </div>

            <div
              className="icon-button-wrapper"
              onClick={handleOpenRaisingHandsRate}
              role="button"
              tabIndex={0}
            >
              <img
                src="/images/contents/summary.png"
                alt="公開率"
                className="overlap-icon"
              />
              <button type="button" className="summary-teacher-btn">
                公開率を見る
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 動物配置描画エリア */}
      <div className="zoo-scroll-content">
        {placedAnimals.map((animal) => {
          const leftPercent = (animal.x_coord / MAP_WIDTH) * 100;
          const topPercent = (animal.y_coord / MAP_HEIGHT) * 100;

          return (
            <div
              key={animal.placement_id}
              className="placed-animal-wrapper"
              style={{
                position: 'absolute',
                left: `${leftPercent}%`,
                top: `${topPercent}%`,
                transform: 'translate(-50%, -100%)',
                zIndex: 10,
              }}
            >
              <img
                src={`/images/animals/${animal.item_image}`}
                alt={animal.item_name}
                className="placed-animal-img"
              />
            </div>
          );
        })}
      </div>

      {/* 左上エリア */}
      <div className="top-left-area" style={{ zIndex: 100 }}>
        <Button onClick={handleLogout} className="logout-btn">
          ログアウト
        </Button>
        {isTeacher && (
          <>
            <br />
            <span className="user-info">教師としてログイン中</span>
          </>
        )}
      </div>

      {/* 中央下: お題を決めるボタン (教員のみ) */}
      {isTeacher && (
        <div className="bottom-center-area">
          <Button onClick={handleSetTopic} className="topic-btn-teacher">
            お題を決める
          </Button>
        </div>
      )}

      {/* 最下部: 宝箱・称号ボタン */}
      <div className="bottom-bar">
        <div className="bottom-left-area">
          <Button onClick={handleOpenTreasure} className="home-btn">
            宝箱を見る
          </Button>
        </div>

        <div className="bottom-right-area">
          <Button onClick={handleOpenTitle} className="home-btn">
            称号を見る
          </Button>
        </div>
      </div>
    </div>
  );
}