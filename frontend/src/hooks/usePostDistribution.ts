'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const MAX_POSTS_PER_USER = 10;
const TARGET_REACTIONS_PER_POST = 10;

type User = {
  user_id: number;
  class_id: number;
  user_number: number;
  role: boolean;
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
 * 配列を決定論的に並び替えるための簡易ハッシュ
 *
 * Math.random() を使うと、
 * ブラウザ・実行タイミングによって結果が変わる。
 *
 * そこで、同じ classId / userId / postId から
 * 常に同じ値を生成する。
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
 *
 * 同じ配列・同じseedなら、
 * 毎回同じ結果になる。
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
      i++, this.iter[v]++
    ) {
      const edge = this.graph[v][i];

      if (
        edge.cap > 0 &&
        this.level[v] < this.level[edge.to]
      ) {
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
    }

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

  getGraph(): Edge[][] {
    return this.graph;
  }
}

/**
 * ------------------------------------------------------------
 * 配布数計算
 * ------------------------------------------------------------
 */

/**
 * 1人あたり何件配布するかを計算する。
 * ただし最大10件まで。
 */
function calculatePostsPerUser(
  userCount: number,
  postCount: number,
  maxEligiblePosts: number
): number {
  if (
    userCount <= 0 ||
    postCount <= 0
  ) {
    return 0;
  }

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
 * クラス全体の配布処理
 * ------------------------------------------------------------
 */

function createDistribution(
  users: User[],
  posts: Post[],
  classId: number
): Distribution {
  const distribution: Distribution = {};

  /**
   * 全ユーザーについて、
   * 最初は空の配布リストを作る。
   */
  users.forEach((user) => {
    distribution[user.user_id] = [];
  });

  if (
    users.length === 0 ||
    posts.length === 0
  ) {
    return distribution;
  }

  /**
   * ----------------------------------------------------------
   * 各ユーザーが受け取れる投稿数の最大値を確認
   * ----------------------------------------------------------
   *
   * 自分の投稿があるユーザー：
   *
   *   投稿数 - 1
   *
   * 自分の投稿がないユーザー：
   *
   *   投稿数
   *
   * 全員が同じ件数を受け取る必要があるため、
   * 最も制約の厳しいユーザーに合わせる。
   */
  let maxEligiblePosts = posts.length;

  for (const user of users) {
    const hasOwnPost = posts.some(
      (post) =>
        post.user_id === user.user_id
    );

    const eligibleCount = hasOwnPost
      ? posts.length - 1
      : posts.length;

    maxEligiblePosts = Math.min(
      maxEligiblePosts,
      eligibleCount
    );
  }

  if (maxEligiblePosts <= 0) {
    return distribution;
  }

  /**
   * まず1人あたりの配布数を決定。
   */
  let postsPerUser =
    calculatePostsPerUser(
      users.length,
      posts.length,
      maxEligiblePosts
    );

  if (postsPerUser <= 0) {
    return distribution;
  }

  /**
   * ----------------------------------------------------------
   * 実際に割り当て可能か確認
   * ----------------------------------------------------------
   *
   * 特殊な人数・投稿数の組み合わせでは、
   * 計算上の件数をそのまま割り当てられない
   * 場合がある。
   *
   * その場合は、
   *
   *   K=10
   *   ↓
   *   K=9
   *   ↓
   *   K=8
   *
   * のように1件ずつ減らして再試行する。
   */
  while (postsPerUser > 0) {
    const result =
      tryCreateDistribution(
        users,
        posts,
        classId,
        postsPerUser
      );

    if (result !== null) {
      return result;
    }

    postsPerUser--;
  }

  return distribution;
}

/**
 * ------------------------------------------------------------
 * 最大フローを使った実際の割り当て
 * ------------------------------------------------------------
 */

function tryCreateDistribution(
  users: User[],
  posts: Post[],
  classId: number,
  postsPerUser: number
): Distribution | null {
  const userCount = users.length;
  const postCount = posts.length;

  const totalAssignments =
    userCount * postsPerUser;

  /**
   * ----------------------------------------------------------
   * 投稿ごとの目標リアクション数
   * ----------------------------------------------------------
   *
   * 例えば、
   *
   *   40人 × 7件 = 280
   *   28投稿
   *
   * なら、
   *
   *   280 / 28 = 10
   *
   * なので全投稿10リアクション。
   *
   * 一方、
   *
   *   40人 × 7件 = 280
   *   27投稿
   *
   * なら、
   *
   *   280 / 27
   *
   * なので、
   *
   *   10件の投稿
   *   11件の投稿
   *
   * に分ける。
   *
   * 最大値 - 最小値 = 1
   * となる。
   */
  const baseReactionCount =
    Math.floor(
      totalAssignments / postCount
    );

  const extraReactionCount =
    totalAssignments % postCount;

  /**
   * 投稿を決定論的にシャッフル。
   *
   * extraReactionCount 件だけ、
   * base + 1 件のリアクションを割り当てる。
   */
  const shuffledPosts =
    seededShuffle(
      posts,
      `class-${classId}-posts-${postsPerUser}`
    );

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
   * Flow Graph
   * ----------------------------------------------------------
   *
   * source
   *   ↓
   * users
   *   ↓
   * posts
   *   ↓
   * sink
   *
   * source → user
   *     capacity = postsPerUser
   *
   * user → post
   *     capacity = 1
   *
   * post → sink
   *     capacity = targetReactionCount
   *
   * ただし、
   *
   * user自身の投稿
   *
   * にはエッジを作らない。
   */

  const SOURCE = 0;

  const USER_START = 1;

  const POST_START =
    USER_START + userCount;

  const SINK =
    POST_START + postCount;

  const nodeCount = SINK + 1;

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
   * 後でflowが流れたエッジを調べて、
   * 配布結果を作る。
   */
  const assignmentEdges: {
    userId: number;
    postId: number;
    edge: Edge;
  }[] = [];

  /**
   * ユーザーを決定論的にシャッフル。
   */
  const shuffledUsers =
    seededShuffle(
      users,
      `class-${classId}-users-${postsPerUser}`
    );

  /**
   * 投稿も決定論的にシャッフル。
   */
  const orderedPosts =
    seededShuffle(
      posts,
      `class-${classId}-edges-${postsPerUser}`
    );

  for (const user of shuffledUsers) {
    const userNode =
      userNodeMap.get(
        user.user_id
      );

    if (userNode === undefined) {
      continue;
    }

    for (const post of orderedPosts) {
      /**
       * ------------------------------------------------------
       * 自分自身の投稿は除外
       * ------------------------------------------------------
       *
       * role=true / false に関係なく、
       * 「自分の投稿」は自分には配布しない。
       */
      if (
        post.user_id === user.user_id
      ) {
        continue;
      }

      const postNode =
        postNodeMap.get(
          post.post_id
        );

      if (postNode === undefined) {
        continue;
      }

      const edge =
        dinic.addEdge(
          userNode,
          postNode,
          1
        );

      assignmentEdges.push({
        userId: user.user_id,
        postId: post.post_id,
        edge,
      });
    }
  }

  /**
   * 最大フローを計算。
   */
  const flow =
    dinic.maxFlow(
      SOURCE,
      SINK
    );

  /**
   * 全員に予定件数を割り当てられなかった場合、
   * この postsPerUser では不可能。
   */
  if (
    flow !== totalAssignments
  ) {
    return null;
  }

  /**
   * ----------------------------------------------------------
   * 配布結果を作る
   * ----------------------------------------------------------
   *
   * 今回の試行専用に新しいDistributionを作る。
   */
  const distribution: Distribution =
    {};

  users.forEach((user) => {
    distribution[user.user_id] = [];
  });

  /**
   * capacity = 1 のエッジが
   * 0 になっていれば、
   * そのエッジに1単位のflowが流れている。
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
   * 念のため、
   * 全ユーザーが予定件数を受け取っているか確認。
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
      return null;
    }
  }

  return distribution;
}

/**
 * ------------------------------------------------------------
 * React Hook
 * ------------------------------------------------------------
 */

export function usePostDistribution(
  classId: number | null,
  currentUserId: number | null,  //class_idとuser_idを引数にして...
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
           * 2. 公開済み投稿を取得
           * --------------------------------------------------
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
           * 3. クラス全体の配布を計算
           * --------------------------------------------------
           */
          const result =
            createDistribution(
              safeUsers,
              safePosts,
              classId
            );

          if (cancelled) {
            return;
          }

          setDistribution(result);

          /**
           * --------------------------------------------------
           * 4. 現在ログインしているユーザーの配布だけ取得
           * --------------------------------------------------
           */
          const assignedPostIds =
            result[
              currentUserId
            ] ?? [];

          /**
           * post_id[] を
           * Post[] に変換する。
           */
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
    topicId
  ]);

  return {
    assignedPosts,
    distribution,
    loading,
    error,
  };
}
