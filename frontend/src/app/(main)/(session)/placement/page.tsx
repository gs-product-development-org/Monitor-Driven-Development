'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import './placement.css';

// 5つのエリア定義
type ZooArea = {
  id: string;
  name: string;
  image: string;
};

// ガチャで獲得したアイテムの型
type ItemToPlace = {
  id: string;
  name: string;
  image: string;
};

// 5つのエリア（ダミーデータ）
const ZOO_AREAS: ZooArea[] = [
  { id: 'area-1', name: 'サバンナゾーン', image: '/images/areas/savanna.png' },
  { id: 'area-2', name: 'ジャングルゾーン', image: '/images/areas/jungle.png' },
  { id: 'area-3', name: 'アクアゾーン', image: '/images/areas/aqua.png' },
  { id: 'area-4', name: 'フォレストゾーン', image: '/images/areas/forest.png' },
  { id: 'area-5', name: 'ふれあい広場', image: '/images/areas/plaza.png' },
];

// 今回配置する獲得アイテム（例: 3つ）
const MOCK_ITEMS: ItemToPlace[] = [
  { id: 'item-1', name: 'ライオン', image: '/images/animals/lion.png' },
  { id: 'item-2', name: 'ペンギン', image: '/images/animals/penguin.png' },
  { id: 'item-3', name: 'ゾウ', image: '/images/animals/elephant.png' },
];

export default function PlaceAnimalPage() {
  const router = useRouter();

  // 現在処理中のアイテムインデックス
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // 選択されたエリアID
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);

  // 教師権限フラグ（操作可能かどうか）
  const [isTeacher] = useState<boolean>(true);

  const totalItems = MOCK_ITEMS.length;
  const currentItem = MOCK_ITEMS[currentIndex];

  // エリア選択ハンドラ
  const handleSelectArea = (areaId: string) => {
    if (!isTeacher) return;
    // 同じエリアを再クリックで選択解除、または別のエリアへ変更
    setSelectedAreaId((prev) => (prev === areaId ? null : areaId));
  };

  // OKボタン押下処理
  const handleConfirm = () => {
    if (!selectedAreaId || !currentItem) return;

    console.log(`アイテム [${currentItem.name}] をエリア [${selectedAreaId}] に配置決定`);

    if (currentIndex + 1 < totalItems) {
      // 次のアイテムの配置へ進む
      setCurrentIndex((prev) => prev + 1);
      setSelectedAreaId(null); // エリア選択をリセット
    } else {
      // すべてのアイテム配置が完了したら動物園画面へ移動
      router.push('/zoo');
    }
  };

  return (
    <div className="place-container">
      {/* 1. 画面一番上: タイトルメッセージ */}
      <div className="place-header">
        <h1 className="place-title">どこにこのアイテムを置くかみんなで決めよう！</h1>
      </div>

      {/* 2. アイテム表示 ＋ 何番目かの分数表示 (1/3) */}
      <div className="place-item-card">
        <div className="item-image-wrapper">
          <img
            src={currentItem.image}
            alt={currentItem.name}
            className="item-img"
          />
        </div>
        <div className="item-info">
          <span className="item-name">{currentItem.name}</span>
          <span className="item-counter">
            {currentIndex + 1} / {totalItems}
          </span>
        </div>
      </div>

      {/* 3. 画面中央: 5つのエリアの切り抜きマス目 */}
      <div className="place-areas-grid">
        {ZOO_AREAS.map((area) => {
          const isSelected = selectedAreaId === area.id;
          return (
            <div
              key={area.id}
              onClick={() => handleSelectArea(area.id)}
              className={`area-cell ${isSelected ? 'selected' : ''} ${!isTeacher ? 'disabled' : ''}`}
            >
              <div className="area-image-box">
                <img src={area.image} alt={area.name} className="area-img" />
              </div>
              <span className="area-label">{area.name}</span>
            </div>
          );
        })}
      </div>

      {/* 4. 画面下部: OKボタン（教師のみ操作可） */}
      {isTeacher && (
        <div className="place-footer-action">
          <Button
            onClick={handleConfirm}
            disabled={!selectedAreaId}
            className="place-ok-button"
          >
            OK
          </Button>
        </div>
      )}
    </div>
  );
}