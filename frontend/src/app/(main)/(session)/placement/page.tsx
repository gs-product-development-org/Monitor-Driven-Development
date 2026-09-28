'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useSaveZooPlacement } from '@/hooks/useZooPlacement';
import { useSync } from '@/components/realtime/SyncContainer';
import { GACHA_RESULT_ITEMS_KEY } from '../gacha/page';
import './placement.css';

// ==============================
// 型定義
// ==============================

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

type PendingPlacement = {
  itemId: number;
  areaId: number;
  classId: number;
};

// ==============================
// Broadcast用イベント型
// ==============================

type PlacementInitPayload = {
  items: ItemToPlace[];
};

type PlacementSelectPayload = {
  currentIndex: number;
  selectedAreaId: string | null;
};

type PlacementNextPayload = {
  currentIndex: number;
};

type PlacementCompletePayload = {
  completed: true;
};

// ==============================
// エリア定義
// ==============================

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

// ==============================
// フォールバック
// ==============================

const FALLBACK_ITEMS: ItemToPlace[] = [
  {
    item_id: 1,
    item_name: 'ライオン',
    item_image: 'lion.png',
    class_id: 1,
  },
  {
    item_id: 2,
    item_name: 'ペンギン',
    item_image: 'penguin.png',
    class_id: 1,
  },
  {
    item_id: 3,
    item_name: 'ゾウ',
    item_image: 'elephant.png',
    class_id: 1,
  },
];

// ==============================
// メインコンポーネント
// ==============================

export default function PlaceAnimalPage() {
  const router = useRouter();

  const {
    classId,
    isTeacher,
    isLoading: isSyncLoading,
  } = useSync();

  const { savePlacement, loading: isSaving } = useSaveZooPlacement();

  // ==============================
  // State
  // ==============================

  const [itemsToPlace, setItemsToPlace] = useState<ItemToPlace[]>([]);

  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Broadcast channel
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(
    null
  );

  // 初期化済み判定
  const initializedRef = useRef(false);

  // ==============================
  // classId取得
  // ==============================

  const resolvedClassId = (): number | null => {
    if (classId) {
      const parsed = Number(classId);

      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }

    try {
      const raw = sessionStorage.getItem('user_info');

      if (!raw) {
        return null;
      }

      const userInfo = JSON.parse(raw);

      const parsed = Number(userInfo.class_id);

      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    } catch (error) {
      console.error('user_infoの読み込みに失敗:', error);
    }

    return null;
  };

  // ==============================
  // Broadcast送信
  // ==============================

  const broadcastEvent = async (
    event: string,
    payload: unknown
  ) => {
    const channel = channelRef.current;

    if (!channel) {
      console.warn('Broadcast channelが存在しません');
      return;
    }

    try {
      await channel.send({
        type: 'broadcast',
        event,
        payload,
      });
    } catch (error) {
      console.error(
        `Broadcast送信エラー: ${event}`,
        error
      );
    }
  };

  // ==============================
  // Broadcast購読
  // ==============================

  useEffect(() => {
    if (isSyncLoading) {
      return;
    }

    const resolvedId = resolvedClassId();

    if (!resolvedId) {
      console.error('classIdを取得できません');
      return;
    }

    const channelName = `classroom_placement_${resolvedId}`;

    console.log(
      'placement Broadcast channel作成:',
      channelName
    );

    const channel = supabase.channel(channelName);

    channelRef.current = channel;

    // ------------------------------
    // 配置セッション初期化
    // ------------------------------

    channel.on(
      'broadcast',
      { event: 'PLACEMENT_INIT' },
      ({ payload }) => {
        console.log(
          'PLACEMENT_INIT受信:',
          payload
        );

        const data =
          payload as PlacementInitPayload;

        if (
          !data.items ||
          !Array.isArray(data.items) ||
          data.items.length === 0
        ) {
          return;
        }

        setItemsToPlace(data.items);
        setCurrentIndex(0);
        setSelectedAreaId(null);
      }
    );

    // ------------------------------
    // エリア選択同期
    // ------------------------------

    channel.on(
      'broadcast',
      { event: 'PLACEMENT_SELECT' },
      ({ payload }) => {
        console.log(
          'PLACEMENT_SELECT受信:',
          payload
        );

        const data =
          payload as PlacementSelectPayload;

        setCurrentIndex(data.currentIndex);
        setSelectedAreaId(
          data.selectedAreaId
        );
      }
    );

    // ------------------------------
    // 次の動物へ
    // ------------------------------

    channel.on(
      'broadcast',
      { event: 'PLACEMENT_NEXT' },
      ({ payload }) => {
        console.log(
          'PLACEMENT_NEXT受信:',
          payload
        );

        const data =
          payload as PlacementNextPayload;

        setCurrentIndex(data.currentIndex);
        setSelectedAreaId(null);
      }
    );

    // ------------------------------
    // 全配置完了
    // ------------------------------

    channel.on(
      'broadcast',
      { event: 'PLACEMENT_COMPLETE' },
      ({ payload }) => {
        console.log(
          'PLACEMENT_COMPLETE受信:',
          payload
        );

        const data =
          payload as PlacementCompletePayload;

        if (!data.completed) {
          return;
        }

        sessionStorage.removeItem(
          GACHA_RESULT_ITEMS_KEY
        );

        router.push('/home');
      }
    );

    // ------------------------------
    // Subscribe
    // ------------------------------

    channel.subscribe((status) => {
      console.log(
        'placement Broadcast status:',
        status
      );
    });

    return () => {
      console.log(
        'placement Broadcast channel解除'
      );

      channelRef.current = null;

      supabase.removeChannel(channel);
    };
  }, [
    isSyncLoading,
    classId,
    router,
  ]);

  // ==============================
  // ガチャ結果読み込み
  // ==============================

  useEffect(() => {
    if (isSyncLoading) {
      return;
    }

    if (initializedRef.current) {
      return;
    }

    const loadItems = () => {
      const savedData =
        sessionStorage.getItem(
          GACHA_RESULT_ITEMS_KEY
        );

      if (savedData) {
        try {
          const parsedItems: ItemToPlace[] =
            JSON.parse(savedData);

          if (
            Array.isArray(parsedItems) &&
            parsedItems.length > 0
          ) {
            console.log(
              'ガチャ結果を読み込み:',
              parsedItems
            );

            setItemsToPlace(parsedItems);

            initializedRef.current = true;

            return parsedItems;
          }
        } catch (error) {
          console.error(
            'セッションデータの読み込みエラー:',
            error
          );
        }
      }

      // セッションにない場合はフォールバック
      console.warn(
        'ガチャ結果が存在しないため、フォールバックデータを使用します'
      );

      setItemsToPlace(FALLBACK_ITEMS);

      initializedRef.current = true;

      return FALLBACK_ITEMS;
    };

    const items = loadItems();

    // ==============================
    // 先生だけ初期データをBroadcast
    // ==============================

    if (isTeacher && items.length > 0) {
      const timer = setTimeout(() => {
        broadcastEvent(
          'PLACEMENT_INIT',
          {
            items,
          }
        );
      }, 500);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [
    isSyncLoading,
    isTeacher,
  ]);

  // ==============================
  // 現在のアイテム
  // ==============================

  const totalItems = itemsToPlace.length;

  const currentItem =
    itemsToPlace[currentIndex];

  // ==============================
  // エリア選択
  // ==============================

  const handleSelectArea = (
    areaId: string
  ) => {
    // 生徒は操作しない
    if (!isTeacher) {
      return;
    }

    const nextSelectedAreaId =
      selectedAreaId === areaId
        ? null
        : areaId;

    setSelectedAreaId(
      nextSelectedAreaId
    );

    // 全員に選択状態を同期
    broadcastEvent(
      'PLACEMENT_SELECT',
      {
        currentIndex,
        selectedAreaId:
          nextSelectedAreaId,
      }
    );
  };

  // ==============================
  // OKボタン
  // ==============================

  const handleConfirm = async () => {
    if (
      !isTeacher ||
      !selectedAreaId ||
      !currentItem ||
      isSubmitting ||
      isSaving
    ) {
      return;
    }

    // ------------------------------
    // エリア取得
    // ------------------------------

    const selectedArea =
      ZOO_AREAS.find(
        (area) =>
          area.id === selectedAreaId
      );

    if (!selectedArea) {
      return;
    }

    // ------------------------------
    // パラメータ
    // ------------------------------

    const p_item_id =
      currentItem.item_id ||
      currentItem.obtained_item_id ||
      1;

    const p_area_id =
      selectedArea.numericId;

    const p_class_id =
      currentItem.class_id ||
      resolvedClassId() ||
      1;

    setIsSubmitting(true);

    try {
      // ------------------------------
      // DB保存
      // ------------------------------

      const data =
        await savePlacement({
          itemId: p_item_id,
          areaId: p_area_id,
          classId: p_class_id,
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

      // ------------------------------
      // 次のアイテムがある
      // ------------------------------

      if (
        currentIndex + 1 <
        totalItems
      ) {
        const nextIndex =
          currentIndex + 1;

        setCurrentIndex(nextIndex);
        setSelectedAreaId(null);

        // 全員を次の動物へ
        await broadcastEvent(
          'PLACEMENT_NEXT',
          {
            currentIndex:
              nextIndex,
          }
        );

        return;
      }

      // ------------------------------
      // 全アイテム配置完了
      // ------------------------------

      sessionStorage.removeItem(
        GACHA_RESULT_ITEMS_KEY
      );

      await broadcastEvent(
        'PLACEMENT_COMPLETE',
        {
          completed: true,
        }
      );

      // 自分自身もhomeへ
      router.push('/home');
    } catch (error) {
      console.error(
        '通信エラー:',
        error
      );

      alert(
        'エラーが発生しました。'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==============================
  // アイテムがまだない場合
  // ==============================

  if (!currentItem) {
    return (
      <div className="place-container">
        <p>
          配置するアイテムを読み込んでいます...
        </p>
      </div>
    );
  }

  // ==============================
  // Render
  // ==============================

  return (
    <div className="place-container">

      {/* タイトル */}
      <h1 className="place-title-plain">
        どこにこのアイテムを置くかみんなで決めよう！
      </h1>

      {/* アイテム画像 */}
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
          {currentIndex + 1} / {totalItems}
        </span>
      </div>

      {/* エリア */}
      <div className="place-areas-row">
        {ZOO_AREAS.map((area) => {
          const isSelected =
            selectedAreaId === area.id;

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
        })}
      </div>

      {/* OKボタン */}
      <div className="place-footer-center">
        {isTeacher ? (
          <Button
            onClick={handleConfirm}
            disabled={
              !selectedAreaId ||
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
