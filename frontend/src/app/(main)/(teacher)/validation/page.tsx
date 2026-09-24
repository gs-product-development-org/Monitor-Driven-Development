'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase'; // ご自身のSupabaseクライアントのパスに合わせて調整してください
import './validation.css';

// NGワードの型定義
interface NgWord {
  word_id: number;
  word: string;
  created_at: string;
}

export default function NgWordsPage() {
  const router = useRouter();

  // NGワード一覧 State（IDや作成日を持つオブジェクトの配列）
  const [ngWords, setNgWords] = useState<NgWord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 入力フォーム State
  const [newWord, setNewWord] = useState<string>(''); // 追加用
  const [searchQuery, setSearchQuery] = useState<string>(''); // 検索入力用
  const [activeSearchTerm, setActiveSearchTerm] = useState<string>(''); // 検索実行中のワード

  // 1. 初期データ取得 (全NGワード一覧のロード)
  const fetchNgWords = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_ng_all_words');

      if (error) {
        console.error('NGワード一覧の取得に失敗しました:', error.message);
        alert('データ取得に失敗しました');
        return;
      }

      setNgWords(data || []);
    } catch (err) {
      console.error('通信エラー:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNgWords();
  }, []);

  // 2. ワード追加処理 (RPC: create_ng_word)
  const handleAddWord = async () => {
    const trimmed = newWord.trim();
    if (!trimmed) {
      alert('NGワードを入力してください');
      return;
    }

    try {
      const { data, error } = await supabase.rpc('create_ng_word', {
        p_word: trimmed,
      });

      if (error) {
        console.error('登録エラー:', error.message);
        alert('NGワードの登録に失敗しました');
        return;
      }

      // RPCが返すテーブル結果の最初の行を取得
      const result = data?.[0];

      if (result) {
        if (result.is_success) {
          // 成功時：ローカルStateの先頭に新しいワードを追加
          const newEntry: NgWord = {
            word_id: result.word_id,
            word: result.word,
            created_at: new Date().toISOString(),
          };
          setNgWords([newEntry, ...ngWords]);
          setNewWord('');
          alert(result.message);
        } else {
          // エラー時（重複・空文字など）
          alert(result.message);
        }
      }
    } catch (err) {
      console.error('通信エラー:', err);
      alert('通信エラーが発生しました');
    }
  };

  // 3. 検索実行処理
  const handleSearch = () => {
    setActiveSearchTerm(searchQuery.trim());
  };

  // 4. ワード削除処理 (RPC: delete_ng_word)
  const handleDeleteWord = async (targetId: number) => {
    if (!confirm('本当に削除しますか？')) return;

    try {
      const { data, error } = await supabase.rpc('delete_ng_word', {
        p_word_id: targetId,
      });

      if (error) {
        console.error('削除エラー:', error.message);
        alert('NGワードの削除に失敗しました');
        return;
      }

      const result = data?.[0];

      if (result) {
        if (result.is_success) {
          // 削除成功：該当IDのワードをリストから除外
          setNgWords((prev) => prev.filter((item) => item.word_id !== targetId));
          alert(result.message);
        } else {
          alert(result.message);
        }
      }
    } catch (err) {
      console.error('通信エラー:', err);
      alert('通信エラーが発生しました');
    }
  };

  // 表示用リストのフィルタリング
  const displayedWords = activeSearchTerm
    ? ngWords.filter((item) =>
        item.word.toLowerCase().includes(activeSearchTerm.toLowerCase())
      )
    : ngWords;

  return (
    <div className="ng-words-container">
      {/* 画面左上: 「▲ もどる」ボタン */}
      <button
        type="button"
        onClick={() => router.push('/home')}
        className="ng-back-button"
        aria-label="もどる"
      >
        <span className="back-arrow">▲</span>
        <span className="back-text">もどる</span>
      </button>

      <div className="ng-words-content">
        {/* 1. 一番上: ワード入力ボックス + 右に追加ボタン */}
        <div className="ng-form-row">
          <input
            type="text"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            placeholder="新しいNGワードを入力..."
            className="ng-input"
          />
          <Button onClick={handleAddWord} className="ng-action-button">
            追加
          </Button>
        </div>

        {/* 2. その下: 既存ワード検索ボックス + 右に検索ボタン */}
        <div className="ng-form-row">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="登録済みワードを検索..."
            className="ng-input-search"
          />
          <Button onClick={handleSearch} className="ng-action-button-search">
            検索
          </Button>
        </div>

        {/* 3. さらに下: NGワードを縦に一覧表示 */}
        <div className="ng-list-container">
          <div className="ng-list-header">
            {activeSearchTerm ? (
              <span>「{activeSearchTerm}」の検索結果 ({displayedWords.length}件)</span>
            ) : (
              <span>登録済みNGワード一覧 ({displayedWords.length}件)</span>
            )}
            {activeSearchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveSearchTerm('');
                }}
                className="ng-search-clear"
              >
                クリア
              </button>
            )}
          </div>

          <ul className="ng-list">
            {loading ? (
              <li className="ng-empty-item">読み込み中...</li>
            ) : displayedWords.length > 0 ? (
              displayedWords.map((item) => (
                <li key={item.word_id} className="ng-item">
                  <span className="ng-word-text">{item.word}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteWord(item.word_id)}
                    className="ng-delete-button"
                  >
                    削除
                  </button>
                </li>
              ))
            ) : (
              <li className="ng-empty-item">該当するNGワードはありません</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}