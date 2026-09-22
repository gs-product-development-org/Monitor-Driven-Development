'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore, UserState } from '@/stores/useUserStore';
import { Button } from '@/components/ui/Button';
import './home.css';

export default function ZooHomePage() {
  const router = useRouter();

  // Zustandストアからユーザー情報を取得
  const user = useUserStore((state: UserState) => state.user);
  const clearUser = useUserStore((state: UserState) => state.clearUser);

  // 教員かどうか判定 (デモ用に true 固定)
  const isTeacher = true;

  // ログアウト処理
  const handleLogout = () => {
    clearUser();
    router.push('/login');
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