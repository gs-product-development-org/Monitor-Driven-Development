'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useSync } from '@/components/realtime/SyncContainer';
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

  // SyncContainer のインターフェースに合わせて正確に分割代入
  const { isTeacher, classId, isLoading: isSyncLoading, updateSessionPhase
   } = useSync();

  const [selectedGenre, setSelectedGenre] = useState<string>('お題を読み込み中...');
  const [answers, setAnswers] = useState<AnswerItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 1. class_sessions から最新セッションのお題と回答一覧を取得
  const fetchTopicAndAnswers = useCallback(async (cId: number) => {
    try {
      setLoading(true);

      // (A) class_sessions から該当クラスの最新セッションとお題情報を取得
      const { data: sessionData, error: sessionError } = await supabase
        .from('class_sessions')
        .select(`
          session_id,
          topic_id,
          topics (
            topic_id,
            topic_content
          )
        `)
        .eq('class_id', cId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sessionError) {
        console.error('セッション取得エラー:', sessionError.message);
        setSelectedGenre('お題の取得に失敗しました');
        setLoading(false);
        return;
      }

      if (!sessionData || !sessionData.topics) {
        setSelectedGenre('お題が登録されていません');
        setAnswers([]);
        setLoading(false);
        return;
      }

      // SupabaseのJOIN結果（配列またはオブジェクト）のパース処理
      const fetchedTopic = Array.isArray(sessionData.topics)
        ? sessionData.topics[0]
        : sessionData.topics;

      if (!fetchedTopic) {
        setSelectedGenre('お題が登録されていません');
        setAnswers([]);
        setLoading(false);
        return;
      }

      // お題文をセット
      setSelectedGenre(fetchedTopic.topic_content || 'お題が設定されていません');

      // (B) 取得した topic_id を使って RPC `get_allposts` を実行
      const { data: postsData, error: postsError } = await supabase.rpc('get_allposts', {
        p_topic_id: fetchedTopic.topic_id,
      });

      if (postsError) {
        console.error('投稿取得エラー:', postsError.message);
        setAnswers([]);
      } else if (postsData) {
        setAnswers(postsData as AnswerItem[]);
      }
    } catch (err) {
      console.error('処理エラー:', err);
      setSelectedGenre('エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. SyncContainer のローディング完了後にデータを取得
  useEffect(() => {
    if (!isSyncLoading) {
      if (classId) {
        fetchTopicAndAnswers(classId);
      } else {
        setSelectedGenre('所属クラスの情報が見つかりません');
        setLoading(false);
      }
    }
  }, [classId, isSyncLoading, fetchTopicAndAnswers]);

  const POSTS_PER_ROW = 3;
  const totalRows = Math.ceil(answers.length / POSTS_PER_ROW);

 
  const handleGoToGacha = async () => {
    // ★ 3. phase を 'ANSWERING' に更新
      await updateSessionPhase('GACHA');
  };
  

  // 全体ローディングフラグ
  const pageLoading = isSyncLoading || loading;

  return (
    <div className="answers-container">
      {/* 画面中央上部: お題表示エリア */}
      <header className="topic-header-wrapper">
        <div className="stock-main-topic">
          <h1 className="stock-topic-title">
            {pageLoading ? 'お題を読み込み中...' : selectedGenre}
          </h1>
        </div>
      </header>

      {/* スクロール可能なメインエリア */}
      <main className="answers-scroll-area">
        {pageLoading ? (
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

      {/* 教師の場合（isTeacher === true）のみガチャボタンを表示 */}
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
