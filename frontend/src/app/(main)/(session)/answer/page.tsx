'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import './answer.css';

// sessionStorage 保存用キー名定数
const CURRENT_WORK_TOPIC_KEY = 'current_work_topic';

// genre_id から genre_name へのマッピング
const GENRE_ID_TO_NAME: Record<number, string> = {
  1: '学校',
  2: '日常',
  3: '好きなもの',
  4: '雑談',
  5: 'ユニーク',
};

type StockTopic = {
  id: string;
  text: string;
};

type ActionType = 'chest' | 'announce';

type TopicInfo = {
  topic_id: number | null;
  class_id: number | null;
  genre_name: string;
  topic_content: string;
};

export default function TopicStockPage() {
  const router = useRouter();
  const { user } = useRequireAuth(); // ユーザー情報の取得

  const [step, setStep] = useState<'input' | 'action'>('input');

  // お題データ用 State
  const [currentTopicInfo, setCurrentTopicInfo] = useState<TopicInfo>({
    topic_id: null,
    class_id: null,
    genre_name: 'お題',
    topic_content: '',
  });

  const [stockList, setStockList] = useState<StockTopic[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  // 送信処理中フラグ
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // モーダル管理用 State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<ActionType | null>(null);

  // スクロール検知用 Ref & State
  const chatAreaRef = useRef<HTMLDivElement | null>(null);
  const [canScroll, setCanScroll] = useState<boolean>(false);

  // ★初期化：sessionStorage に無ければ RPC `get_topic` から取得して一律キャッシュ化
  useEffect(() => {
    const loadTopic = async () => {
      // 1. まず sessionStorage から復元を試みる
      const stored = sessionStorage.getItem(CURRENT_WORK_TOPIC_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.topic_id && parsed.topic_content) {
            setCurrentTopicInfo({
              topic_id: parsed.topic_id ? Number(parsed.topic_id) : null,
              class_id: parsed.class_id ? Number(parsed.class_id) : null,
              genre_name: parsed.genre_name || 'お題',
              topic_content: parsed.topic_content || '',
            });
            return; // キャッシュがあればDBアクセスせず終了
          }
        } catch (e) {
          console.error('sessionStorage の読み込みエラー:', e);
        }
      }

      // 2. キャッシュがない場合は DB（RPC: get_topic）から最新お題を取得
      try {
        let classId: number | null = (user as any)?.class_id ? Number((user as any).class_id) : null;
        if (!classId) {
          const { data: sessionData } = await supabase.auth.getSession();
          classId = Number(sessionData?.session?.user?.user_metadata?.class_id);
        }

        if (!classId) {
          console.error('クラスIDを取得できませんでした');
          return;
        }

        // RPC 関数の呼び出し
        const { data, error } = await supabase.rpc('get_topic', {
          p_class_id: classId,
        });

        if (error) {
          console.error('get_topic の呼び出しに失敗:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            fullError: error,
          });
          return;
        }

        const latestTopic = Array.isArray(data) && data.length > 0 ? data[0] : null;

        if (latestTopic) {
          const resolvedGenreName =
            latestTopic.genre_name ||
            (latestTopic.genre_id ? GENRE_ID_TO_NAME[Number(latestTopic.genre_id)] : 'お題');

          const topicData = {
            topic_id: Number(latestTopic.topic_id),
            class_id: Number(latestTopic.class_id),
            genre_name: resolvedGenreName,
            topic_content: latestTopic.topic_content,
          };

          // State を更新
          setCurrentTopicInfo(topicData);

          // 次回の表示や別画面用に sessionStorage へ保存
          sessionStorage.setItem(CURRENT_WORK_TOPIC_KEY, JSON.stringify(topicData));
        } else {
          console.warn('該当するクラスのお題が見つかりませんでした');
        }
      } catch (err) {
        console.error('お題取得中に例外エラーが発生:', err);
      }
    };

    loadTopic();
  }, [user]);

  const checkScrollable = () => {
    const el = chatAreaRef.current;
    if (!el) return;
    const hasScroll = el.scrollHeight > el.clientHeight;
    const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 5;
    setCanScroll(hasScroll && !isAtBottom);
  };

  useEffect(() => {
    checkScrollable();
    window.addEventListener('resize', checkScrollable);
    return () => window.removeEventListener('resize', checkScrollable);
  }, [stockList, step]);

  const handleAddStock = () => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      alert('回答を入力してください');
      return;
    }

    const newId = Date.now().toString();
    const newStock: StockTopic = { id: newId, text: trimmed };

    setStockList((prevList) => [...prevList, newStock]);
    setInputText('');
  };

  // フェーズ1の「確定」ボタン押下時
  const handleFirstConfirm = () => {
    if (!selectedTopicId) return;
    setIsModalOpen(true);
  };

  // フェーズ1モーダルの「これにする」ボタン押下時
  const handlePhase1ModalSubmit = () => {
    setIsModalOpen(false);
    setStep('action');
  };

  // フェーズ2のボタン選択時
  const handleActionSelect = (action: ActionType) => {
    setPendingAction(action);
  };

  // 最終確定処理
  const handleActionModalSubmit = async () => {
    const selectedTopic = stockList.find((item) => item.id === selectedTopicId);
    if (!selectedTopic || !pendingAction || isSubmitting) return;

    setIsSubmitting(true);

    try {
      let userId: number | null = (user as any)?.user_id ? Number((user as any).user_id) : null;
      let classId: number | null = currentTopicInfo.class_id ?? ((user as any)?.class_id ? Number((user as any).class_id) : null);

      if (!userId || !classId) {
        const { data: sessionData } = await supabase.auth.getSession();
        const sessionUser = sessionData?.session?.user;
        if (sessionUser) {
          if (!userId) userId = Number(sessionUser.user_metadata?.user_id || sessionUser.id);
          if (!classId) classId = Number(sessionUser.user_metadata?.class_id);
        }
      }

      if (!userId || !classId) {
        alert('ユーザー情報またはクラス情報が取得できませんでした。再ログインしてください。');
        setIsSubmitting(false);
        return;
      }

      const isPosted = pendingAction === 'announce'; // announce なら true, chest なら false

      const { data, error } = await supabase.rpc('create_post', {
        p_class_id: classId,
        p_user_id: userId,
        p_topic_id: currentTopicInfo.topic_id,
        p_post_content: selectedTopic.text,
        p_is_posted: isPosted,
      });

      if (error) {
        console.error('投稿の保存エラー:', error);
        alert(`回答の保存に失敗しました: ${error.message}`);
        setIsSubmitting(false);
        return;
      }

      console.log('投稿完了:', data);
      setPendingAction(null);

      // 待機画面へ移動
      router.push('/wait');
    } catch (err) {
      console.error('処理例外エラー:', err);
      alert('予期せぬエラーが発生しました');
      setIsSubmitting(false);
    }
  };

  const currentSelectedTopic = stockList.find((item) => item.id === selectedTopicId);

  return (
    <div className="stock-container">
      {/* 上部: お題テキスト / ジャンル名表示 */}
      <div className="stock-main-topic">
        <h1 className="stock-topic-title">
          {currentTopicInfo.topic_content
            ? `【${currentTopicInfo.genre_name}】${currentTopicInfo.topic_content}`
            : currentTopicInfo.genre_name}
        </h1>
      </div>

      {/* フェーズ 1: 書き溜め・選択 */}
      {step === 'input' && (
        <>
          <div className="stock-center-wrapper">
            <div
              ref={chatAreaRef}
              onScroll={checkScrollable}
              className="stock-chat-area"
            >
              {stockList.length > 0 ? (
                <>
                  <p className="stock-instruction-text">
                    ※書き留めた回答の中から1つ選んで「確定」ボタンを押してね
                  </p>

                  {stockList.map((item) => {
                    const isSelected = item.id === selectedTopicId;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedTopicId(item.id)}
                        className={`chat-bubble ${isSelected ? 'selected' : ''}`}
                      >
                        <p className="chat-text">{item.text}</p>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="stock-empty-text">
                  ※下部の入力欄から回答を書き溜めてください
                </div>
              )}
            </div>

            {canScroll && (
              <div className="scroll-indicator">
                <span>▼</span>
                <span>スクロール</span>
              </div>
            )}
          </div>

          <div className="stock-input-area">
            <div className="stock-input-wrapper">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="回答を入力して書き溜める..."
                className="stock-input-box"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddStock();
                }}
              />
              <button
                type="button"
                onClick={handleAddStock}
                className="stock-icon-submit-button"
                aria-label="書き溜める"
              >
                <svg
                  className="stock-send-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>

            <Button
              onClick={handleFirstConfirm}
              disabled={!selectedTopicId}
              className="stock-confirm-button"
            >
              確定
            </Button>
          </div>
        </>
      )}

      {/* フェーズ 2: アクション選択 */}
      {step === 'action' && (
        <div className="action-phase-wrapper">
          <div className="action-illustration-box">
            <img
              src="/images/contents/answer-egg.png"
              alt="決定お題ボード"
              className="action-illustration"
            />
            <div className="action-topic-preview">
              <p className="preview-text">{currentSelectedTopic?.text}</p>
            </div>
          </div>

          <div className="action-buttons-row">
            <button
              type="button"
              className="action-toggle-btn"
              onClick={() => handleActionSelect('chest')}
              disabled={isSubmitting}
            >
              宝箱にしまう
            </button>
            <button
              type="button"
              className="action-toggle-btn action-toggle-btn-primary"
              onClick={() => handleActionSelect('announce')}
              disabled={isSubmitting}
            >
              公開する
            </button>
          </div>

          {pendingAction && (
            <div className="modal-overlay">
              <div className="modal-card">
                <p className="modal-message">回答</p>
                <p className="modal-message-topic">
                  「<span className="modal-topic-highlight">{currentSelectedTopic?.text}</span>」
                </p>

                <p className="modal-subtext">
                  {pendingAction === 'chest' ? (
                    <>
                      この回答を自分だけの宝箱にしまいますか？<br />
                      しまった回答は後から確認できるよ
                    </>
                  ) : (
                    <>
                      この回答を公開しますか？<br />
                      誰が公開したかはわからないよ
                    </>
                  )}
                </p>

                <div className="modal-buttons-row">
                  <button
                    type="button"
                    onClick={() => setPendingAction(null)}
                    className="modal-btn modal-btn-cancel"
                    disabled={isSubmitting}
                  >
                    いいえ
                  </button>
                  <button
                    type="button"
                    onClick={handleActionModalSubmit}
                    className="modal-btn modal-btn-confirm"
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? '保存中...'
                      : pendingAction === 'chest'
                      ? 'しまう'
                      : '公開する'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* フェーズ 1 確認モーダル */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <p className="modal-message">回答</p>
            <p className="modal-message-topic">
              「<span className="modal-topic-highlight">{currentSelectedTopic?.text}</span>」
            </p>

            <p className="modal-subtext">
              「これにする」を押すと<br />
              もう回答の変更はできません
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
                onClick={handlePhase1ModalSubmit}
                className="modal-btn modal-btn-confirm"
              >
                これにする
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}