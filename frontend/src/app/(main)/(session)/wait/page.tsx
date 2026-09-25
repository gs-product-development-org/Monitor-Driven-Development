'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
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

export default function WaitPage() {
  return (
    <Suspense fallback={<div className="wait-container">Loading...</div>}>
      <WaitContent />
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

  const [isTeacher, setIsTeacher] = useState<boolean>(initialIsTeacher ?? false);
  const [classId, setClassId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [randomImage, setRandomImage] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // =========================================================
  // 1. お題クッション時の3秒タイマー
  // =========================================================
  useEffect(() => {
    // お題決定後のワンクッション（3秒後に回答入力画面へ）
    if (mode === 'topic_cushion') {
      const timer = setTimeout(() => {
        router.push('/answer');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [mode, router]);

  // =========================================================
  // 2. sessionStorage ('user_info') からユーザー情報を取得 & 動物画像取得
  // =========================================================
  useEffect(() => {
    const fetchUserDataAndAnimal = async () => {
      try {
        // ① sessionStorage ('user_info') から保存済み情報を取得
        const rawItem = sessionStorage.getItem('user_info');

        if (!rawItem) {
          console.warn('sessionStorage(user_info) からユーザー情報を検出できませんでした');
          setRandomImage(`${IMAGE_DIR}${FALLBACK_FILE_NAME}`);
          setIsLoading(false);
          return;
        }

        const userInfo = JSON.parse(rawItem);
        const currentClassId = userInfo?.class_id ? Number(userInfo.class_id) : null;
        const currentRole = userInfo?.role;

        // 教員判定を反映
        if (currentRole === 'teacher') {
          setIsTeacher(true);
        }

        // class_id が取得できた場合、状態にセットしてランダム動物画像を取得
        if (currentClassId) {
          setClassId(currentClassId);

          // ② RPC: get_random_animal を呼び出してランダム動物画像を取得
          const { data: animalData, error: rpcError } = await supabase.rpc(
            'get_random_animal',
            { p_class_id: currentClassId }
          );

          if (rpcError) {
            console.error('get_random_animal RPC実行エラー:', rpcError);
            setRandomImage(`${IMAGE_DIR}${FALLBACK_FILE_NAME}`);
          } else if (animalData && animalData.length > 0 && animalData[0].item_image) {
            // DBから得られたファイル名（例: "lion.png"）にフォルダパスを結合
            const fileName = animalData[0].item_image;
            setRandomImage(`${IMAGE_DIR}${fileName}`);
          } else {
            // 動物が未配置の場合などのフォールバック
            setRandomImage(`${IMAGE_DIR}${FALLBACK_FILE_NAME}`);
          }
        } else {
          setRandomImage(`${IMAGE_DIR}${FALLBACK_FILE_NAME}`);
        }
      } catch (err) {
        console.error('予期せぬエラーが発生しました:', err);
        setRandomImage(`${IMAGE_DIR}${FALLBACK_FILE_NAME}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDataAndAnimal();
  }, []);

  // =========================================================
  // 3. class_id 確定後、そのクラス専用の Realtime チャンネルへ接続
  // =========================================================
  useEffect(() => {
    if (!classId) return;

    // クラスIDに基づいたチャンネルを作成（例: classroom_1）
    const channel = supabase.channel(`classroom_${classId}`);
    channelRef.current = channel;

    channel
      .on(
        'broadcast',
        { event: 'PAGE_TRANSITION' },
        (payload: { payload: { destination: string } }) => {
          if (payload.payload?.destination) {
            router.push(payload.payload.destination);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [classId, router]);

  // =========================================================
  // 4. 先生の操作: モーダルで「移動する」を押した時（一斉遷移イベント送信）
  // =========================================================
  const handleConfirmTransition = async () => {
    setIsModalOpen(false);

    const destination =
      mode === 'reaction_completed' ? '/title-result' : '/anonymous-reveal';

    // 接続済みのチャンネルから画面遷移指示を Broadcast 送信
    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'PAGE_TRANSITION',
        payload: { destination },
      });
    }

    // 先生本人の画面も遷移
    router.push(destination);
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

  if (isLoading) {
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