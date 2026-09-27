'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { usePostDistribution } from '@/hooks/usePostDistribution'; // フックのパスは環境に合わせて調整してください

// types フォルダから型とマッピング定数をインポート
import { Genre, GENRE_ID_MAP, REACTION_SETS, ReactionOption } from '@/types/reaction';

import './anonymous-reveal.css';

// sessionStorage 保存用キー名定数
const CURRENT_WORK_TOPIC_KEY = 'current_work_topic';

interface AnonymousRevealPageProps {
  genre?: Genre;
  topicText?: string;
  classId?: number;
  currentUserId?: number;
}

export default function AnonymousRevealPage({
  genre,
  topicText = '今日の授業で一番なるほどと思ったことは？',
  classId: propsClassId,
  currentUserId: propsUserId,
}: AnonymousRevealPageProps) {
  const router = useRouter();

  // ------------------------------------------------------------
  // 1. クラスID・ユーザーID・お題情報の取得（PropsまたはsessionStorageより）
  // ------------------------------------------------------------
  const [classId, setClassId] = useState<number | null>(propsClassId ?? null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(propsUserId ?? null);
  const [topicId, setTopicId] = useState<number | null>(null);
  const [activeTopicText, setActiveTopicText] = useState<string>(topicText);
  const [activeGenre, setActiveGenre] = useState<Genre>(genre || '学校');

  useEffect(() => {
    // 1. current_work_topic からお題情報とクラスIDを取得
    const topicStorage = sessionStorage.getItem(CURRENT_WORK_TOPIC_KEY);
    if (topicStorage) {
      try {
        const parsedTopic = JSON.parse(topicStorage);

        if (parsedTopic?.topic_content) setActiveTopicText(parsedTopic.topic_content);
        if (!propsClassId && parsedTopic?.class_id) setClassId(Number(parsedTopic.class_id));
        if (parsedTopic?.topic_id) setTopicId(Number(parsedTopic.topic_id));

        // ジャンルの特定
        if (!genre) {
          const rawGenreId = Number(parsedTopic?.genre_id);
          if (!isNaN(rawGenreId) && GENRE_ID_MAP[rawGenreId]) {
            setActiveGenre(GENRE_ID_MAP[rawGenreId]);
          } else if (parsedTopic?.genre_name && REACTION_SETS[parsedTopic.genre_name as Genre]) {
            setActiveGenre(parsedTopic.genre_name as Genre);
          }
        }
      } catch (e) {
        console.error('sessionStorage (current_work_topic) のパースに失敗しました:', e);
      }
    }

    // 2. user_info からログイン中のユーザーIDを取得
    if (!propsUserId) {
      const userInfoStorage = sessionStorage.getItem('user_info');
      if (userInfoStorage) {
        try {
          const parsedUser = JSON.parse(userInfoStorage);
          // user_info 内のIDのキー名に合わせて調整してください（例: user_id や id など）
          const fetchedUserId = parsedUser?.user_id ?? parsedUser?.id;
          if (fetchedUserId) {
            setCurrentUserId(Number(fetchedUserId));
          }
        } catch (e) {
          console.error('sessionStorage (user_info) のパースに失敗しました:', e);
        }
      }
    }
  }, [genre, propsClassId, propsUserId]);

  // ------------------------------------------------------------
  // 2. 配布フックから投稿データの取得
  // ------------------------------------------------------------
  const { assignedPosts, loading, error } = usePostDistribution(classId, currentUserId, topicId);

  // ▼ ここにログを追加して、ブラウザのコンソールを確認してください
  console.log('現在の値:', { classId, currentUserId, assignedPostsCount: assignedPosts.length, loading, error });

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const totalAnswers = assignedPosts.length;
  const currentPost = assignedPosts[currentIndex];

  // リアクションボタン一覧の取得
  const currentReactions: ReactionOption[] =
    REACTION_SETS[activeGenre] || REACTION_SETS['学校'];

  // ------------------------------------------------------------
  // 3. リアクション選択時の処理（DB保存 ＆ 次の投稿へ遷移）
  // ------------------------------------------------------------
  const handleSelectReaction = async (reactionId: string | number, index: number) => {
    if (!currentPost || !currentUserId || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // 1〜4 の数値(stamp_type)を確実に決定する
      let stampTypeNumber = 1;

      // パターンA: 渡された reactionId が数値または数値形式の文字列の場合
      const parsedId = Number(reactionId);
      if (!isNaN(parsedId) && parsedId >= 1 && parsedId <= 4) {
        stampTypeNumber = parsedId;
      } 
      // パターンB: 配列のインデックス (0〜3) から 1〜4 に変換する場合
      else if (typeof index === 'number' && index >= 0 && index <= 3) {
        stampTypeNumber = index + 1;
      }
      // パターンC: 文字列IDに対するフォールバックマッピング
      else {
        const reactionMap: Record<string, number> = {
          '1': 1, '2': 2, '3': 3, '4': 4,
          'reaction_1': 1, 'reaction_2': 2, 'reaction_3': 3, 'reaction_4': 4,
          'r1': 1, 'r2': 2, 'r3': 3, 'r4': 4,
          'like': 1, 'heart': 2, 'smile': 3, 'surprised': 4,
        };
        stampTypeNumber = reactionMap[String(reactionId)] || 1;
      }

      console.log('【デバッグ】選択されたリアクション:', {
        rawReactionId: reactionId,
        typeOfRaw: typeof reactionId,
        assignedStampType: stampTypeNumber
      });

      // 1. セッションストレージから直接 genre_id を取得
      let genreId = 1;
      const topicStorage = sessionStorage.getItem(CURRENT_WORK_TOPIC_KEY);

      if (topicStorage) {
        try {
          const parsedTopic = JSON.parse(topicStorage);
          if (parsedTopic?.genre_id) {
            genreId = Number(parsedTopic.genre_id);
          }
        } catch (e) {
          console.error('genre_id の抽出に失敗しました:', e);
        }
      }

      // 2. RPC関数 'add_reactions_bulk' を実行
      const { data, error: rpcError } = await supabase.rpc('add_reactions_bulk', {
        p_reactions: [
          {
            post_id: currentPost.post_id,
            genre_id: genreId,
            stamp_type: stampTypeNumber, // 必ず 1, 2, 3, 4 のいずれかの数値が入る
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
  if (loading) {
    return (
      <div className="reveal-container">
        <p style={{ textAlign: 'center', marginTop: '40vh' }}>投稿を読み込んでいます...</p>
      </div>
    );
  }

  // エラー時・投稿が1件もない場合
  if (error || (assignedPosts.length === 0 && !loading)) {
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