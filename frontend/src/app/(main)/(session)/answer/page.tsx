'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import './answer.css';

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

  // ユーザー情報
  const [userInfo, setUserInfo] = useState<any>(null);

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

  // ユーザー情報をsessionStorageから取得
  useEffect(() => {
    const storedUser = sessionStorage.getItem('user_info');

    if (!storedUser) {
      console.error('user_info がありません');
      return;
    }

    try {
      setUserInfo(JSON.parse(storedUser));
    } catch (error) {
      console.error('user_info の読み込みに失敗:', error);
    }
  }, []);

  // 現在のお題を取得
  //
  // お題の正解データは
  // class_sessions.topic_id
  // ↓
  // topics.topic_id
  //
  // の順番で取得する。
  //
  // sessionStorage の current_work_topic は
  // 現在のお題を決めるためには使用せず、
  // DBから取得したお題のキャッシュとして更新する。
  useEffect(() => {
    const loadTopic = async () => {
      const storedUser = sessionStorage.getItem('user_info');

      if (!storedUser) {
        console.error('user_info がありません');
        return;
      }

      let parsedUser: any;

      try {
        parsedUser = JSON.parse(storedUser);
      } catch (error) {
        console.error('user_info の解析に失敗:', error);
        return;
      }

      const classId = Number(parsedUser?.class_id);

      if (!classId) {
        console.error('class_id を取得できませんでした');
        return;
      }

      try {
        // ① 現在のclass_sessionsを取得
        const {
          data: sessionData,
          error: sessionError,
        } = await supabase
          .from('class_sessions')
          .select(
            'session_id, class_id, topic_id, phase, updated_at'
          )
          .eq('class_id', classId)
          .order('session_id', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (sessionError) {
          console.error(
            'class_sessions の取得に失敗:',
            sessionError
          );
          return;
        }

        if (!sessionData) {
          console.error('class_sessions が見つかりません');
          return;
        }

        const topicId = Number(sessionData.topic_id);

        if (!topicId) {
          console.error(
            'class_sessions に topic_id が設定されていません'
          );
          return;
        }

        console.log('現在のclass_session:', sessionData);
        console.log('現在のお題のtopic_id:', topicId);

        // ② class_sessions.topic_id のお題を取得
        const {
          data: topicData,
          error: topicError,
        } = await supabase
          .from('topics')
          .select(`
            topic_id,
            class_id,
            genre_id,
            topic_content,
            created_at
          `)
          .eq('topic_id', topicId)
          .eq('class_id', classId)
          .maybeSingle();

        if (topicError) {
          console.error(
            'topics の取得に失敗:',
            topicError
          );
          return;
        }

        if (!topicData) {
          console.error(
            `topic_id=${topicId} のお題が見つかりません`
          );
          return;
        }

        const resolvedGenreName =
          GENRE_ID_TO_NAME[Number(topicData.genre_id)] || 'お題';

        const topicInfo: TopicInfo = {
          topic_id: Number(topicData.topic_id),
          class_id: Number(topicData.class_id),
          genre_name: resolvedGenreName,
          topic_content: topicData.topic_content,
        };

        console.log('表示するお題:', topicInfo);

        // ③ Stateを更新
        setCurrentTopicInfo(topicInfo);

      } catch (error) {
        console.error(
          'お題取得中に例外エラーが発生:',
          error
        );
      }
    };

    loadTopic();
  }, []);

  const checkScrollable = () => {
    const el = chatAreaRef.current;

    if (!el) return;

    const hasScroll = el.scrollHeight > el.clientHeight;

    const isAtBottom =
      el.scrollTop + el.clientHeight >= el.scrollHeight - 5;

    setCanScroll(hasScroll && !isAtBottom);
  };

  useEffect(() => {
    checkScrollable();

    window.addEventListener('resize', checkScrollable);

    return () => {
      window.removeEventListener('resize', checkScrollable);
    };
  }, [stockList, step]);

  const handleAddStock = () => {
    const trimmed = inputText.trim();

    if (!trimmed) {
      alert('回答を入力してください');
      return;
    }

    const newId = Date.now().toString();

    const newStock: StockTopic = {
      id: newId,
      text: trimmed,
    };

    setStockList((prevList) => [
      ...prevList,
      newStock,
    ]);

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
    const selectedTopic = stockList.find(
      (item) => item.id === selectedTopicId
    );

    if (
      !selectedTopic ||
      !pendingAction ||
      isSubmitting
    ) {
      return;
    }

    setIsSubmitting(true);

    try {
      const userId = Number(userInfo?.user_id);
      const classId =
        currentTopicInfo.class_id ??
        Number(userInfo?.class_id);

      if (!userId || !classId) {
        alert(
          'ユーザー情報またはクラス情報が取得できませんでした。再ログインしてください。'
        );

        setIsSubmitting(false);
        return;
      }

      // topic_id が取得できていない状態では投稿させない
      if (!currentTopicInfo.topic_id) {
        alert(
          '現在のお題情報が取得できていません。ページを再読み込みしてください。'
        );

        setIsSubmitting(false);
        return;
      }

      const isPosted =
        pendingAction === 'announce';

      const {
        data,
        error,
      } = await supabase.rpc('create_post', {
        p_class_id: classId,
        p_user_id: userId,
        p_topic_id: currentTopicInfo.topic_id,
        p_post_content: selectedTopic.text,
        p_is_posted: isPosted,
      });

      if (error) {
        console.error(
          '投稿の保存エラー:',
          error
        );

        alert(
          `回答の保存に失敗しました: ${error.message}`
        );

        setIsSubmitting(false);
        return;
      }

      console.log('投稿完了:', data);

      setPendingAction(null);

      // 待機画面へ移動
      router.push('/wait');
    } catch (err) {
      console.error(
        '処理例外エラー:',
        err
      );

      alert(
        '予期せぬエラーが発生しました'
      );

      setIsSubmitting(false);
    }
  };

  const currentSelectedTopic =
    stockList.find(
      (item) => item.id === selectedTopicId
    );

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
                    const isSelected =
                      item.id === selectedTopicId;

                    return (
                      <div
                        key={item.id}
                        onClick={() =>
                          setSelectedTopicId(item.id)
                        }
                        className={`chat-bubble ${
                          isSelected
                            ? 'selected'
                            : ''
                        }`}
                      >
                        <p className="chat-text">
                          {item.text}
                        </p>
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
                onChange={(e) =>
                  setInputText(e.target.value)
                }
                placeholder="回答を入力して書き溜める..."
                className="stock-input-box"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddStock();
                  }
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
                  <line
                    x1="22"
                    y1="2"
                    x2="11"
                    y2="13"
                  />
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
              <p className="preview-text">
                {currentSelectedTopic?.text}
              </p>
            </div>
          </div>

          <div className="action-buttons-row">
            <button
              type="button"
              className="action-toggle-btn"
              onClick={() =>
                handleActionSelect('chest')
              }
              disabled={isSubmitting}
            >
              宝箱にしまう
            </button>

            <button
              type="button"
              className="action-toggle-btn action-toggle-btn-primary"
              onClick={() =>
                handleActionSelect('announce')
              }
              disabled={isSubmitting}
            >
              公開する
            </button>
          </div>

          {pendingAction && (
            <div className="modal-overlay">
              <div className="modal-card">
                <p className="modal-message">
                  回答
                </p>

                <p className="modal-message-topic">
                  「
                  <span className="modal-topic-highlight">
                    {currentSelectedTopic?.text}
                  </span>
                  」
                </p>

                <p className="modal-subtext">
                  {pendingAction === 'chest' ? (
                    <>
                      この回答を自分だけの宝箱にしまいますか？
                      <br />
                      しまった回答は後から確認できるよ
                    </>
                  ) : (
                    <>
                      この回答を公開しますか？
                      <br />
                      誰が公開したかはわからないよ
                    </>
                  )}
                </p>

                <div className="modal-buttons-row">
                  <button
                    type="button"
                    onClick={() =>
                      setPendingAction(null)
                    }
                    className="modal-btn modal-btn-cancel"
                    disabled={isSubmitting}
                  >
                    いいえ
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleActionModalSubmit
                    }
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
            <p className="modal-message">
              回答
            </p>

            <p className="modal-message-topic">
              「
              <span className="modal-topic-highlight">
                {currentSelectedTopic?.text}
              </span>
              」
            </p>

            <p className="modal-subtext">
              「これにする」を押すと
              <br />
              もう回答の変更はできません
            </p>

            <div className="modal-buttons-row">
              <button
                type="button"
                onClick={() =>
                  setIsModalOpen(false)
                }
                className="modal-btn modal-btn-cancel"
              >
                いいえ
              </button>

              <button
                type="button"
                onClick={
                  handlePhase1ModalSubmit
                }
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
