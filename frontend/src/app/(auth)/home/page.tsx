'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore, UserState } from '@/stores/useUserStore';
import { Button } from '@/components/ui/Button';
import './home.css';

export default function ZooHomePage() {
  const router = useRouter();

  // Zustandストアから安全に値を取得
  const user = useUserStore((state: UserState) => state.user);
  const clearUser = useUserStore((state: UserState) => state.clearUser);

  // 教員かどうかを判定
  // const isTeacher = user?.role === 'teacher';
  const isTeacher = true; // 👈 ここを true に設定して、教員用のボタンを表示する

  // ログアウト処理
  const handleLogout = () => {
    clearUser();
    router.push('/login');
  };

  // 各ボタンのアクション
  const handleOpenTreasure = () => {
    console.log('宝箱を見る');
  };

  const handleOpenNgWord = () => {
    console.log('NGワード登録画面を開く');
  };

  const handleSetTopic = () => {
    console.log('お題を決める画面を開く');
  };

  const handleOpenTitle = () => {
    console.log('称号を見るモーダルを開く');
  };

  return (
    <div className="zoo-container">
      {/* 左上: ログアウトボタン */}
      <div className="top-left-area">
        <Button onClick={handleLogout} className="zoo-btn-sub">
          ログアウト
        </Button>
      </div>

      {/* 右上（教員のみ）: NGワード登録ボタン */}
      {isTeacher && (
        <div className="top-right-teacher-area">
          <Button onClick={handleOpenNgWord} className="zoo-btn-teacher">
            NGワード登録
          </Button>
        </div>
      )}

      {/* 下部エリア（左: 宝箱 / 中央: お題 / 右: 称号を見る） */}
      <div className="bottom-bar">
        {/* 左下: 宝箱を見るボタン */}
        <div className="bottom-left-area">
          <Button onClick={handleOpenTreasure} className="zoo-btn-main">
            宝箱を見る
          </Button>
        </div>

        {/* 画面下の真ん中（教員のみ）: お題を決めるボタン */}
        {isTeacher && (
          <div className="bottom-center-area">
            <Button onClick={handleSetTopic} className="zoo-btn-teacher">
              お題を決める
            </Button>
          </div>
        )}

        {/* 右下: 称号を見るボタン */}
        <div className="bottom-right-area">
          <Button onClick={handleOpenTitle} className="zoo-btn-main">
            称号を見る
          </Button>
        </div>
      </div>
    </div>
  );
}