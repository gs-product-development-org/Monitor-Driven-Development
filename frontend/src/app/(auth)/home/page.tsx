'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore, UserState } from '@/stores/useUserStore';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import './home.css';

export default function ZooHomePage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  // Zustandストアからユーザー情報と更新用アクションを取得
  const user = useUserStore((state: UserState) => state.user);
  const setUser = useUserStore((state: UserState) => state.setUser);
  const clearUser = useUserStore((state: UserState) => state.clearUser);

  // 上スクロールの目印表示フラグ（一度スクロールしたら非表示）
  const [showScrollHint, setShowScrollHint] = useState<boolean>(true);

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

  // 2. 初期表示時に背景画像の一番下（下半分）を表示
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

  // 3. スクロール検知（一度でも上にスクロールしたらインジケーターを非表示にする）
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
      {/* 2画面分の高さを確保する背景用ダミーコンテナ */}
      <div className="zoo-scroll-content" />

      {/* --- 全UI要素（すべて画面固定表示） --- */}
      {/* 画面中央上部: スクロール誘導インジケーター */}
      {showScrollHint && (
        <div className="scroll-hint-banner">
          ▲ 上にスクロールできます ▲
        </div>
      )}

      {/* 画面左上: ログアウトボタン */}
      <div className="top-left-area">
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