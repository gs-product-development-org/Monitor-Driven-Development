'use client';

import React, {
  useState,
  useEffect,
} from 'react';

import { Button } from '@/components/ui/Button';
import { useSaveZooPlacement } from '@/hooks/useZooPlacement';
import { useSync } from '@/components/realtime/SyncContainer';

import './placement.css';

// =============================================================
// 型定義
// =============================================================

type ZooArea = {
  id: string;
  numericId: number;
  name: string;
  image: string;
};

type ItemToPlace = {
  obtained_item_id?: number;
  item_id?: number;
  item_name?: string;
  item_image: string;
  rarity?: string;
  class_id?: number;
};

// =============================================================
// エリア定義
// =============================================================

const ZOO_AREAS: ZooArea[] = [
  {
    id: 'area-1',
    numericId: 1,
    name: '氷',
    image: '/images/areas/氷.png',
  },
  {
    id: 'area-2',
    numericId: 2,
    name: '砂漠',
    image: '/images/areas/砂漠.png',
  },
  {
    id: 'area-3',
    numericId: 3,
    name: '熱帯',
    image: '/images/areas/熱帯.png',
  },
  {
    id: 'area-4',
    numericId: 4,
    name: '草原',
    image: '/images/areas/草原.png',
  },
  {
    id: 'area-5',
    numericId: 5,
    name: '水辺',
    image: '/images/areas/水辺.png',
  },
];

// =============================================================
// メインコンポーネント
// =============================================================

export default function PlaceAnimalPage() {
  const {
    classId,
    isTeacher,
    isLoading: isSyncLoading,

    channelReady,

    placementItems,

    placementCurrentIndex,

    placementSelectedAreaId,

    requestPlacementItems,

    selectPlacementArea,

    nextPlacement,

    completePlacement,
  } = useSync();

  const {
    savePlacement,
    loading: isSaving,
  } = useSaveZooPlacement();

  // ===========================================================
  // State
  // ===========================================================

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState<boolean>(false);

  // ===========================================================
  // 生徒：ガチャ結果を先生に要求
  // ===========================================================

  useEffect(() => {
    if (isSyncLoading) {
      return;
    }

    // ---------------------------------------------------------
    // 先生は要求しない
    // ---------------------------------------------------------

    if (isTeacher) {
      return;
    }

    // ---------------------------------------------------------
    // Realtime接続前なら何もしない
    // ---------------------------------------------------------

    if (!channelReady) {
      return;
    }

    // ---------------------------------------------------------
    // すでに取得済みなら要求しない
    // ---------------------------------------------------------

    if (
      placementItems.length > 0
    ) {
      return;
    }

    console.log(
      '生徒：ガチャ結果を先生に要求します'
    );

    requestPlacementItems();
  }, [
    isSyncLoading,
    isTeacher,
    channelReady,
    placementItems.length,
    requestPlacementItems,
  ]);

  // ===========================================================
  // class_id
  // ===========================================================

  const resolvedClassId =
    classId
      ? Number(classId)
      : null;

  // ===========================================================
  // 現在のアイテム
  // ===========================================================

  const itemsToPlace =
    placementItems as ItemToPlace[];

  const totalItems =
    itemsToPlace.length;

  const currentItem =
    itemsToPlace[
      placementCurrentIndex
    ];

  // ===========================================================
  // エリア選択
  // ===========================================================

  const handleSelectArea = async (
    areaId: string
  ) => {
    // ---------------------------------------------------------
    // 生徒は操作できない
    // ---------------------------------------------------------

    if (!isTeacher) {
      return;
    }

    // ---------------------------------------------------------
    // 同じエリアを押したら解除
    // ---------------------------------------------------------

    const nextSelectedAreaId =
      placementSelectedAreaId ===
      areaId
        ? null
        : areaId;

    // ---------------------------------------------------------
    // SyncContainer側で
    // state更新 + Broadcast
    // ---------------------------------------------------------

    await selectPlacementArea(
      nextSelectedAreaId
    );
  };

  // ===========================================================
  // OKボタン
  // ===========================================================

  const handleConfirm =
    async () => {
      // -------------------------------------------------------
      // 基本チェック
      // -------------------------------------------------------

      if (
        !isTeacher ||
        !placementSelectedAreaId ||
        !currentItem ||
        isSubmitting ||
        isSaving
      ) {
        return;
      }

      // -------------------------------------------------------
      // エリア取得
      // -------------------------------------------------------

      const selectedArea =
        ZOO_AREAS.find(
          (area) =>
            area.id ===
            placementSelectedAreaId
        );

      if (!selectedArea) {
        return;
      }

      // -------------------------------------------------------
      // item_id取得
      // -------------------------------------------------------

      const itemId =
        currentItem.item_id ??
        currentItem.obtained_item_id;

      if (!itemId) {
        console.error(
          'item_idを取得できません:',
          currentItem
        );

        alert(
          '配置するアイテムのitem_idを取得できません。'
        );

        return;
      }

      // -------------------------------------------------------
      // class_id確認
      // -------------------------------------------------------

      if (
        !resolvedClassId ||
        Number.isNaN(
          resolvedClassId
        )
      ) {
        console.error(
          'class_idを取得できません'
        );

        alert(
          'class_idを取得できません。'
        );

        return;
      }

      // -------------------------------------------------------
      // 保存ログ
      // -------------------------------------------------------

      console.log(
        '配置保存パラメータ:',
        {
          item_id: itemId,
          area_id:
            selectedArea.numericId,
          class_id:
            resolvedClassId,
          currentItem,
          currentIndex:
            placementCurrentIndex,
          selectedAreaId:
            placementSelectedAreaId,
        }
      );

      setIsSubmitting(
        true
      );

      try {
        // =====================================================
        // DB保存
        // =====================================================

        const data =
          await savePlacement({
            itemId,
            areaId:
              selectedArea.numericId,
            classId:
              resolvedClassId,
          });

        if (!data) {
          console.error(
            '配置データの保存に失敗しました'
          );

          alert(
            '配置の保存に失敗しました。もう一度お試しください。'
          );

          return;
        }

        console.log(
          '配置成功:',
          data
        );

        // =====================================================
        // 次のアイテムがある場合
        // =====================================================

        if (
          placementCurrentIndex + 1 <
          totalItems
        ) {
          const nextIndex =
            placementCurrentIndex +
            1;

          // ---------------------------------------------------
          // SyncContainerで
          // 自分のstate更新 + 全員へBroadcast
          // ---------------------------------------------------

          await nextPlacement(
            nextIndex
          );

          return;
        }

        // =====================================================
        // 全配置完了
        // =====================================================

        await completePlacement();
      } catch (error) {
        console.error(
          '通信エラー:',
          error
        );

        alert(
          'エラーが発生しました。'
        );
      } finally {
        setIsSubmitting(
          false
        );
      }
    };

  // ===========================================================
  // ガチャ結果取得中
  // ===========================================================

  if (
    isSyncLoading ||
    !channelReady
  ) {
    return (
      <div className="place-container">
        <p>
          配置画面を準備しています...
        </p>
      </div>
    );
  }

  // ===========================================================
  // 生徒側：ガチャ結果待ち
  // ===========================================================

  if (
    !isTeacher &&
    placementItems.length === 0
  ) {
    return (
      <div className="place-container">
        <p>
          先生から配置する動物を取得しています...
        </p>
      </div>
    );
  }

  // ===========================================================
  // アイテムが存在しない
  // ===========================================================

  if (!currentItem) {
    return (
      <div className="place-container">
        <p>
          配置するアイテムがありません。
        </p>
      </div>
    );
  }

  // ===========================================================
  // Render
  // ===========================================================

  return (
    <div className="place-container">

      {/* =====================================================
          タイトル
      ===================================================== */}

      <h1 className="place-title-plain">
        どこにこのアイテムを置くかみんなで決めよう！
      </h1>

      {/* =====================================================
          アイテム画像
      ===================================================== */}

      <div className="place-item-section">
        <img
          src={`/images/animals/${currentItem.item_image}`}
          alt={
            currentItem.item_name ||
            '配置アイテム'
          }
          className="place-item-mini-img"
        />

        <span className="place-item-fraction">
          {placementCurrentIndex + 1}
          {' / '}
          {totalItems}
        </span>
      </div>

      {/* =====================================================
          エリア
      ===================================================== */}

      <div className="place-areas-row">
        {ZOO_AREAS.map(
          (area) => {
            const isSelected =
              placementSelectedAreaId ===
              area.id;

            return (
              <div
                key={area.id}
                className="square-area-item"
              >
                <div
                  onClick={() =>
                    handleSelectArea(
                      area.id
                    )
                  }
                  className={`square-area-box ${
                    isSelected
                      ? 'selected'
                      : ''
                  } ${
                    !isTeacher
                      ? 'readonly'
                      : ''
                  }`}
                >
                  <img
                    src={area.image}
                    alt={area.name}
                    className="square-area-img"
                  />
                </div>

                <span className="square-area-label">
                  {area.name}
                </span>
              </div>
            );
          }
        )}
      </div>

      {/* =====================================================
          OKボタン
      ===================================================== */}

      <div className="place-footer-center">
        {isTeacher ? (
          <Button
            onClick={
              handleConfirm
            }
            disabled={
              !placementSelectedAreaId ||
              isSubmitting ||
              isSaving
            }
            className="place-ok-button-large"
          >
            {isSubmitting
              ? '保存中...'
              : 'OK'}
          </Button>
        ) : (
          <p>
            先生が配置場所を決めています...
          </p>
        )}
      </div>
    </div>
  );
}

