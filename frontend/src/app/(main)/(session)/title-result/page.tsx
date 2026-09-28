'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useSync } from '@/components/realtime/SyncContainer';

// 共通型・定数のインポート
import { Genre, GENRE_ID_MAP, REACTION_SETS, ReactionOption } from '@/types/reaction';

import './title-result.css';

type ReactionItem = {
  id: string;
  name: string;
  count: number;
  color: string;
};

interface TitleData {
  id: number;
  name: string;
  description: string;
  characterImage: string;
}

interface GenreTitleItem {
  genre_id: number;
  title_id: number;
  title_name: string;
}

// 4系統のリアクション分類に対応するグラフ表示カラー
// [1: 感嘆系(黄), 2: 共感系(橙), 3: 称賛系(青), 4: 交流系(緑)]
const REACTION_COLORS = ['#f59e0b', '#f97316', '#3b82f6', '#10b981'];

export default function ResultPage() {
  const router = useRouter();

  // 1. SyncContainer から userId, classId, isLoading を取得
  const { userId, classId, isLoading: isSyncLoading } = useSync();

  // ローディング状態
  const [loading, setLoading] = useState<boolean>(true);

  // DB（update_title）から取得した称号データ
  const [titleData, setTitleData] = useState<TitleData | null>(null);

  // DB（update_title）から取得したリアクション集計数
  const [reactions, setReactions] = useState<ReactionItem[]>([]);

  // 非公開時に get_initial_titles から取得するジャンル内称号一覧
  const [genreTitles, setGenreTitles] = useState<GenreTitleItem[]>([]);

  // DBの投稿データから判定した非公開フラグ（is_posted が false または 未投稿なら true）
  const [isPrivate, setIsPrivate] = useState<boolean>(false);

  // 2. メインデータ取得処理
  const fetchTitleAndReactions = useCallback(
    async (currentUserId: number, currentClassId: number) => {
      try {
        setLoading(true);

        // (A) class_sessions から現在の最新セッションと対象お題（topic_id, genre_id）を取得
        const { data: sessionData, error: sessionError } = await supabase
          .from('class_sessions')
          .select(`
            session_id,
            topic_id,
            topics (
              topic_id,
              genre_id
            )
          `)
          .eq('class_id', currentClassId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (sessionError) {
          console.error('セッション情報取得エラー:', sessionError.message);
        }

        const currentTopic = Array.isArray(sessionData?.topics)
          ? sessionData?.topics[0]
          : sessionData?.topics;

        const topicId = currentTopic?.topic_id ?? null;
        const rawGenreId = currentTopic?.genre_id ?? 1;

        // ジャンル名の判定 (GENRE_ID_MAP から取得)
        const currentGenre: Genre = GENRE_ID_MAP[rawGenreId] || '学校';

        // 該当ジャンルのリアクションオプション群を取得（フォールバック: '学校'）
        const targetReactionOptions: ReactionOption[] =
          REACTION_SETS[currentGenre] || REACTION_SETS['学校'];

        // (B) このユーザーの該当お題に対する投稿（is_posted）の状態を確認
        let isChestPrivate = true; // デフォルトは非公開扱い

        if (topicId) {
          const { data: postData, error: postError } = await supabase
            .from('posts')
            .select('is_posted')
            .eq('user_id', currentUserId)
            .eq('topic_id', topicId)
            .maybeSingle();

          if (!postError && postData) {
            // is_posted が true の場合のみ公開済みと判定
            isChestPrivate = !postData.is_posted;
          }
        }

        setIsPrivate(isChestPrivate);

        // (C) SQL関数 `update_title(p_user_id)` の呼び出し
        const { data: titleResult, error: titleError } = await supabase.rpc('update_title', {
          p_user_id: currentUserId,
        });

        if (titleError) {
          console.error('update_title の実行エラー:', titleError.message);
          setLoading(false);
          return;
        }

        // update_title の戻り値を取得
        const result = Array.isArray(titleResult) ? titleResult[0] : titleResult;

        if (result) {
          console.log('update_title の返り値:', result);

          const returnedTitleId = Number(result.title_id);

          // 称号データのセット
          setTitleData({
            id: Number.isNaN(returnedTitleId) ? 32 : returnedTitleId,
            name: result.title_name ?? '称号なし',
            description: result.title_detail ?? '',
            characterImage: '/images/animals/title-example.png',
          });

          // DBから取得した1〜4のリアクション件数とラベルをマッピング
          const reactionCounts = [
            Number(result.reaction_1_count ?? 0),
            Number(result.reaction_2_count ?? 0),
            Number(result.reaction_3_count ?? 0),
            Number(result.reaction_4_count ?? 0),
          ];

          const formattedReactions: ReactionItem[] = targetReactionOptions.map((opt, idx) => ({
            id: opt.id,
            name: `${opt.emoji} ${opt.label}`,
            count: reactionCounts[idx] ?? 0,
            color: REACTION_COLORS[idx] ?? '#3b82f6',
          }));

          setReactions(formattedReactions);
        }

        // (D) 非公開（isPrivate === true）と判定された場合、獲得可能なジャンル称号一覧を取得
        if (isChestPrivate) {
          console.log('非公開と判定されたため、ジャンル称号を取得します。ジャンルID:', rawGenreId);

          const { data: genreTitlesData, error: genreError } = await supabase.rpc(
            'get_initial_titles',
            { p_genre_id: rawGenreId }
          );

          if (!genreError && genreTitlesData) {
            setGenreTitles(genreTitlesData);
          } else if (genreError) {
            console.error('get_initial_titles 取得エラー:', genreError.message);
          }
        }
      } catch (err) {
        console.error('データ取得処理中に例外が発生しました:', err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // 3. SyncContainer の初期化完了後、データ取得をキック
  useEffect(() => {
    if (!isSyncLoading) {
      if (userId && classId) {
        fetchTitleAndReactions(userId, classId);
      } else {
        console.warn('ユーザー情報またはクラス情報が見つかりません。');
        setLoading(false);
      }
    }
  }, [userId, classId, isSyncLoading, fetchTitleAndReactions]);

  // 1件以上のリアクションがあるデータのみを抽出（グラフ用）
  const activeChartData = reactions.filter((item) => item.count > 0);

  const handleGoToAllAnswers = () => {
    router.push('/all-posts');
  };

  if (isSyncLoading || loading) {
    return (
      <div className="result-container">
        <div style={{ color: '#ffffff', fontSize: '24px', fontWeight: 'bold' }}>
          称号データを読み込み中...
        </div>
      </div>
    );
  }

  return (
    <div className="result-container">
      {/* メインコンテンツエリア */}
      <div className="result-main-content">
        {/* 左半分: 称号表示 */}
        <div className="result-left-section-clean">
          <div className="title-header-box">
            <h2 className="title-main-text">
              <span className="title-sub-text">あなたの称号は</span>
              <br />
              <span className="title-highlight-text">【{titleData?.name}】！</span>
            </h2>
          </div>

          <div className="title-image-wrapper">
            <img
              src={titleData?.characterImage}
              alt={titleData?.name || '称号画像'}
              className="title-character-image"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
                const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div className="title-image-fallback" style={{ display: 'none' }}>
              <img
                src="/images/animals/title-example.png"
                alt="称号フォールバック画像"
                className="fallback-image"
              />
            </div>
          </div>

          <div className="title-description-box">
            <p className="description-text">{titleData?.description}</p>
          </div>
        </div>

        {/* 右エリア: 白い枠（グラフ OR ジャンル称号紹介） ＋ 下部ボタン */}
        <div className="result-right-section">
          <div className="chart-card">
            {isPrivate ? (
              /* 非公開（posts.is_posted === false または 未投稿）の場合 */
              <div className="genre-titles-container">
                <h3 className="chart-title">公開するとこんな称号がもらえるよ！</h3>
                <p className="genre-titles-subtext">
                  今回のお題ジャンルで獲得できる称号の一部をご紹介します。
                </p>
                <div className="genre-title-grid">
                  {genreTitles.map((item) => (
                    <div key={item.title_id} className="genre-title-card">
                      <span className="genre-title-name">【{item.title_name}】</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* 通常（公開済み）の場合 */
              <>
                <h3 className="chart-title">リアクションの内訳</h3>

                {activeChartData.length > 0 ? (
                  <div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={activeChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={0}
                          outerRadius={100}
                          paddingAngle={0}
                          dataKey="count"
                          nameKey="name"
                          label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {activeChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={() => ['', '']} labelFormatter={(name) => `${name}`} />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* 凡例 */}
                    <div className="chart-legend-list">
                      {reactions.map((item) => (
                        <div key={item.id} className="legend-item">
                          <span
                            className="legend-color-dot"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="legend-label">
                            {item.name} ({item.count})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="no-reactions-box">まだリアクションがありません</div>
                )}
              </>
            )}
          </div>

          <div className="right-section-footer">
            <Button onClick={handleGoToAllAnswers} className="go-answers-button">
              みんなの回答へ
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}