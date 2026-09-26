'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/stores/useUserStore';

// 共通型・定数のインポート
import { Genre, GENRE_ID_MAP, REACTION_SETS, ReactionOption } from '@/types/reaction';

import './title-result.css';

// sessionStorage 保存用キー名定数
const LAST_POST_ACTION_KEY = 'last_post_action';
const CURRENT_WORK_TOPIC_KEY = 'current_work_topic';

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

  // Zustand ストアからユーザー情報を取得
  const storeUser = useUserStore((state) => state.user);

  // ローディング状態
  const [loading, setLoading] = useState<boolean>(true);

  // DB（update_title）から取得した称号データ
  const [titleData, setTitleData] = useState<TitleData | null>(null);

  // DB（update_title）から取得したリアクション集計数
  const [reactions, setReactions] = useState<ReactionItem[]>([]);

  // 非公開時に get_initial_titles から取得するジャンル内称号一覧
  const [genreTitles, setGenreTitles] = useState<GenreTitleItem[]>([]);

  // sessionStorage から判定した非公開フラグ（'chest' なら true）
  const [isPrivate, setIsPrivate] = useState<boolean>(false);

  useEffect(() => {
    async function fetchTitleAndReactions() {
      try {
        setLoading(true);

        // 0-1. sessionStorage から非公開（'chest'）かどうかを判定
        const lastAction = sessionStorage.getItem(LAST_POST_ACTION_KEY);
        const isChestAction = lastAction === 'chest';
        setIsPrivate(isChestAction);

        // 0-2. sessionStorage から今回のお題情報・ジャンルを取得
        let currentGenre: Genre = '学校';
        const topicStorage = sessionStorage.getItem(CURRENT_WORK_TOPIC_KEY);

        if (topicStorage) {
          try {
            const parsedTopic = JSON.parse(topicStorage);
            const rawGenreId = Number(parsedTopic?.genre_id);
            if (!isNaN(rawGenreId) && GENRE_ID_MAP[rawGenreId]) {
              currentGenre = GENRE_ID_MAP[rawGenreId];
            } else if (parsedTopic?.genre_name && REACTION_SETS[parsedTopic.genre_name as Genre]) {
              currentGenre = parsedTopic.genre_name as Genre;
            }
          } catch (e) {
            console.error('current_work_topic のパースに失敗しました:', e);
          }
        }

        // 該当ジャンルのリアクションオプション群を取得（存在しない場合は '学校' をフォールバック）
        const targetReactionOptions: ReactionOption[] =
          REACTION_SETS[currentGenre] || REACTION_SETS['学校'];

        // 1. sessionStorage（または Zustand）からユーザー情報を取得
        let userId: number | null = storeUser?.user_id ? Number(storeUser.user_id) : null;

        if (!userId) {
          const sessionData = sessionStorage.getItem('user_info');
          if (sessionData) {
            try {
              const parsedUser = JSON.parse(sessionData);
              if (parsedUser.user_id !== undefined && parsedUser.user_id !== null) {
                userId = Number(parsedUser.user_id);
              }
            } catch (e) {
              console.error('sessionStorage のパースに失敗しました:', e);
            }
          }
        }

        // ユーザー情報がない場合はログイン画面へリダイレクト
        if (!userId) {
          console.warn('ユーザー情報が見つかりません。ログイン画面へ遷移します。');
          router.push('/login');
          return;
        }

        // 2. SQL関数 `update_title(p_user_id)` の呼び出し
        const { data: titleResult, error: titleError } = await supabase.rpc('update_title', {
          p_user_id: userId,
        });

        if (titleError) {
          console.error('update_title の実行エラー:', titleError);
          setLoading(false);
          return;
        }

        // update_title の戻り値（テーブル形式の1行目を取得）
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

          // DBから取得した1〜4のリアクション件数と、ジャンル対応するラベル・絵文字・カラーをマッピング
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

          // セッションストレージで非公開（isPrivate === true）と判定された場合のみジャンルの称号一覧を取得
          if (isChestAction) {
            console.log('非公開と判定されたため、ジャンル称号を取得します');

            const { data: genreData } = await supabase
              .from('posts')
              .select('topics(genre_id)')
              .eq('user_id', userId)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            const genreId = (genreData?.topics as any)?.genre_id ?? 1;

            const { data: genreTitlesData, error: genreError } = await supabase.rpc(
              'get_initial_titles',
              { p_genre_id: genreId }
            );

            if (!genreError && genreTitlesData) {
              setGenreTitles(genreTitlesData);
            }
          }
        }
      } catch (err) {
        console.error('データ取得処理中に例外が発生しました:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchTitleAndReactions();
  }, [router, storeUser]);

  // 1件以上のリアクションがあるデータのみを抽出（グラフ用）
  const activeChartData = reactions.filter((item) => item.count > 0);

  const handleGoToAllAnswers = () => {
    router.push('/all-posts');
  };

  if (loading) {
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
              /* 非公開（sessionStorage: last_post_action = 'chest'）の場合 */
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
              /* 通常（公開）の場合 */
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