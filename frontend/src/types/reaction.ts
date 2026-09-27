export type Genre = '学校' | '日常' | '好きなもの' | '雑談' | 'ユニーク';

// ジャンル名と genre_id のマッピング表
export const GENRE_MAP: Record<Genre, number> = {
  学校: 1,
  日常: 2,
  好きなもの: 3,
  雑談: 4,
  ユニーク: 5,
};

// genre_id から Genre 名への逆引きマッピング表
export const GENRE_ID_MAP: Record<number, Genre> = {
  1: '学校',
  2: '日常',
  3: '好きなもの',
  4: '雑談',
  5: 'ユニーク',
};

// ジャンル一覧の配列
export const GENRES: Genre[] = ['学校', '日常', '好きなもの', '雑談', 'ユニーク'];

export interface ReactionOption {
  id: string;
  label: string;
  emoji: string;
  colorClass: string;
}

// 5種類のジャンルごとに異なる4つのリアクションセット
// [1: 感嘆系(黄/btn-exclamation), 2: 共感系(橙/btn-empathy), 3: 称賛系(青/btn-praise), 4: 交流系(緑/btn-interaction)]
export const REACTION_SETS: Record<Genre, ReactionOption[]> = {
  学校: [
    { id: 'oh_my_god', label: 'オーマイガー', emoji: '😱', colorClass: 'btn-exclamation' },
    { id: 'sore_omotta', label: 'それ思った！', emoji: '💡', colorClass: 'btn-empathy' },
    { id: 'tensai', label: '天才！', emoji: '✨', colorClass: 'btn-praise' },
    { id: 'kuwashiku', label: '詳しく教えて！', emoji: '💬', colorClass: 'btn-interaction' },
  ],
  日常: [
    { id: 'nanda_sore', label: 'なんだそれ！', emoji: '😲', colorClass: 'btn-exclamation' },
    { id: 'issho_dane', label: '一緒だね！', emoji: '🤝', colorClass: 'btn-empathy' },
    { id: 'iina', label: 'いいな！', emoji: '👍', colorClass: 'btn-praise' },
    { id: 'asobitai', label: '遊びたい！', emoji: '🙌', colorClass: 'btn-interaction' },
  ],
  好きなもの: [
    { id: 'kitaaa', label: 'きたーっっっ！', emoji: '🔥', colorClass: 'btn-exclamation' },
    { id: 'sore_iine', label: 'それいいね', emoji: '❤️', colorClass: 'btn-empathy' },
    { id: 'subarashii', label: 'すばらしい', emoji: '👏', colorClass: 'btn-praise' },
    { id: 'issho_ni_yaritai', label: '一緒にやりたい！', emoji: '🗣️', colorClass: 'btn-interaction' },
  ],
  雑談: [
    { id: 'nandatte', label: 'なんだって！', emoji: '📢', colorClass: 'btn-exclamation' },
    { id: 'mekara_uroko', label: '目からウロコ', emoji: '🧠', colorClass: 'btn-empathy' },
    { id: 'kami', label: '神', emoji: '👑', colorClass: 'btn-praise' },
    { id: 'motto_oshiete', label: 'もっと教えて！', emoji: '🧪', colorClass: 'btn-interaction' },
  ],
  ユニーク: [
    { id: 'kusa', label: '草', emoji: '🌿', colorClass: 'btn-exclamation' },
    { id: 'm1_deyou', label: 'M1出よう', emoji: '🎙️', colorClass: 'btn-empathy' },
    { id: 'appare', label: 'あっぱれ', emoji: '🤣', colorClass: 'btn-praise' },
    { id: 'motto_hanashite', label: 'もっと話して！', emoji: '👀', colorClass: 'btn-interaction' },
  ],
};