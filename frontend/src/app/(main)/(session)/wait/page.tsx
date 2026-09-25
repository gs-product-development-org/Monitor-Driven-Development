'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import './wait.css';

type WaitMode = 'answer_submitted' | 'topic_cushion' | 'reaction_completed';

const OBTAINED_GACHA_IMAGES = [
  '/images/animals/title-example.png',
  '/images/animals/title-example.png',
  '/images/animals/title-example.png',
  '/images/animals/title-example.png',
  '/images/animals/title-example.png',
];

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
  // 1. 動物ガチャ画像のランダム選定 & お題クッション時の3秒タイマー
  // =========================================================
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * OBTAINED_GACHA_IMAGES.length);
    setRandomImage(OBTAINED_GACHA_IMAGES[randomIndex]);

    // お題決定後のワンクッション（3秒後に回答入力画面へ）
    if (mode === 'topic_cushion') {
      const timer = setTimeout(() => {
        router.push('/answer');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [mode, router]);

  // =========================================================
  // 2. localStorage ('user-storage') の user_id から DB (public.users) を検索
  // =========================================================
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // ① localStorage ('user-storage') から user_id を取得
        const rawItem = localStorage.getItem('user-storage');
        let localUserId: number | null = null;

        if (rawItem) {
          const parsed = JSON.parse(rawItem);
          const id = parsed?.state?.user?.user_id ?? parsed?.user?.user_id ?? parsed?.user_id;
          if (id) {
            localUserId = Number(id);
          }
        }

        if (!localUserId) {
          console.warn('localStorage(user-storage) から user_id を検出できませんでした');
          setIsLoading(false);
          return;
        }

        // ② user_id を使って public.users テーブルを検索
        const { data, error: dbError } = await supabase
          .from('users')
          .select('class_id, role')
          .eq('user_id', localUserId)
          .single();

        if (dbError) {
          console.error('users テーブルからの取得に失敗:', dbError);
        } else if (data) {
          if (data.class_id) setClassId(data.class_id);
          if (data.role === 'teacher') setIsTeacher(true);
        }
      } catch (err) {
        console.error('予期せぬエラーが発生しました:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
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