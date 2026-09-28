'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useSync } from '@/components/realtime/SyncContainer';
import { usePostDistribution } from '@/hooks/usePostDistribution'; // フックのパスは環境に合わせて調整してください

// types フォルダから型とマッピング定数をインポート
import { Genre, GENRE_ID_MAP, REACTION_SETS, ReactionOption } from '@/types/reaction';

import './anonymous-reveal.css';

interface AnonymousRevealPageProps {
  genre?: Genre;
  topicText?: string;
  classId?: number;
  currentUserId?: number;
}

export default function AnonymousRevealPage({
  genre: propsGenre,
  topicText: propsTopicText,
  classId: propsClassId,
  currentUserId: propsUserId,
}: AnonymousRevealPageProps) {
  const router = useRouter();

  // 1. SyncContainer から同期データを取得
  const {
    classId: syncClassId,
    userId: syncUserId,
    sessionId: syncSessionId,
    isLoading: isSyncLoading,
  } = useSync();

  // Propsの指定があれば優先、無ければ SyncContainer の値を使用
  const classId = propsClassId ?? syncClassId;
  const currentUserId = propsUserId ?? syncUserId;

  // DBから取得するお題関連のステート
  const [topicId, setTopicId] = useState<number | null>(null);
  const [activeTopicText, setActiveTopicText] = useState<string>(
    propsTopicText || 'お題を読み込んでいます...'
  );
  const [activeGenre, setActiveGenre] = useState<Genre>(propsGenre || '学校');
  const [genreId, setGenreId] = useState<number>(1);
  const [isTopicLoading, setIsTopicLoading] = useState<boolean>(true);

  // ------------------------------------------------------------
  // 2. class_sessions からアクティブなお題・ジャンル情報を取得
  // ------------------------------------------------------------
  const fetchTopicAndGenre = useCallback(async () => {
    if (!classId && !syncSessionId) return;

    setIsTopicLoading(true);
    try {
      // sessionId または classId で active / 进行中 の class_sessions を検索
      let query = supabase
        .from('class_sessions')
        .select(`
          topic_id,
          topics (
            topic_id,
            topic_content,
            genre_id,
            genres (
              genre_id,
              genre_name
            )
          )
        `);

      if (syncSessionId) {
        query = query.eq('session_id', syncSessionId);
      } else if (classId) {
        query = query.eq('class_id', classId);
      }

      const { data: sessionData, error: sessionError } = await query
        .limit(1)
        .maybeSingle();

      if (sessionError) {
        console.error('class_sessions の取得エラー:', sessionError.message);
      } else if (sessionData && sessionData.topics) {
        const topic = sessionData.topics as any;
        const fetchedTopicId = Number(topic.topic_id || sessionData.topic_id);
        const fetchedGenreId = Number(topic.genre_id || topic.genres?.id || 1);

        setTopicId(fetchedTopicId);
        setGenreId(fetchedGenreId);

        if (topic.topic_content) {
          setActiveTopicText(topic.topic_content);
        }

        // ジャンル名の特定（Propsが指定されていない場合）
        if (!propsGenre) {
          if (GENRE_ID_MAP[fetchedGenreId]) {
            setActiveGenre(GENRE_ID_MAP[fetchedGenreId]);
          } else if (topic.genres?.genre_name && REACTION_SETS[topic.genres.genre_name as Genre]) {
            setActiveGenre(topic.genres.genre_name as Genre);
          }
        }
      }
    } catch (e) {
      console.error('お題・ジャンル情報の取得に失敗しました:', e);
    } finally {
      setIsTopicLoading(false);
    }
  }, [classId, syncSessionId, propsGenre]);

  useEffect(() => {
    if (!isSyncLoading) {
      fetchTopicAndGenre();
    }
  }, [isSyncLoading, fetchTopicAndGenre]);

  // ------------------------------------------------------------
  // 3. 配布フックから投稿データの取得
  // ------------------------------------------------------------
  const { assignedPosts, loading: isPostsLoading, error } = usePostDistribution(
    classId,
    currentUserId,
    topicId
  );

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const totalAnswers = assignedPosts.length;
  const currentPost = assignedPosts[currentIndex];

  // ジャンルに合ったリアクションボタン一覧の取得
  const currentReactions: ReactionOption[] =
    REACTION_SETS[activeGenre] || REACTION_SETS['学校'];

  // 全体のローディング状態
  const isLoading = isSyncLoading || isTopicLoading || isPostsLoading;

  // ------------------------------------------------------------
  // 4. リアクション選択時の処理（DB保存 ＆ 次の投稿へ遷移）
  // ------------------------------------------------------------
  const handleSelectReaction = async (reactionId: string | number, index: number) => {
    if (!currentPost || !currentUserId || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // 1〜4 の数値 (stamp_type) を計算
      let stampTypeNumber = 1;
      const parsedId = Number(reactionId);

      if (!isNaN(parsedId) && parsedId >= 1 && parsedId <= 4) {
        stampTypeNumber = parsedId;
      } else if (typeof index === 'number' && index >= 0 && index <= 3) {
        stampTypeNumber = index + 1;
      } else {
        const reactionMap: Record<string, number> = {
          '1': 1, '2': 2, '3': 3, '4': 4,
          'reaction_1': 1, 'reaction_2': 2, 'reaction_3': 3, 'reaction_4': 4,
          'r1': 1, 'r2': 2, 'r3': 3, 'r4': 4,
          'like': 1, 'heart': 2, 'smile': 3, 'surprised': 4,
        };
        stampTypeNumber = reactionMap[String(reactionId)] || 1;
      }

      console.log('【デバッグ】選択されたリアクション:', {
        postId: currentPost.post_id,
        genreId,
        stampType: stampTypeNumber,
        userId: currentUserId,
      });

      // RPC 'add_reactions_bulk' を実行
      const { data, error: rpcError } = await supabase.rpc('add_reactions_bulk', {
        p_reactions: [
          {
            post_id: currentPost.post_id,
            genre_id: genreId,
            stamp_type: stampTypeNumber,
          },
        ],
        p_user_id: currentUserId,
      });

      if (rpcError) {
        console.error('RPC実行エラー詳細:', rpcError.message || JSON.stringify(rpcError, null, 2));
      } else {
        console.log('リアクション保存成功(RPC):', data);
      }
    } catch (e: any) {
      console.error('通信/例外エラー:', e?.message || e);
    } finally {
      setIsSubmitting(false);
    }

    // 次の投稿へ進む処理
    const nextIndex = currentIndex + 1;
    if (nextIndex < totalAnswers) {
      setCurrentIndex(nextIndex);
    } else {
      router.push('/wait?mode=reaction_completed');
    }
  };

  // ローディング画面
  if (isLoading) {
    return (
      <div className="reveal-container">
        <p style={{ textAlign: 'center', marginTop: '40vh' }}>情報を読み込んでいます...</p>
      </div>
    );
  }

  // エラー時・投稿が1件もない場合
  if (error || (assignedPosts.length === 0 && !isLoading)) {
    return (
      <div className="reveal-container">
        <p style={{ textAlign: 'center', marginTop: '40vh' }}>
          {error ? `エラーが発生しました: ${error}` : 'リアクション対象の投稿がありません。'}
        </p>
      </div>
    );
  }

  return (
    <div className="reveal-container">
      {/* 1. お題表示 */}
      <header className="stock-main-topic">
        <h1 className="stock-topic-title">「{activeTopicText}」</h1>
      </header>

      {/* 2. 卵インジケーター（assignedPostsの件数に応じて動的に生成） */}
      <div className="egg-indicator-bar">
        {assignedPosts.map((_, index) => {
          const isActive = index <= currentIndex;
          return (
            <div
              key={index}
              className={`egg-wrapper ${isActive ? 'active' : 'inactive'}`}
            >
              <img
                src="/images/contents/egg.png"
                alt={`卵 ${index + 1}`}
                className="egg-image"
              />
            </div>
          );
        })}
      </div>

      {/* 3. 卵背景の回答表示（post_contentを参照） */}
      <main className="egg-answer-container">
        <div className="egg-background-wrapper">
          <img
            src="/images/contents/answer-egg.png"
            alt="回答背景の卵"
            className="egg-background-image"
          />
          <div className="egg-answer-content">
            <p className="answer-text">{currentPost?.post_content}</p>
          </div>
        </div>
      </main>

      {/* 4. 4択リアクションボタン */}
      <footer className="reaction-buttons-row">
        {currentReactions.map((option, idx) => (
          <button
            key={option.id ?? idx}
            type="button"
            className={`reaction-btn ${option.colorClass}`}
            disabled={isSubmitting}
            onClick={() => handleSelectReaction(option.id, idx)}
          >
            <span className="reaction-emoji">{option.emoji}</span>
            <span className="reaction-label">{option.label}</span>
          </button>
        ))}
      </footer>
    </div>
  );
}