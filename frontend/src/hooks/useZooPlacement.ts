'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const FOOT_RADIUS = 64; // 3200x3600px基準の足元重なり判定の半径

export interface SavePlacementParams {
  itemId: number;
  areaId: number;
  classId: number;
}

export function useSaveZooPlacement() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * ガチャ等で決定したアイテムとエリアを受け取り、ランダムな座標を決定してDBへ挿入する
   */
  const savePlacement = async ({ itemId, areaId, classId }: SavePlacementParams) => {
    setLoading(true);
    setError(null);

    try {
      // 1. 指定されたエリアの座標範囲 (min_x, max_x, min_y, max_y) を取得
      const { data: areaData, error: areaError } = await supabase
        .from('zoo_areas')
        .select('*')
        .eq('area_id', areaId)
        .single();

      if (areaError || !areaData) {
        throw new Error('指定されたエリア情報が見つかりません');
      }

      // 2. 既にそのクラス・エリアに配置されている動物の座標を取得（重なり軽減のため）
      const { data: existingPlacements } = await supabase
        .from('zoo_placements')
        .select('x_coord, y_coord')
        .eq('class_id', classId)
        .eq('area_id', areaId);

      // 3. エリア内でランダムな座標を決定（最大20回試行して足元が重なりにくい場所を探す）
      let bestX = Math.floor(Math.random() * (areaData.max_x - areaData.min_x + 1)) + areaData.min_x;
      let bestY = Math.floor(Math.random() * (areaData.max_y - areaData.min_y + 1)) + areaData.min_y;

      if (existingPlacements && existingPlacements.length > 0) {
        for (let attempt = 0; attempt < 20; attempt++) {
          const candX = Math.floor(Math.random() * (areaData.max_x - areaData.min_x + 1)) + areaData.min_x;
          const candY = Math.floor(Math.random() * (areaData.max_y - areaData.min_y + 1)) + areaData.min_y;

          const isOverlap = existingPlacements.some((p) => {
            const dx = p.x_coord - candX;
            const dy = p.y_coord - candY;
            return Math.sqrt(dx * dx + dy * dy) < FOOT_RADIUS;
          });

          if (!isOverlap) {
            bestX = candX;
            bestY = candY;
            break;
          }
        }
      }

      // 4. zoo_placements テーブルに挿入
      const { data: insertedData, error: insertError } = await supabase
        .from('zoo_placements')
        .insert({
          item_id: itemId,
          area_id: areaId,
          class_id: classId,
          x_coord: bestX,
          y_coord: bestY,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setLoading(false);
      return insertedData; // 挿入成功したレコードを返す

    } catch (err: any) {
      console.error('配置保存エラー:', err);
      setError(err.message || '配置データの保存に失敗しました');
      setLoading(false);
      return null;
    }
  };

  return { savePlacement, loading, error };
}