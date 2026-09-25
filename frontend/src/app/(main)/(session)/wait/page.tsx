'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useSync } from '@/components/realtime/SyncContainer';
import './wait.css';

type WaitMode = 'answer_submitted' | 'topic_cushion' | 'reaction_completed';

// 動物画像の格納フォルダパスとデフォルト画像ファイル名
const IMAGE_DIR = '/images/animals/';
const FALLBACK_FILE_NAME = 'title-example.png';

interface WaitPageProps {
  isTeacher?: boolean;
  waitingCount?: number;
  totalCount?: number;
}

export default function WaitPage(props: WaitPageProps) {
  return (
    <Suspense fallback={<div className="wait-container">Loading...</div>}>
      <WaitContent {...props} />
    </Suspense>
  );
}

function WaitContent({
  isTeacher: initialIsTeacher,
  waitingCount = 18,
  totalCount = 30,
}: WaitPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = (searchParams.get('mode') as WaitMode) || 'answer_submitted';

  // SyncContainer からユーザー情報・Realtime機能を取得
  const { isTeacher: syncIsTeacher, classId, isLoading: isSyncLoading, navigateAll } = useSync();

  // Propsの指定があればそれを優先し、無ければSyncContainerの判定を使用
  const isTeacher = initialIsTeacher ?? syncIsTeacher;

  const [randomImage, setRandomImage] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isImageLoading, setIsImageLoading] = useState<boolean>(true);

  // =========================================================
  // 1. お題クッション時の3秒タイマー
  // =========================================================
  useEffect(() => {
    if (mode === 'topic_cushion') {
      const timer = setTimeout(() => {
        router.push('/answer');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [mode, router]);

  // =========================================================
  // 2. class_id を元に RPC: get_random_animal から動的に動物画像を取得
  // =========================================================
  useEffect(() => {
    // ユーザー情報の読み込み完了を待つ
    if (isSyncLoading) return;

    const fetchAnimalImage = async () => {
      try {
        if (classId) {
          const { data: animalData, error: rpcError } = await supabase.rpc(
            'get_random_animal',
            { p_class_id: classId }
          );

          if (rpcError) {
            console.error('get_random_animal RPC実行エラー:', rpcError);
            setRandomImage(`${IMAGE_DIR}${FALLBACK_FILE_NAME}`);
          } else if (animalData && animalData.length > 0 && animalData[0].item_image) {
            const fileName = animalData[0].item_image;
            setRandomImage(`${IMAGE_DIR}${fileName}`);
          } else {
            setRandomImage(`${IMAGE_DIR}${FALLBACK_FILE_NAME}`);
          }
        } else {
          setRandomImage(`${IMAGE_DIR}${FALLBACK_FILE_NAME}`);
        }
      } catch (err) {
        console.error('予期せぬエラーが発生しました:', err);
        setRandomImage(`${IMAGE_DIR}${FALLBACK_FILE_NAME}`);
      } finally {
        setIsImageLoading(false);
      }
    };

    fetchAnimalImage();
  }, [classId, isSyncLoading]);

  // =========================================================
  // 3. 先生の操作: モーダルで「移動する」を押した時（親の navigateAll で全員一斉遷移）
  // =========================================================
  const handleConfirmTransition = async () => {
    setIsModalOpen(false);

    const destination =
      mode === 'reaction_completed' ? '/title-result' : '/anonymous-reveal';

    // 共通コンポーネント経由で全員一斉遷移（先生本人の router.push も内包）
    await navigateAll(destination);
  };

  const renderMessage = () => {
    if (mode === 'topic_cushion') {
      return (
        <>
          まもなくワークが始まるよ！
          <br />
          準備はいいかな？
        </>
      );
    }
    return (
      <>
        みんなが終わるのを待ってね！
        <br />
        他の人の画面をのぞいたり、じゃましたりしないでね！
      </>
    );
  };

  const renderModalText = () => {
    if (mode === 'reaction_completed') {
      return (
        <>
          「移動する」を押すと、児童全員とあなたの端末で
          <br />
          称号画面がスタートします。
        </>
      );
    }
    return (
      <>
        「移動する」を押すと、児童全員とあなたの端末で
        <br />
        リアクション画面がスタートします。
      </>
    );
  };

  if (isSyncLoading || isImageLoading) {
    return <div className="wait-container">クラス情報を確認中...</div>;
  }

  return (
    <div className="wait-container">
      <div className="wait-image-container">
        {randomImage && (
          <img
            src={randomImage}
            alt="獲得済み動物イラスト"
            className="wait-image"
          />
        )}
      </div>

      <div className="wait-message-container">
        <p className="wait-message-text">{renderMessage()}</p>
      </div>

      {(mode === 'answer_submitted' || mode === 'reaction_completed') && isTeacher && (
        <div className="teacher-control-area">
          <div className="waiting-counter">
            待機中: <span className="count-highlight">{waitingCount}</span> / {totalCount}
          </div>
          <button
            type="button"
            className="transition-btn"
            onClick={() => setIsModalOpen(true)}
          >
            {mode === 'reaction_completed' ? '称号・一覧画面へ' : 'リアクション画面へ'}
          </button>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <p className="modal-subtext">{renderModalText()}</p>

            <div className="modal-buttons-row">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="modal-btn modal-btn-cancel"
              >
                いいえ
              </button>
              <button
                type="button"
                onClick={handleConfirmTransition}
                className="modal-btn modal-btn-confirm"
              >
                移動する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}