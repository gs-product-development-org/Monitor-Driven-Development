'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase'; // ご自身のSupabaseクライアントのパスに合わせて指定してください
import { GACHA_RESULT_ITEMS_KEY } from '../gacha/page';
import './placement.css';

// 5つのエリア定義
type ZooArea = {
  id: string;      // 'area-1', 'area-2' ...
  numericId: number; // DB関数(p_area_id)へ渡す数値ID
  name: string;
  image: string;
};

// ガチャで獲得したアイテムの型
type ItemToPlace = {
  obtained_item_id?: number;
  item_id?: number; // DB挿入用のアイテムID
  item_name?: string;
  item_image: string;
  rarity?: string;
  class_id?: number; // クラスIDが必要な場合
};

// 5つのエリア定義（領域画像と数値IDの紐付け）
const ZOO_AREAS: ZooArea[] = [
  { id: 'area-1', numericId: 1, name: '熱帯', image: '/images/areas/熱帯.png' },
  { id: 'area-2', numericId: 2, name: '氷', image: '/images/areas/氷.png' },
  { id: 'area-3', numericId: 3, name: '水辺', image: '/images/areas/水辺.png' },
  { id: 'area-4', numericId: 4, name: '砂漠', image: '/images/areas/砂漠.png' },
  { id: 'area-5', numericId: 5, name: '草原', image: '/images/areas/草原.png' },
];

// ガチャセッション未存在時のフォールバック用ダミーデータ
const FALLBACK_ITEMS: ItemToPlace[] = [
  { item_id: 1, item_name: 'ライオン', item_image: 'lion.png', class_id: 1 },
  { item_id: 2, item_name: 'ペンギン', item_image: 'penguin.png', class_id: 1 },
  { item_id: 3, item_name: 'ゾウ', item_image: 'elephant.png', class_id: 1 },
];

export default function PlaceAnimalPage() {
  const router = useRouter();

  // ガチャ画面で獲得したアイテム一覧の取得
  const [itemsToPlace, setItemsToPlace] = useState<ItemToPlace[]>([]);

  // 現在処理中のアイテムインデックス
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // 選択されたエリアID
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);

  // 送信中フラグ（重複押し防止）
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 初回ロード時にセッションからアイテムを取得
  useEffect(() => {
    const savedData = sessionStorage.getItem(GACHA_RESULT_ITEMS_KEY);
    if (savedData) {
      try {
        const parsedItems: ItemToPlace[] = JSON.parse(savedData);
        if (parsedItems.length > 0) {
          setItemsToPlace(parsedItems);
          return;
        }
      } catch (err) {
        console.error('セッションデータの読み込みエラー:', err);
      }
    }
    // セッションに無い場合はダミーを使用
    setItemsToPlace(FALLBACK_ITEMS);
  }, []);

  const totalItems = itemsToPlace.length;
  const currentItem = itemsToPlace[currentIndex];

  // エリア選択ハンドラ
  const handleSelectArea = (areaId: string) => {
    setSelectedAreaId((prev) => (prev === areaId ? null : areaId));
  };

  // OKボタン押下処理 (DBインサート呼び出し)
  const handleConfirm = async () => {
    if (!selectedAreaId || !currentItem || isSubmitting) return;

    // 選択されたエリアの数値IDを取得
    const selectedArea = ZOO_AREAS.find((area) => area.id === selectedAreaId);
    if (!selectedArea) return;

    // パラメータの設定
    const p_item_id = currentItem.item_id || currentItem.obtained_item_id || 1;
    const p_area_id = selectedArea.numericId;
    // クラスID（アイテムに紐づいているか、無ければデフォルト値を設定）
    const p_class_id = currentItem.class_id || 1;

    setIsSubmitting(true);

    try {
      // Postgres関数 'place_animal' をRPC経由で実行
      const { data, error } = await supabase.rpc('place_animal', {
        p_item_id: p_item_id,
        p_area_id: p_area_id,
        p_class_id: p_class_id,
      });

      if (error) {
        console.error('配置データの保存に失敗しました:', error);
        alert('配置の保存に失敗しました。もう一度お試しください。');
        setIsSubmitting(false);
        return;
      }

      console.log('配置成功:', data);

      if (currentIndex + 1 < totalItems) {
        // 次のアイテムの配置へ進む
        setCurrentIndex((prev) => prev + 1);
        setSelectedAreaId(null);
      } else {
        // すべてのアイテム配置が完了したら /home 画面へ遷移
        sessionStorage.removeItem(GACHA_RESULT_ITEMS_KEY);
        router.push('/home');
      }
    } catch (err) {
      console.error('通信エラー:', err);
      alert('エラーが発生しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentItem) return null;

  return (
    <div className="place-container">
      {/* 1. 画面一番上: 枠なしの黒文字タイトル */}
      <h1 className="place-title-plain">
        どこにこのアイテムを置くかみんなで決めよう！
      </h1>

      {/* 2. アイテム画像 ＋ 分数表示（枠なし・小さめ・縦並び） */}
      <div className="place-item-section">
        <img
          src={`/images/animals/${currentItem.item_image}`}
          alt={currentItem.item_name || '配置アイテム'}
          className="place-item-mini-img"
        />
        <span className="place-item-fraction">
          {currentIndex + 1} / {totalItems}
        </span>
      </div>

      {/* 3. 画面中央: 横に並んだ5つの正方形・黒縁エリア ＋ 下部にエリア名 */}
      <div className="place-areas-row">
        {ZOO_AREAS.map((area) => {
          const isSelected = selectedAreaId === area.id;
          return (
            <div key={area.id} className="square-area-item">
              <div
                onClick={() => handleSelectArea(area.id)}
                className={`square-area-box ${isSelected ? 'selected' : ''}`}
              >
                <img src={area.image} alt={area.name} className="square-area-img" />
              </div>
              <span className="square-area-label">{area.name}</span>
            </div>
          );
        })}
      </div>

      {/* 4. 画面下部中央: 大きなOKボタン */}
      <div className="place-footer-center">
        <Button
          onClick={handleConfirm}
          disabled={!selectedAreaId || isSubmitting}
          className="place-ok-button-large"
        >
          {isSubmitting ? '保存中...' : 'OK'}
        </Button>
      </div>
    </div>
  );
}