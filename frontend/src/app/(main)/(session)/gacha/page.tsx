'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import './gacha.css';

// アニメーションのフェーズ定義
type GachaStage = 'idle' | 'pulling' | 'hatching' | 'result';

// ガチャで獲得できる動物データの型
type AnimalResult = {
  id: string;
  name: string;
  image: string;
};

// ダミー結果データ（3回分）
const MOCK_RESULTS: AnimalResult[] = [
  { id: '1', name: 'ライオン', image: '/images/animals/lion.png' },
  { id: '2', name: 'ペンギン', image: '/images/animals/penguin.png' },
  { id: '3', name: 'ゾウ', image: '/images/animals/elephant.png' },
];

export default function GachaPage() {
  const router = useRouter();

  // ガチャの最大回数（例: 3回）と残り回数 State
  const maxGachaCount = 3;
  const [remainingCount, setRemainingCount] = useState<number>(3);

  // 現在のアニメーションフェーズ
  const [stage, setStage] = useState<GachaStage>('idle');

  // 今回当たった動物
  const [currentAnimal, setCurrentAnimal] = useState<AnimalResult | null>(null);

  // ガチャを引くアニメーション処理 (GIFつなぎ合わせロジック)
  const handlePlayGacha = () => {
    if (remainingCount <= 0 || stage !== 'idle') return;

    // 1. レバーを引くアニメーション開始 (GIF 1)
    setStage('pulling');

    // 2. 2.0秒後に「卵が割れるアニメーション (GIF 2)」へ切り替え
    setTimeout(() => {
      setStage('hatching');

      // 3. さらに 2.5秒後に結果画面（動物登場）を表示
      setTimeout(() => {
        // 残り回数に応じた獲得動物をセット
        const resultIndex = maxGachaCount - remainingCount;
        setCurrentAnimal(MOCK_RESULTS[resultIndex] || MOCK_RESULTS[0]);
        
        // 残り回数を1減らす
        setRemainingCount((prev) => prev - 1);
        setStage('result');
      }, 2500); // 卵が割れるGIFの再生時間
    }, 2000); // ガチャマシン動作GIFの再生時間
  };

  // 配置場所選択画面へ進む（あるいは次のガチャを引く準備）
  const handleNextStep = () => {
    if (!currentAnimal) return;

    console.log('配置選択へ進む動物:', currentAnimal);
    // 配置画面へ移動（獲得した動物ID等をパラメータで渡す想定）
    router.push(`/teacher/place-animal?animalId=${currentAnimal.id}`);
  };

  return (
    <div className="gacha-container">
      {/* 画面右上: 残りガチャ回数の卵ゲージ */}
      <div className="gacha-gauge-container">
        <div className="gauge-frame">
          <span className="gauge-label">ガチャ回数</span>
          <div className="gauge-eggs-row">
            {Array.from({ length: maxGachaCount }).map((_, index) => {
              // 残り回数分だけ色付き（active）、消費済みはグレー（inactive）
              const isActive = index < remainingCount;
              return (
                <div
                  key={index}
                  className={`gauge-egg-icon ${isActive ? 'active' : 'inactive'}`}
                >
                  <img
                    src={
                      isActive
                        ? '/images/gacha/egg-active.png' // 色付き卵イラスト
                        : '/images/gacha/egg-gray.png'   // グレーの卵イラスト
                    }
                    alt={isActive ? '残りガチャ' : '消費済み'}
                    className="gauge-egg-img"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 画面中央: GIF演出＆結果表示エリア */}
      <div className="gacha-stage-wrapper">
        {/* Stage 1: 待機状態 (ガチャマシンが浮遊/揺れているGIFまたは静止画) */}
        {stage === 'idle' && (
          <div className="gacha-view">
            <img
              src="/images/gacha/gacha-idle.gif"
              alt="ガチャマシン待機"
              className="gacha-gif"
            />
            <Button
              onClick={handlePlayGacha}
              disabled={remainingCount <= 0}
              className="gacha-start-button"
            >
              ガチャを回す！
            </Button>
          </div>
        )}

        {/* Stage 2: ガチャを引いている演出 (GIF 1) */}
        {stage === 'pulling' && (
          <div className="gacha-view">
            <img
              src="/images/gacha/gacha-pulling.gif"
              alt="ガチャ回し中..."
              className="gacha-gif"
            />
            <p className="gacha-status-text">なにが出るかな...？</p>
          </div>
        )}

        {/* Stage 3: 卵が割れる演出 (GIF 2) */}
        {stage === 'hatching' && (
          <div className="gacha-view">
            <img
              src="/images/gacha/egg-hatching.gif"
              alt="卵が割れる！"
              className="gacha-gif"
            />
            <p className="gacha-status-text">パカッ...！</p>
          </div>
        )}

        {/* Stage 4: 結果表示（動物登場） */}
        {stage === 'result' && currentAnimal && (
          <div className="gacha-result-card">
            <span className="result-badge">NEW ANIMAL!</span>
            <h2 className="result-animal-name">{currentAnimal.name} をGET!</h2>
            <div className="result-animal-image-box">
              <img
                src={currentAnimal.image}
                alt={currentAnimal.name}
                className="result-animal-img"
              />
            </div>
            <Button onClick={handleNextStep} className="gacha-next-button">
              配置場所をきめる ➔
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}