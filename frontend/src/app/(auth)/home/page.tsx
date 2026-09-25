'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore, UserState } from '@/stores/useUserStore';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import './home.css';

// 全体マップの基準サイズ (useZooPlacement.ts の FOOT_RADIUS 判定基準)
const MAP_WIDTH = 3200;
const MAP_HEIGHT = 3600;

// 配置する動物アイテムの型
type PlacedAnimal = {
  placement_id: number;
  x_coord: number;
  y_coord: number;
  item_name?: string;
  item_image?: string;
};

// zoo_areas テーブルの型
type ZooAreaDebug = {
  area_id: number;
  area_name?: string;
  min_x: number;
  max_x: number;
  min_y: number;
  max_y: number;
};

export default function ZooHomePage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  // Zustandストアからユーザー情報と更新用アクションを取得
  const user = useUserStore((state: UserState) => state.user);
  const setUser = useUserStore((state: UserState) => state.setUser);
  const clearUser = useUserStore((state: UserState) => state.clearUser);

  // 上スクロールの目印表示フラグ（一度スクロールしたら非表示）
  const [showScrollHint, setShowScrollHint] = useState<boolean>(true);

  // DBから取得した配置済み動物の一覧
  const [placedAnimals, setPlacedAnimals] = useState<PlacedAnimal[]>([]);

  // ★ デバッグ用: zoo_areas の領域データ
  const [debugAreas, setDebugAreas] = useState<ZooAreaDebug[]>([]);
  // デバッグ描画の表示/非表示フラグ（デフォルトでON）
  const [showDebugOverlay, setShowDebugOverlay] = useState<boolean>(true);

  // 1. ページリロード時に sessionStorage からユーザー情報を復元
  useEffect(() => {
    if (!user) {
      const savedUser = sessionStorage.getItem('user_info');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        router.push('/login');
      }
    }
  }, [user, setUser, router]);

  // 2. DBからクラスに応じた動物の配置情報を取得 (デバッグログ追加版)
  useEffect(() => {
    if (!user?.class_id) {
      console.warn('【デバッグ】user または class_id が存在しません:', user);
      return;
    }

    const fetchPlacements = async () => {
      console.log('【デバッグ】取得開始 - class_id:', user.class_id);

      try {
        // DB問い合わせ
        const { data, error } = await supabase
          .from('zoo_placements')
          .select(`
            placement_id,
            x_coord,
            y_coord,
            items (
              item_name,
              item_image
            )
          `)
          .eq('class_id', user.class_id);

        if (error) {
          console.error('【デバッグエラー】Supabase取得失敗:', error);
          return;
        }

        // ★ 1. DBから返ってきたそのままのデータを確認
        console.log('【デバッグ】DBからの生レスポンス (data):', data);

        if (data && data.length > 0) {
          const formatted: PlacedAnimal[] = data.map((item: any, index: number) => {
            // リレーション部分（items）が取れているか個別にチェック
            console.log(`【デバッグ】Item [${index}] の結合データ:`, item.items);

            return {
              placement_id: item.placement_id,
              x_coord: item.x_coord,
              y_coord: item.y_coord,
              // items が null の場合や、リレーション名が違う場合に備えて確認
              item_name: item.items?.item_name || '名称不明',
              item_image: item.items?.item_image || 'default.png',
            };
          });

          // ★ 2. Stateにセットする直前の配列データを確認
          console.log('【デバッグ】整形後の配置データ (formatted):', formatted);
          setPlacedAnimals(formatted);
        } else {
          console.warn('【デバッグ】該当する class_id の zoo_placements データが 0 件でした。');
        }
      } catch (err) {
        console.error('【デバッグ通信エラー】:', err);
      }
    };

    fetchPlacements();
  }, [user?.class_id]);

  // // ★ 3. デバッグ用: zoo_areas の全座標領域を取得
  // useEffect(() => {
  //   const fetchAreas = async () => {
  //     try {
  //       const { data, error } = await supabase
  //         .from('zoo_areas')
  //         .select('*');

  //       if (error) {
  //         console.error('zoo_areas の取得失敗:', error);
  //         return;
  //       }

  //       if (data) {
  //         console.log('【デバッグ】zoo_areas 座標一覧:', data);
  //         setDebugAreas(data);
  //       }
  //     } catch (err) {
  //       console.error('zoo_areas 通信エラー:', err);
  //     }
  //   };

  //   fetchAreas();
  // }, []);

  // 3. 初期表示時に背景画像の一番下（下半分）を表示
  useEffect(() => {

    const scrollToBottom = () => {
      if (containerRef.current) {
        // scrollHeight - clientHeight で一番下までスクロール
        containerRef.current.scrollTop =
          containerRef.current.scrollHeight - containerRef.current.clientHeight;
      }
    };

    // 初期描画直後と少し遅延させたタイミングの二段階で実行（確実に下半分を表示させるため）
    scrollToBottom();
    const timer = setTimeout(scrollToBottom, 100);

    return () => clearTimeout(timer);
  }, []);

  // 4. スクロール検知（一度でも上にスクロールしたらインジケーターを非表示にする）
  const handleScroll = () => {
    if (!containerRef.current || !showScrollHint) return;

    const container = containerRef.current;
    const isAtBottom =
      container.scrollTop + container.clientHeight >= container.scrollHeight - 30;

    // 初期位置（一番下）から上に動いたら消去
    if (!isAtBottom) {
      setShowScrollHint(false);
    }
  };

  // 教員かどうか判定
  const isTeacher = user?.role === 'teacher';

  // 生徒端末のリアルタイム監視
  useEffect(() => {
    if (!user || isTeacher) return;

    const classId = user.class_id;
    if (!classId) return;

    const channel = supabase
      .channel(`topic-watch-class-${classId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'topics',
          filter: `class_id=eq.${classId}`,
        },
        (payload) => {
          if (Number(payload.new.class_id) === Number(classId)) {
            router.push('/wait?mode=topic_cushion');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isTeacher, router]);

  // ログアウト処理
  const handleLogout = () => {
    try {
      clearUser();
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

  return (
    <div className="zoo-container" ref={containerRef} onScroll={handleScroll}>
      {/* 全体スクロールキャンバス領域 */}
      <div className="zoo-scroll-content">

        {/* ★ デバッグ表示: zoo_areas の設定範囲（赤枠 & ラベル） */}
        {/* {showDebugOverlay &&
          debugAreas.map((area) => {
            const left = (area.min_x / MAP_WIDTH) * 100;
            const top = (area.min_y / MAP_HEIGHT) * 100;
            const width = ((area.max_x - area.min_x) / MAP_WIDTH) * 100;
            const height = ((area.max_y - area.min_y) / MAP_HEIGHT) * 100;

            return (
              <div
                key={area.area_id}
                style={{
                  position: 'absolute',
                  left: `${left}%`,
                  top: `${top}%`,
                  width: `${width}%`,
                  height: `${height}%`,
                  border: '2px dashed red',
                  backgroundColor: 'rgba(255, 0, 0, 0.15)',
                  boxSizing: 'border-box',
                  pointerEvents: 'none',
                  zIndex: 20,
                  color: 'red',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  padding: '4px',
                }}
              >
                <div>Area ID: {area.area_id} ({area.area_name || '名前なし'})</div>
                <div>X: {area.min_x} ~ {area.max_x}</div>
                <div>Y: {area.min_y} ~ {area.max_y}</div>
              </div>
            );
          })} */}

        {/* 動物の一覧をプロット */}
        {placedAnimals.map((animal) => {
          const leftPercent = (animal.x_coord / MAP_WIDTH) * 100;
          const topPercent = (animal.y_coord / MAP_HEIGHT) * 100;

          return (
            <React.Fragment key={animal.placement_id}>
              {/* ★ デバッグ表示: 動物の正確な座標点 (青い点) */}
              {/* {showDebugOverlay && (
                <div
                  style={{
                    position: 'absolute',
                    left: `${leftPercent}%`,
                    top: `${topPercent}%`,
                    width: '8px',
                    height: '8px',
                    backgroundColor: 'blue',
                    borderRadius: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 30,
                    pointerEvents: 'none',
                  }}
                />
              )} */}

              {/* 動物画像 */}
              <div
                className="placed-animal-wrapper"
                style={{
                  position: 'absolute',
                  left: `${leftPercent}%`,
                  top: `${topPercent}%`,
                  transform: 'translate(-50%, -100%)', // 足元原点
                  zIndex: 10,
                }}
              >
                <img
                  src={`/images/animals/${animal.item_image}`}
                  alt={animal.item_name}
                  className="placed-animal-img"
                />
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* --- 全UI要素（画面固定） --- */}

      {/* ★ 左上に「エリア枠表示 ON/OFF」の切り替えボタンを追加 */}
      <div className="top-left-area" style={{ zIndex: 100 }}>
        <Button onClick={handleLogout} className="logout-btn">
          ログアウト
        </Button>

        {/* <button
          onClick={() => setShowDebugOverlay((prev) => !prev)}
          style={{
            marginTop: '8px',
            fontSize: '11px',
            padding: '4px 8px',
            background: '#333',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {showDebugOverlay ? 'エリア枠非表示' : 'エリア枠表示'}
        </button> */}

        {isTeacher && (
          <>
            <br />
            <span className="user-info">教師としてログイン中</span>
          </>
        )}
      </div>

      {/* 画面右上: バナー＆教員メニュー */}
      <div className="top-right-area">
        <div className="banner-wrapper">
          <img
            src="/images/contents/gacha-meter.png"
            alt="動物園バナー"
            className="common-banner-img"
          />
        </div>

        {isTeacher && (
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
        )}
      </div>

      {/* 画面中央下: お題を決めるボタン（教員のみ） */}
      {isTeacher && (
        <div className="bottom-center-area">
          <Button onClick={handleSetTopic} className="topic-btn-teacher">
            お題を決める
          </Button>
        </div>
      )}

      {/* 画面最下部: 宝箱・称号を見るボタン */}
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