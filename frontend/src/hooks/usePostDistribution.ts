'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const MAX_POSTS_PER_USER = 10;
const TARGET_REACTIONS_PER_POST = 10;

type User = {
  user_id: number;
  class_id: number;
  user_number: number;
  role: string;
};

type Post = {
  post_id: number;
  class_id: number;
  user_id: number;
  topic_id: number;
  post_content: string;
  created_at: string;
  is_posted: boolean;
};

type AssignedPost = Post;

type Distribution = {
  [userId: number]: number[];
};

/**
 * ------------------------------------------------------------
 * Utility
 * ------------------------------------------------------------
 */

/**
 * 文字列から決定論的なハッシュ値を作る。
 *
 * Math.random() は使わない。
 *
 * 同じ classId / topicId / 投稿・ユーザー情報なら、
 * どのブラウザでも同じ結果になる。
 */
function hashString(value: string): number {
  let hash = 2166136261;

  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);

    hash +=
      (hash << 1) +
      (hash << 4) +
      (hash << 7) +
      (hash << 8) +
      (hash << 24);
  }

  return hash >>> 0;
}

/**
 * 決定論的シャッフル
 */
function seededShuffle<T>(
  array: T[],
  seed: string
): T[] {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const hash = hashString(`${seed}-${i}`);
    const j = hash % (i + 1);

    [result[i], result[j]] = [
      result[j],
      result[i],
    ];
  }

  return result;
}

/**
 * ------------------------------------------------------------
 * Dinic 最大フロー
 * ------------------------------------------------------------
 */

type Edge = {
  to: number;
  rev: number;
  cap: number;
};

class Dinic {
  private graph: Edge[][];
  private level: number[];
  private iter: number[];

  constructor(nodeCount: number) {
    this.graph = Array.from(
      { length: nodeCount },
      () => []
    );

    this.level = new Array(nodeCount);
    this.iter = new Array(nodeCount);
  }

  addEdge(
    from: number,
    to: number,
    cap: number
  ): Edge {
    const forward: Edge = {
      to,
      rev: this.graph[to].length,
      cap,
    };

    const backward: Edge = {
      to: from,
      rev: this.graph[from].length,
      cap: 0,
    };

    this.graph[from].push(forward);
    this.graph[to].push(backward);

    return forward;
  }

  private bfs(
    source: number,
    sink: number
  ): boolean {
    this.level.fill(-1);

    const queue: number[] = [];
    let head = 0;

    this.level[source] = 0;
    queue.push(source);

    while (head < queue.length) {
      const v = queue[head++];

      for (const edge of this.graph[v]) {
        if (
          edge.cap > 0 &&
          this.level[edge.to] < 0
        ) {
          this.level[edge.to] =
            this.level[v] + 1;

          queue.push(edge.to);
        }
      }
    }

    return this.level[sink] >= 0;
  }

  private dfs(
    v: number,
    sink: number,
    flow: number
  ): number {
    if (v === sink) {
      return flow;
    }

    for (
      let i = this.iter[v];
      i < this.graph[v].length;
      i++
    ) {
      this.iter[v] = i;

      const edge = this.graph[v][i];

      if (
        edge.cap <= 0 ||
        this.level[v] >= this.level[edge.to]
      ) {
        continue;
      }

      const d = this.dfs(
        edge.to,
        sink,
        Math.min(flow, edge.cap)
      );

      if (d > 0) {
        edge.cap -= d;

        const reverseEdge =
          this.graph[edge.to][edge.rev];

        reverseEdge.cap += d;

        return d;
      }
    }

    this.iter[v] =
      this.graph[v].length;

    return 0;
  }

  maxFlow(
    source: number,
    sink: number
  ): number {
    let flow = 0;

    const INF =
      Number.MAX_SAFE_INTEGER;

    while (
      this.bfs(source, sink)
    ) {
      this.iter.fill(0);

      while (true) {
        const f = this.dfs(
          source,
          sink,
          INF
        );

        if (f === 0) {
          break;
        }

        flow += f;
      }
    }

    return flow;
  }
}

/**
 * ------------------------------------------------------------
 * 配布数計算
 * ------------------------------------------------------------
 */

/**
 * 1人あたり何件配布するか決める。
 *
 * 条件：
 *
 * 1. 最大10件
 * 2. 自分の投稿を除外するため最大 posts.length - 1 件
 * 3. 可能な限り1投稿あたり10リアクションを目指す
 *
 * 例：
 *
 * 3人・3投稿
 *
 *   ceil(10 × 3 / 3) = 10
 *
 * ただし1人は自分の投稿を除いて
 * 最大2件しか選べない。
 *
 * → 2件
 *
 * 40人・28投稿
 *
 *   ceil(10 × 28 / 40)
 *   = 7
 *
 * → 7件
 */
function calculatePostsPerUser(
  userCount: number,
  postCount: number
): number {
  if (
    userCount <= 0 ||
    postCount <= 0
  ) {
    return 0;
  }

  /**
   * 各ユーザーは1投稿しか持たないため、
   * 自分以外の投稿は最大 postCount - 1 件。
   */
  const maxEligiblePosts =
    postCount - 1;

  if (maxEligiblePosts <= 0) {
    return 0;
  }

  /**
   * 1投稿あたり10リアクションを目標にする。
   */
  const calculated = Math.ceil(
    (TARGET_REACTIONS_PER_POST *
      postCount) /
      userCount
  );

  return Math.min(
    calculated,
    MAX_POSTS_PER_USER,
    maxEligiblePosts
  );
}

/**
 * ------------------------------------------------------------
 * 配布結果の検証
 * ------------------------------------------------------------
 */

function validateDistribution(
  users: User[],
  posts: Post[],
  distribution: Distribution,
  postsPerUser: number
): boolean {
  /**
   * ----------------------------------------------------------
   * 1. 各ユーザーの件数確認
   * ----------------------------------------------------------
   */
  for (const user of users) {
    const assigned =
      distribution[user.user_id] ?? [];

    if (
      assigned.length !== postsPerUser
    ) {
      console.error(
        '【配布検証失敗】ユーザーの配布数が不正',
        {
          userId: user.user_id,
          expected: postsPerUser,
          actual: assigned.length,
          assigned,
        }
      );

      return false;
    }

    /**
     * 自分の投稿が含まれていないか確認
     */
    const ownPostIds =
      posts
        .filter(
          (post) =>
            post.user_id === user.user_id
        )
        .map(
          (post) =>
            post.post_id
        );

    const hasOwnPost =
      assigned.some(
        (postId) =>
          ownPostIds.includes(postId)
      );

    if (hasOwnPost) {
      console.error(
        '【配布検証失敗】自分の投稿が含まれている',
        {
          userId: user.user_id,
          assigned,
          ownPostIds,
        }
      );

      return false;
    }
  }

  /**
   * ----------------------------------------------------------
   * 2. 各投稿のリアクション数確認
   * ----------------------------------------------------------
   */

  const reactionCounts =
    new Map<number, number>();

  posts.forEach((post) => {
    reactionCounts.set(
      post.post_id,
      0
    );
  });

  for (const userId of Object.keys(
    distribution
  )) {
    const assigned =
      distribution[
        Number(userId)
      ] ?? [];

    for (const postId of assigned) {
      reactionCounts.set(
        postId,
        (reactionCounts.get(
          postId
        ) ?? 0) + 1
      );
    }
  }

  const counts = Array.from(
    reactionCounts.values()
  );

  if (counts.length > 0) {
    const min =
      Math.min(...counts);

    const max =
      Math.max(...counts);

    /**
     * 投稿間の差は最大1
     */
    if (max - min > 1) {
      console.error(
        '【配布検証失敗】投稿間のリアクション数の差が2以上',
        {
          reactionCounts:
            Object.fromEntries(
              reactionCounts
            ),
          min,
          max,
        }
      );

      return false;
    }
  }

  return true;
}

/**
 * ------------------------------------------------------------
 * クラス全体の配布
 * ------------------------------------------------------------
 */

function createDistribution(
  users: User[],
  posts: Post[],
  classId: number,
  topicId: number
): Distribution {
  const emptyDistribution: Distribution = {};

  users.forEach((user) => {
    emptyDistribution[user.user_id] = [];
  });

  if (
    users.length === 0 ||
    posts.length === 0
  ) {
    return emptyDistribution;
  }

  /**
   * ----------------------------------------------------------
   * 配布件数 K を決定
   * ----------------------------------------------------------
   */
  let postsPerUser =
    calculatePostsPerUser(
      users.length,
      posts.length
    );

  if (postsPerUser <= 0) {
    return emptyDistribution;
  }

  console.log(
    '【配布設定】',
    {
      classId,
      topicId,
      userCount: users.length,
      postCount: posts.length,
      postsPerUser,
      maxPostsPerUser:
        MAX_POSTS_PER_USER,
      targetReactionsPerPost:
        TARGET_REACTIONS_PER_POST,
    }
  );

  /**
   * ----------------------------------------------------------
   * K件配布可能か確認
   * ----------------------------------------------------------
   *
   * 万一、特殊な組み合わせでK件配布が不可能なら、
   * Kを1件ずつ減らして再試行する。
   */
  while (postsPerUser > 0) {
    const result =
      tryCreateDistribution(
        users,
        posts,
        classId,
        topicId,
        postsPerUser
      );

    if (result !== null) {
      const valid =
        validateDistribution(
          users,
          posts,
          result,
          postsPerUser
        );

      if (valid) {
        console.log(
          '【配布成功】',
          {
            postsPerUser,
            distribution:
              result,
          }
        );

        return result;
      }
    }

    console.warn(
      '【配布再試行】',
      {
        failedPostsPerUser:
          postsPerUser,
      }
    );

    postsPerUser--;
  }

  console.error(
    '【配布失敗】有効な配布を作成できませんでした'
  );

  return emptyDistribution;
}

/**
 * ------------------------------------------------------------
 * 最大フローによる配布
 * ------------------------------------------------------------
 */

function tryCreateDistribution(
  users: User[],
  posts: Post[],
  classId: number,
  topicId: number,
  postsPerUser: number
): Distribution | null {
  const userCount =
    users.length;

  const postCount =
    posts.length;

  const totalAssignments =
    userCount * postsPerUser;

  /**
   * ----------------------------------------------------------
   * 投稿ごとの目標リアクション数
   * ----------------------------------------------------------
   *
   * 総配布数を投稿数で割る。
   *
   * 例：
   *
   * 3人 × 2件 = 6件
   * 3投稿
   *
   * → 2 / 2 / 2
   *
   * 例：
   *
   * 5人 × 2件 = 10件
   * 3投稿
   *
   * → 3 / 3 / 4
   *
   * 最大差は必ず1。
   */
  const baseReactionCount =
    Math.floor(
      totalAssignments /
        postCount
    );

  const extraReactionCount =
    totalAssignments %
    postCount;

  /**
   * 投稿を決定論的に並び替える。
   */
  const shuffledPosts =
    seededShuffle(
      posts,
      `class-${classId}-topic-${topicId}-targets-${postsPerUser}`
    );

  /**
   * post_id → 目標リアクション数
   */
  const targetReactionCounts =
    new Map<number, number>();

  shuffledPosts.forEach(
    (post, index) => {
      const target =
        index < extraReactionCount
          ? baseReactionCount + 1
          : baseReactionCount;

      targetReactionCounts.set(
        post.post_id,
        target
      );
    }
  );

  /**
   * ----------------------------------------------------------
   * Graph
   * ----------------------------------------------------------
   *
   * source
   *   ↓
   * user
   *   ↓
   * post
   *   ↓
   * sink
   *
   * source → user
   *   capacity = postsPerUser
   *
   * user → post
   *   capacity = 1
   *
   * post → sink
   *   capacity = targetReactionCount
   *
   * 自分の投稿には user → post のエッジを作らない。
   */

  const SOURCE = 0;

  const USER_START = 1;

  const POST_START =
    USER_START + userCount;

  const SINK =
    POST_START + postCount;

  const nodeCount =
    SINK + 1;

  const dinic =
    new Dinic(nodeCount);

  /**
   * user_id → graph node
   */
  const userNodeMap =
    new Map<number, number>();

  users.forEach(
    (user, index) => {
      const node =
        USER_START + index;

      userNodeMap.set(
        user.user_id,
        node
      );

      dinic.addEdge(
        SOURCE,
        node,
        postsPerUser
      );
    }
  );

  /**
   * post_id → graph node
   */
  const postNodeMap =
    new Map<number, number>();

  posts.forEach(
    (post, index) => {
      const node =
        POST_START + index;

      postNodeMap.set(
        post.post_id,
        node
      );

      const target =
        targetReactionCounts.get(
          post.post_id
        ) ?? 0;

      dinic.addEdge(
        node,
        SINK,
        target
      );
    }
  );

  /**
   * user → post のエッジを保存。
   *
   * 後でflowが流れたエッジを調べる。
   */
  const assignmentEdges: {
    userId: number;
    postId: number;
    edge: Edge;
  }[] = [];

  /**
   * ユーザーを決定論的に並び替える。
   */
  const shuffledUsers =
    seededShuffle(
      users,
      `class-${classId}-topic-${topicId}-users-${postsPerUser}`
    );

  /**
   * 投稿を決定論的に並び替える。
   */
  const orderedPosts =
    seededShuffle(
      posts,
      `class-${classId}-topic-${topicId}-edges-${postsPerUser}`
    );

  /**
   * user → post
   */
  for (const user of shuffledUsers) {
    const userNode =
      userNodeMap.get(
        user.user_id
      );

    if (
      userNode === undefined
    ) {
      continue;
    }

    for (const post of orderedPosts) {
      /**
       * 自分の投稿は除外。
       *
       * 先生・生徒というroleは関係なく、
       * user_idが同じなら除外する。
       */
      if (
        post.user_id ===
        user.user_id
      ) {
        continue;
      }

      const postNode =
        postNodeMap.get(
          post.post_id
        );

      if (
        postNode === undefined
      ) {
        continue;
      }

      const edge =
        dinic.addEdge(
          userNode,
          postNode,
          1
        );

      assignmentEdges.push({
        userId:
          user.user_id,
        postId:
          post.post_id,
        edge,
      });
    }
  }

  /**
   * ----------------------------------------------------------
   * 最大フロー実行
   * ----------------------------------------------------------
   */
  const flow =
    dinic.maxFlow(
      SOURCE,
      SINK
    );

  console.log(
    '【最大フロー結果】',
    {
      classId,
      topicId,
      postsPerUser,
      totalAssignments,
      flow,
      baseReactionCount,
      extraReactionCount,
      targetReactionCounts:
        Object.fromEntries(
          targetReactionCounts
        ),
    }
  );

  /**
   * 全員分を割り当てられなければ、
   * このKでは成立しない。
   */
  if (
    flow !== totalAssignments
  ) {
    return null;
  }

  /**
   * ----------------------------------------------------------
   * Flow → Distribution
   * ----------------------------------------------------------
   */

  const distribution: Distribution =
    {};

  users.forEach((user) => {
    distribution[user.user_id] = [];
  });

  /**
   * user → post の元容量は1。
   *
   * flowが1流れた場合、
   * forward edgeのcapacityは0になる。
   */
  for (
    const assignment
    of assignmentEdges
  ) {
    if (
      assignment.edge.cap === 0
    ) {
      distribution[
        assignment.userId
      ].push(
        assignment.postId
      );
    }
  }

  /**
   * ----------------------------------------------------------
   * ユーザーごとの件数を確認
   * ----------------------------------------------------------
   */

  for (const user of users) {
    const assigned =
      distribution[
        user.user_id
      ] ?? [];

    if (
      assigned.length !==
      postsPerUser
    ) {
      console.error(
        '【配布結果エラー】',
        {
          userId:
            user.user_id,
          expected:
            postsPerUser,
          actual:
            assigned.length,
          assigned,
        }
      );

      return null;
    }
  }

  /**
   * ----------------------------------------------------------
   * 投稿ごとのリアクション数
   * ----------------------------------------------------------
   */

  const actualReactionCounts =
    new Map<number, number>();

  posts.forEach((post) => {
    actualReactionCounts.set(
      post.post_id,
      0
    );
  });

  for (
    const userId of Object.keys(
      distribution
    )
  ) {
    const assigned =
      distribution[
        Number(userId)
      ] ?? [];

    for (
      const postId of assigned
    ) {
      actualReactionCounts.set(
        postId,
        (actualReactionCounts.get(
          postId
        ) ?? 0) + 1
      );
    }
  }

  console.log(
    '【実際の投稿別リアクション数】',
    Object.fromEntries(
      actualReactionCounts
    )
  );

  return distribution;
}

/**
 * ------------------------------------------------------------
 * React Hook
 * ------------------------------------------------------------
 */

export function usePostDistribution(
  classId: number | null,
  currentUserId: number | null,
  topicId: number | null
) {
  const [
    assignedPosts,
    setAssignedPosts,
  ] = useState<AssignedPost[]>([]);

  const [
    distribution,
    setDistribution,
  ] = useState<Distribution>({});

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  useEffect(() => {
    if (
      classId === null ||
      currentUserId === null ||
      topicId === null
    ) {
      setAssignedPosts([]);
      setDistribution({});
      return;
    }

    let cancelled = false;

    const fetchAndDistribute =
      async () => {
        setLoading(true);
        setError(null);

        try {
          /**
           * --------------------------------------------------
           * 1. クラス内の全ユーザーを取得
           * --------------------------------------------------
           *
           * 先生も生徒も取得する。
           *
           * roleによる除外は行わない。
           */
          const {
            data: users,
            error: usersError,
          } = await supabase
            .from('users')
            .select(
              'user_id, class_id, user_number, role'
            )
            .eq(
              'class_id',
              classId
            )
            .order(
              'user_number',
              {
                ascending: true,
              }
            );

          if (usersError) {
            throw usersError;
          }

          /**
           * --------------------------------------------------
           * 2. 現在のお題の全体公開投稿を取得
           * --------------------------------------------------
           *
           * is_posted = true
           *
           * の投稿をすべて取得する。
           *
           * 先生の投稿も含まれる。
           */
          const {
            data: posts,
            error: postsError,
          } = await supabase
            .from('posts')
            .select(`
              post_id,
              class_id,
              user_id,
              topic_id,
              post_content,
              created_at,
              is_posted
            `)
            .eq(
              'class_id',
              classId
            )
            .eq(
              'topic_id',
              topicId
            )
            .eq(
              'is_posted',
              true
            )
            .order(
              'created_at',
              {
                ascending: true,
              }
            );

          if (postsError) {
            throw postsError;
          }

          if (cancelled) {
            return;
          }

          const safeUsers =
            (users ?? []) as User[];

          const safePosts =
            (posts ?? []) as Post[];

          /**
           * --------------------------------------------------
           * デバッグ
           * --------------------------------------------------
           */
          console.log(
            '================================'
          );

          console.log(
            '【リアクション配布開始】'
          );

          console.log({
            classId,
            currentUserId,
            topicId,
            userCount:
              safeUsers.length,
            postCount:
              safePosts.length,
          });

          console.log(
            '【ユーザー一覧】',
            safeUsers
          );

          console.log(
            '【全体公開投稿一覧】',
            safePosts
          );

          /**
           * --------------------------------------------------
           * 3. クラス全体の配布を計算
           * --------------------------------------------------
           */
          const result =
            createDistribution(
              safeUsers,
              safePosts,
              classId,
              topicId
            );

          if (cancelled) {
            return;
          }

          setDistribution(
            result
          );

          /**
           * --------------------------------------------------
           * 4. 現在のユーザーに配布された投稿を取得
           * --------------------------------------------------
           */
          const assignedPostIds =
            result[
              currentUserId
            ] ?? [];

          const assigned =
            assignedPostIds
              .map((postId) =>
                safePosts.find(
                  (post) =>
                    post.post_id ===
                    postId
                )
              )
              .filter(
                (
                  post
                ): post is Post =>
                  post !== undefined
              );

          console.log(
            '【現在ユーザーへの配布】',
            {
              currentUserId,
              assignedPostIds,
              assignedCount:
                assigned.length,
              assigned,
            }
          );

          console.log(
            '================================'
          );

          setAssignedPosts(
            assigned
          );
        } catch (err) {
          console.error(
            '投稿配布処理に失敗しました:',
            err
          );

          if (!cancelled) {
            setError(
              err instanceof Error
                ? err.message
                : '投稿の配布に失敗しました'
            );

            setAssignedPosts([]);
            setDistribution({});
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };

    fetchAndDistribute();

    return () => {
      cancelled = true;
    };
  }, [
    classId,
    currentUserId,
    topicId,
  ]);

  return {
    assignedPosts,
    distribution,
    loading,
    error,
  };
}