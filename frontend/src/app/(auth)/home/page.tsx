'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore, UserState } from '@/stores/useUserStore';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import './home.css';

export default function ZooHomePage() {
  const router = useRouter();

  // Zustandストアからユーザー情報と更新用アクションを取得
  const user = useUserStore((state: UserState) => state.user);
  const setUser = useUserStore((state: UserState) => state.setUser);
  const clearUser = useUserStore((state: UserState) => state.clearUser);

  // 1. ページリロード時に sessionStorage からユーザー情報を復元
  useEffect(() => {
    if (!user) {
      const savedUser = sessionStorage.getItem('user_info');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        // ログイン情報がない場合はログイン画面へリダイレクト
        router.push('/login');
      }
    }
  }, [user, setUser, router]);

  // ★ 教員かどうか判定
  const isTeacher = user?.role === 'teacher';

  // 2. 生徒端末のみ: 先生側で新しいお題（topics）が追加されたかをリアルタイム監視
  useEffect(() => {
    // ユーザー情報がない、または教員の場合は生徒用リアルタイム監視を行わない
    if (!user || isTeacher) return;

    // 所属クラスIDを取得
    const classId = user.class_id;
    if (!classId) return;

    // Supabase Realtime チャンネルの設定
    const channel = supabase
      .channel(`topic-watch-class-${classId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'topics',                     // DBのお題テーブル
          filter: `class_id=eq.${classId}`,    // 自クラスのINSERTのみフィルタリング
        },
        (payload) => {
          // 万が一のための二重チェック（型を揃えて比較）
          if (Number(payload.new.class_id) === Number(classId)) {
            console.log('自クラスのお題追加を検知しました:', payload.new);
            
            // 生徒側画面を自動的に /wait?mode=topic_cushion に遷移させる
            router.push('/wait?mode=topic_cushion');
          }
        }
      )
      
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`生徒: クラスID ${classId} のお題追加監視を開始しました`);
        }
      });

    // コンポーネント破棄時にリアルタイムリスナーを解約
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isTeacher, router]);

  // ログアウト処理
  const handleLogout = () => {
    try {
      // 1. Zustandのユーザー状態をクリア
      clearUser();

      // 2. セッションストレージのユーザー情報を削除
      sessionStorage.removeItem('user_info');
    } catch (error) {
      console.error('ログアウト処理エラー:', error);
    } finally {
      // 3. ログイン画面へ遷移
      router.push('/login');
    }
  };

  // 各ボタンの遷移アクション
  const handleOpenTreasure = () => {
    router.push('/history');
  };

  const handleOpenTitle = () => {
    router.push('/title');
  };

  const handleOpenNgWord = () => {
    router.push('/validation');
  };

  const handleSetTopic = () => {
    router.push('/topic-setting');
  };

  const handleOpenRaisingHandsRate = () => {
    router.push('/summary');
  };

  return (
    <div className="zoo-container">
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

      {/* 画面右上エリア */}
      <div className="top-right-area">
        {/* 教師・児童共通: 横長画像 */}
        <div className="banner-wrapper">
          <img
            src="/images/contents/gacha-meter.png"
            alt="動物園バナー"
            className="common-banner-img"
          />
        </div>

        {/* 教師のみ表示されるアイテム群 */}
        {isTeacher && (
          <div className="teacher-actions-column">
            {/* セット1: NGワード登録 */}
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

            {/* セット2: 挙手率を見る */}
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

      {/* 画面下の真ん中（教員のみ）: お題を決めるボタン */}
      {isTeacher && (
        <div className="bottom-center-area">
          <Button onClick={handleSetTopic} className="topic-btn-teacher">
            お題を決める
          </Button>
        </div>
      )}

      {/* 下部エリア（左: 宝箱を見る / 右: 称号を見る） */}
      <div className="bottom-bar">
        {/* 左下: 宝箱を見るボタン */}
        <div className="bottom-left-area">
          <Button onClick={handleOpenTreasure} className="home-btn">
            宝箱を見る
          </Button>
        </div>

        {/* 右下: 称号を見るボタン */}
        <div className="bottom-right-area">
          <Button onClick={handleOpenTitle} className="home-btn">
            称号を見る
          </Button>
        </div>
      </div>
    </div>
  );
}