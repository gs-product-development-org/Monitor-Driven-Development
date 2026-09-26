'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase'; // ご自身の Supabase クライアント
import './all-posts.css';

const EGG_IMAGE_PATH = '/images/contents/answer-egg.png';

interface AnswerItem {
  post_id: number;
  topic_id: number;
  post_content: string;
  created_at: string;
  count_r1: number;
  count_r2: number;
  count_r3: number;
  count_r4: number;
}

export default function AnswersListPage() {
  const router = useRouter();

  const [selectedGenre, setSelectedGenre] = useState<string>('お題を読み込み中...');
  const [answers, setAnswers] = useState<AnswerItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 教師判定用の State
  const [isTeacher, setIsTeacher] = useState<boolean>(false);

  useEffect(() => {
    const fetchTopicAndAnswers = async () => {
      try {
        setLoading(true);

        // 1. セッションストレージからユーザー情報を取り出す
        const savedUser = sessionStorage.getItem('user_info');
        if (!savedUser) {
          setSelectedGenre('ログイン情報が見つかりません');
          setLoading(false);
          return;
        }

        const parsedUser = JSON.parse(savedUser);

        // 教師フラグの判定
        if (parsedUser?.role === 'teacher') {
          setIsTeacher(true);
        }

        // クラスID（またはルームIDなど）の取得
        const currentClassId = parsedUser?.class_id || parsedUser?.room_id;

        if (!currentClassId) {
          setSelectedGenre('所属クラスの情報が見つかりません');
          setLoading(false);
          return;
        }

        // 2. 自分のクラスの最新のお題を取得（is_active 判定は不要）
        const { data: topicData, error: topicError } = await supabase
          .from('topics') 
          .select('topic_id, topic_content')
          .eq('class_id', currentClassId)              // 自分のクラスで絞り込み
          .order('created_at', { ascending: false })   // 最新のお題を取得
          .limit(1)
          .maybeSingle();

        if (topicError) {
          console.error('お題の取得エラー:', topicError.message);
          setSelectedGenre('お題の取得に失敗しました');
          setLoading(false);
          return;
        }

        if (!topicData) {
          setSelectedGenre('お題が登録されていません');
          setLoading(false);
          return;
        }

        // お題文をセット
        setSelectedGenre(topicData.topic_content);

        // 3. お題ID（topic_id）を使って RPC `get_allPosts` を呼び出す
        // ※ SQL関数内の WHERE p.is_posted = TRUE により、公開済みの投稿のみが返されます
        const { data: postsData, error: postsError } = await supabase.rpc('get_allposts', {
          p_topic_id: topicData.topic_id,
        });

        if (postsError) {
          console.error('投稿取得エラー:', postsError.message);
        } else if (postsData) {
          setAnswers(postsData as AnswerItem[]);
        }
      } catch (err) {
        console.error('処理エラー:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopicAndAnswers();
  }, []);

  const POSTS_PER_ROW = 3;
  const totalRows = Math.ceil(answers.length / POSTS_PER_ROW);

  const handleGoToGacha = () => {
    router.push('/gacha');
  };

  return (
    <div className="answers-container">
      {/* 画面中央上部: お題表示エリア */}
      <header className="topic-header-wrapper">
        <div className="stock-main-topic">
          <h1 className="stock-topic-title">{selectedGenre}</h1>
        </div>
      </header>

      {/* スクロール可能なメインエリア */}
      <main className="answers-scroll-area">
        {loading ? (
          <div style={{ textAlign: 'center', color: '#ffffff', fontSize: '24px', marginTop: '100px' }}>
            投稿データを読み込んでいます...
          </div>
        ) : answers.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#ffffff', fontSize: '24px', marginTop: '100px' }}>
            まだ公開されている投稿がありません。
          </div>
        ) : (
          <div className="answers-egg-grid">
            {Array.from({ length: totalRows }).map((_, rowIndex) => {
              const isOffsetRow = rowIndex % 2 === 1;

              const rowAnswers = answers.slice(
                rowIndex * POSTS_PER_ROW,
                (rowIndex + 1) * POSTS_PER_ROW
              );

              return (
                <div
                  key={`row-${rowIndex}`}
                  className={`egg-row ${isOffsetRow ? 'offset-row' : ''}`}
                >
                  {isOffsetRow && (
                    <div className="egg-card-wrapper dummy-half-egg">
                      <img src={EGG_IMAGE_PATH} alt="背景卵" className="egg-bg-image" />
                    </div>
                  )}

                  {rowAnswers.map((answer) => (
                    <div key={answer.post_id} className="egg-card-wrapper">
                      <img src={EGG_IMAGE_PATH} alt="背景卵" className="egg-bg-image" />
                      <div className="egg-content-overlay">
                        <p className="egg-answer-text">{answer.post_content}</p>
                      </div>
                    </div>
                  ))}

                  {!isOffsetRow && (
                    <div className="egg-card-wrapper dummy-half-egg">
                      <img src={EGG_IMAGE_PATH} alt="背景卵" className="egg-bg-image" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 教師の場合のみガチャボタンを表示 */}
      {isTeacher && (
        <div className="teacher-gacha-button-wrapper">
          <button onClick={handleGoToGacha} className="gacha-action-button">
            ガチャ画面へ
          </button>
        </div>
      )}
    </div>
  );
}