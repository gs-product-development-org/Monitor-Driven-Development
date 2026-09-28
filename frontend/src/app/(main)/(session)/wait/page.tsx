'use client';

import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useSync } from '@/components/realtime/SyncContainer';
import './wait.css';

type WaitMode = 'answer_submitted' | 'topic_cushion' | 'reaction_completed';

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
}: WaitPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = (searchParams.get('mode') as WaitMode) || 'answer_submitted';

  // routerの参照変更によるタイマーリセットを防ぐため useRef に保持
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  const {
    isTeacher: syncIsTeacher,
    classId,
    isLoading: isSyncLoading,
    updateSessionPhase,
  } = useSync();

  const isTeacher = initialIsTeacher ?? syncIsTeacher;

  const [randomImage, setRandomImage] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isImageLoading, setIsImageLoading] = useState<boolean>(true);

  // =========================================================
  // 回答進捗の状態管理
  // =========================================================
  const [submittedCount, setSubmittedCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isProgressLoading, setIsProgressLoading] = useState<boolean>(true);

  // =========================================================
  // 回答進捗取得 (get_answer_progress RPC)
  // =========================================================
  const fetchAnswerProgress = useCallback(async () => {
    if (!classId) return;

    try {
      const { data, error } = await supabase.rpc('get_answer_progress', {
        p_class_id: classId,
      });

      if (error) {
        console.error('get_answer_progress RPC実行エラー:', error);
        return;
      }

      if (data && data.length > 0) {
        setSubmittedCount(data[0].submitted_count ?? 0);
        setTotalCount(data[0].total_count ?? 0);
        console.log('回答進捗を取得しました:', data[0]);
      }
    } catch (error) {
      console.error('回答進捗取得中のエラー:', error);
    } finally {
      setIsProgressLoading(false);
    }
  }, [classId]);

  // =========================================================
  // 1. お題クッション時の3秒タイマー
  // =========================================================
  useEffect(() => {
    if (mode === 'topic_cushion') {
      console.log('3秒タイマーを開始します...');

      const timer = setTimeout(() => {
        console.log('/answer へ遷移します');
        routerRef.current.push('/answer');
      }, 3000);

      return () => {
        console.log('タイマーをクリアしました');
        clearTimeout(timer);
      };
    }
  }, [mode]);

  // =========================================================
  // 2. class_id を元に RPC: get_random_animal から動的に動物画像を取得
  // =========================================================
  useEffect(() => {
    if (isSyncLoading) return;

    let isMounted = true;

    const fetchAnimalImage = async () => {
      setIsImageLoading(true);
      try {
        if (classId) {
          const { data: animalData, error: rpcError } = await supabase.rpc(
            'get_random_animal',
            { p_class_id: classId }
          );

          if (!isMounted) return;

          if (rpcError) {
            console.error('get_random_animal RPC実行エラー:', rpcError);
            setRandomImage(`${IMAGE_DIR}${FALLBACK_FILE_NAME}`);
          } else if (animalData && animalData.length > 0 && animalData[0]?.item_image) {
            const fileName = animalData[0].item_image;
            setRandomImage(`${IMAGE_DIR}${fileName}`);
          } else {
            setRandomImage(`${IMAGE_DIR}${FALLBACK_FILE_NAME}`);
          }
        } else {
          if (isMounted) setRandomImage(`${IMAGE_DIR}${FALLBACK_FILE_NAME}`);
        }
      } catch (err) {
        console.error('予期せぬエラーが発生しました:', err);
        if (isMounted) setRandomImage(`${IMAGE_DIR}${FALLBACK_FILE_NAME}`);
      } finally {
        if (isMounted) setIsImageLoading(false);
      }
    };

    fetchAnimalImage();

    return () => {
      isMounted = false;
    };
  }, [classId, isSyncLoading]);

  // =========================================================
  // 3. 回答進捗の初回取得 + Realtime監視 (postsテーブルのINSERT検知)
  // =========================================================
  useEffect(() => {
    if (isSyncLoading || !classId) return;

    // 初回取得
    fetchAnswerProgress();

    // posts INSERTをRealtime監視
    const channel = supabase.channel(`wait_answer_progress_${classId}`);

    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
          filter: `class_id=eq.${classId}`,
        },
        (payload) => {
          console.log('新しい回答を検知:', payload);
          fetchAnswerProgress();
        }
      )
      .subscribe((status) => {
        console.log(`回答進捗Realtimeステータス: ${status}`);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [classId, isSyncLoading, fetchAnswerProgress]);

  // =========================================================
  // 4. 先生の操作: モーダルで「移動する」を押した時
  // =========================================================
  const handleConfirmTransition = async () => {
    setIsModalOpen(false);

    const targetPhase =
      mode === 'reaction_completed' ? 'TITLE_RESULT' : 'REACTION';

    try {
      if (!classId) {
        console.error('クラスIDが見つかりません');
        return;
      }

      await updateSessionPhase(targetPhase);
      console.log(`Phaseを ${targetPhase} に正常更新しました`);
    } catch (err: any) {
      console.error('画面遷移の更新処理でエラーが発生しました:', err?.message || err);
    }
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

  if (isSyncLoading || isImageLoading || isProgressLoading) {
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
            待機中: <span className="count-highlight">{submittedCount}</span> / {totalCount}
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