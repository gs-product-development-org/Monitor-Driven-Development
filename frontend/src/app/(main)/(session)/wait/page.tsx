'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useSync } from '@/components/realtime/SyncContainer';
import './wait.css';

type WaitMode =
  | 'answer_submitted'
  | 'topic_cushion'
  | 'reaction_completed';

// 動物画像の格納フォルダパスとデフォルト画像ファイル名
const IMAGE_DIR = '/images/animals/';
const FALLBACK_FILE_NAME = 'title-example.png';

export default function WaitPage() {
  return (
    <Suspense
      fallback={
        <div className="wait-container">
          Loading...
        </div>
      }
    >
      <WaitContent />
    </Suspense>
  );
}

function WaitContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const mode =
    (searchParams.get('mode') as WaitMode) ||
    'answer_submitted';

  // =========================================================
  // SyncContainerからユーザー情報・Realtime機能を取得
  // =========================================================
  const {
    isTeacher,
    classId,
    isLoading: isSyncLoading,
    updateSessionPhase,
  } = useSync();

  const [randomImage, setRandomImage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);

  // =========================================================
  // 回答進捗
  //
  // submittedCount:
  //   現在のお題に対して1件以上投稿した児童数
  //
  // totalCount:
  //   クラス内の児童数
  // =========================================================
  const [submittedCount, setSubmittedCount] =
    useState<number>(0);

  const [totalCount, setTotalCount] =
    useState<number>(0);

  const [isProgressLoading, setIsProgressLoading] =
    useState<boolean>(true);

  // =========================================================
  // 回答進捗取得
  //
  // get_answer_progress RPCを実行して、
  // 現在のお題に対する回答済み人数を取得する
  // =========================================================
  const fetchAnswerProgress = async () => {
    if (!classId) return;

    try {
      const { data, error } =
        await supabase.rpc(
          'get_answer_progress',
          {
            p_class_id: classId,
          }
        );

      if (error) {
        console.error(
          'get_answer_progress RPC実行エラー:',
          error
        );
        return;
      }

      if (data && data.length > 0) {
        setSubmittedCount(
          data[0].submitted_count
        );

        setTotalCount(
          data[0].total_count
        );

        console.log(
          '回答進捗:',
          data[0]
        );
      }
    } catch (error) {
      console.error(
        '回答進捗取得中のエラー:',
        error
      );
    } finally {
      setIsProgressLoading(false);
    }
  };

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
  // 2. class_idを元にRPC:
  //    get_random_animalから動物画像を取得
  // =========================================================
  useEffect(() => {
    if (isSyncLoading) return;

    const fetchAnimalImage = async () => {
      try {
        if (classId) {
          const { data: animalData, error: rpcError } =
            await supabase.rpc(
              'get_random_animal',
              {
                p_class_id: classId,
              }
            );

          if (rpcError) {
            console.error(
              'get_random_animal RPC実行エラー:',
              rpcError
            );

            setRandomImage(
              `${IMAGE_DIR}${FALLBACK_FILE_NAME}`
            );
          } else if (
            animalData &&
            animalData.length > 0 &&
            animalData[0].item_image
          ) {
            const fileName =
              animalData[0].item_image;

            setRandomImage(
              `${IMAGE_DIR}${fileName}`
            );
          } else {
            setRandomImage(
              `${IMAGE_DIR}${FALLBACK_FILE_NAME}`
            );
          }
        } else {
          setRandomImage(
            `${IMAGE_DIR}${FALLBACK_FILE_NAME}`
          );
        }
      } catch (err) {
        console.error(
          '予期せぬエラーが発生しました:',
          err
        );

        setRandomImage(
          `${IMAGE_DIR}${FALLBACK_FILE_NAME}`
        );
      } finally {
        setIsImageLoading(false);
      }
    };

    fetchAnimalImage();
  }, [classId, isSyncLoading]);

  // =========================================================
  // 3. 回答進捗の初回取得 + Realtime
  //
  // postsに新しい投稿がINSERTされたら、
  // get_answer_progressを再実行して人数を更新する。
  //
  // 1人が複数の候補回答を投稿しても、
  // RPC側でCOUNT(DISTINCT user_id)しているため
  // 人数が重複してカウントされることはない。
  // =========================================================
  useEffect(() => {
    if (isSyncLoading || !classId) {
      return;
    }

    // -----------------------------
    // 初回取得
    // -----------------------------
    fetchAnswerProgress();

    // -----------------------------
    // posts INSERTをRealtime監視
    // -----------------------------
    const channel =
      supabase.channel(
        `wait_answer_progress_${classId}`
      );

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
          console.log(
            '新しい回答を検知:',
            payload
          );

          // 投稿人数を再集計
          fetchAnswerProgress();
        }
      )
      .subscribe((status) => {
        console.log(
          `回答進捗Realtime: ${status}`
        );
      });

    // -----------------------------
    // ページ離脱時に購読解除
    // -----------------------------
    return () => {
      supabase.removeChannel(channel);
    };
  }, [classId, isSyncLoading]);

  // =========================================================
  // 4. 先生の操作
  //
  // answer_submitted
  //   → REACTION
  //
  // reaction_completed
  //   → TITLE_RESULT
  //
  // DBのphaseを変更すると、
  // SyncContainerのRealtimeがそれを検知して
  // 全員を対応するページへ遷移させる
  // =========================================================
  const handleConfirmTransition = async () => {
    setIsModalOpen(false);

    try {
      const nextPhase =
        mode === 'reaction_completed'
          ? 'TITLE_RESULT'
          : 'REACTION';

      await updateSessionPhase(nextPhase);
    } catch (error) {
      console.error(
        'セッションフェーズ更新エラー:',
        error
      );
    }
  };

  // =========================================================
  // 5. 待機画面メッセージ
  // =========================================================
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

  // =========================================================
  // 6. モーダルメッセージ
  // =========================================================
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

  // =========================================================
  // 7. Loading
  // =========================================================
  if (
    isSyncLoading ||
    isImageLoading ||
    isProgressLoading
  ) {
    return (
      <div className="wait-container">
        クラス情報を確認中...
      </div>
    );
  }

  // =========================================================
  // 8. 画面
  // =========================================================
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
        <p className="wait-message-text">
          {renderMessage()}
        </p>
      </div>

      {(mode === 'answer_submitted' ||
        mode === 'reaction_completed') &&
        isTeacher && (
          <div className="teacher-control-area">
            <div className="waiting-counter">
              待機中:{' '}
              <span className="count-highlight">
                {submittedCount}
              </span>{' '}
              / {totalCount}
            </div>

            <button
              type="button"
              className="transition-btn"
              onClick={() => setIsModalOpen(true)}
            >
              {mode === 'reaction_completed'
                ? '称号・一覧画面へ'
                : 'リアクション画面へ'}
            </button>
          </div>
        )}

      {/* =====================================================
          確認モーダル
      ===================================================== */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <p className="modal-subtext">
              {renderModalText()}
            </p>

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
