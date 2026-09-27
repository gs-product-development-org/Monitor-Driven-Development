'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import './topic-setting.css';

// ジャンル型定義
type Genre = '学校' | '日常' | '好きなもの' | '雑談' | 'ユニーク';

// ジャンル名と genre_id のマッピング表
const GENRE_MAP: Record<Genre, number> = {
  学校: 1,
  日常: 2,
  好きなもの: 3,
  雑談: 4,
  ユニーク: 5,
};

const GENRES: Genre[] = ['学校', '日常', '好きなもの', '雑談', 'ユニーク'];

// DBから取得するテンプレートの型定義
type TemplateTopic = {
  template_topic_id: number;
  genre_id: number;
  template_topic_content: string;
};

// セレクトボックスのデフォルト説明用テキスト
const SELECT_PLACEHOLDER = '選択すると上のお題に反映されます';

// sessionStorage 保存用キー名定数
export const CURRENT_WORK_TOPIC_KEY = 'current_work_topic';

export default function SetTopicPage() {
  const router = useRouter();

  // ジャンル選択 State
  const [selectedGenre, setSelectedGenre] = useState<Genre>('学校');

  // テキストボックスの入力値 State（初期状態は空）
  const [topicText, setTopicText] = useState<string>('');

  // 選択されたテンプレートオブジェクト State (ID保持用)
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateTopic | null>(null);

  // DBから取得したテンプレートリスト State
  const [templates, setTemplates] = useState<TemplateTopic[]>([]);
  const [loadingTemplates, setLoadingTemplates] =
    useState<boolean>(false);

  // 送信処理中のローディング State
  const [isSubmitting, setIsSubmitting] =
    useState<boolean>(false);

  // ドロップダウンの開閉 State
  const [isDropdownOpen, setIsDropdownOpen] =
    useState<boolean>(false);

  // モーダル表示 State
  const [isModalOpen, setIsModalOpen] =
    useState<boolean>(false);

  // ドロップダウン外側のクリック検知用Ref
  const dropdownRef =
    useRef<HTMLDivElement>(null);

  // 1. ジャンル変更時にDBからテンプレート一覧を取得
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoadingTemplates(true);

      try {
        const genreId = GENRE_MAP[selectedGenre];

        const { data, error } =
          await supabase.rpc('get_templates', {
            p_genre_id: genreId,
          });

        if (error) {
          console.error(
            'テンプレートの取得に失敗しました:',
            error
          );

          setTemplates([]);
        } else {
          setTemplates(data || []);
        }
      } catch (err) {
        console.error(
          'エラーが発生しました:',
          err
        );

        setTemplates([]);
      } finally {
        setLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, [selectedGenre]);

  // 外側クリックでドロップダウンを閉じる処理
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          event.target as Node
        )
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    return () =>
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
  }, []);

  // 2. 左側ジャンルボタン切替処理
  const handleGenreSelect = (
    genre: Genre
  ) => {
    setSelectedGenre(genre);
    setSelectedTemplate(null);
    setTopicText('');
    setIsDropdownOpen(false);
  };

  // 3. カスタムテンプレート選択処理
  const handleTemplateSelect = (
    item: TemplateTopic
  ) => {
    setSelectedTemplate(item);
    setTopicText(
      item.template_topic_content
    );
    setIsDropdownOpen(false);
  };

  // 4. 確定ボタンクリック (モーダル開く)
  const handleOpenConfirmModal = () => {
    if (!topicText.trim()) {
      alert(
        'お題を入力または選択してください'
      );
      return;
    }

    setIsModalOpen(true);
  };

  // 5. モーダル内「始める」ボタンクリック処理
  const handleModalSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // --------------------------------
      // sessionStorageからユーザー情報取得
      // --------------------------------
      const userInfoString =
        sessionStorage.getItem('user_info');

      if (!userInfoString) {
        alert(
          'ログイン情報が見つかりません。再ログインしてください。'
        );

        setIsSubmitting(false);
        return;
      }

      let userInfo: any;

      try {
        userInfo = JSON.parse(
          userInfoString
        );
      } catch (parseError) {
        console.error(
          'user_infoの解析に失敗しました:',
          parseError
        );

        alert(
          'ログイン情報が正しくありません。再ログインしてください。'
        );

        setIsSubmitting(false);
        return;
      }

      // --------------------------------
      // class_id取得
      // --------------------------------
      const classId = Number(
        userInfo?.class_id
      );

      if (
        !classId ||
        Number.isNaN(classId)
      ) {
        alert(
          '所属クラスの情報が見つかりません。再ログインしてください。'
        );

        setIsSubmitting(false);
        return;
      }

      // --------------------------------
      // genre_id取得
      // --------------------------------
      const genreId =
        GENRE_MAP[selectedGenre];

      // --------------------------------
      // template_topic_id
      //
      // 選択したテンプレートテキストと
      // 現在のお題テキストが一致している場合のみ
      // template_topic_idを送信
      // --------------------------------
      const templateTopicId =
        selectedTemplate &&
        selectedTemplate.template_topic_content ===
          topicText
          ? selectedTemplate.template_topic_id
          : null;

      // --------------------------------
      // create_topic RPC
      //
      // RPC側で
      // 1. topicsへINSERT
      // 2. class_sessions.topic_idを更新
      // 3. phaseをANSWERINGへ変更
      // --------------------------------
      const { data, error } =
        await supabase.rpc(
          'create_topic',
          {
            p_class_id: classId,
            p_genre_id: genreId,
            p_topic_content:
              topicText.trim(),
            p_template_topic_id:
              templateTopicId,
          }
        );

      if (error) {
        console.error(
          'お題の登録エラー:',
          error
        );

        alert(
          `お題の作成に失敗しました: ${error.message}`
        );

        setIsSubmitting(false);
        return;
      }

      // --------------------------------
      // RPCの戻り値確認
      // --------------------------------
      if (
        !data ||
        data.length === 0
      ) {
        console.error(
          'create_topicの戻り値がありません:',
          data
        );

        alert(
          'お題の作成結果を取得できませんでした。'
        );

        setIsSubmitting(false);
        return;
      }

      const createdTopic = data[0];

      console.log(
        '作成されたお題:',
        createdTopic
      );

      // --------------------------------
      // 作成したお題情報を保存
      //
      // RPCでclass_sessions.topic_idにも
      // 同じtopic_idが設定されている。
      // --------------------------------
      const currentWorkTopic = {
        topic_id: createdTopic.topic_id,
        class_id: createdTopic.class_id,
        genre_id: createdTopic.genre_id,
        topic_content:
          createdTopic.topic_content,
      };

      sessionStorage.setItem(
        CURRENT_WORK_TOPIC_KEY,
        JSON.stringify(
          currentWorkTopic
        )
      );

      setIsModalOpen(false);

      // --------------------------------
      // 待機画面へ遷移
      // --------------------------------
      router.push(
        '/wait?mode=topic_cushion'
      );
    } catch (err: any) {
      console.error(
        '送信処理中に例外が発生しました:',
        err
      );

      alert(
        '予期せぬエラーが発生しました'
      );

      setIsSubmitting(false);
    }
  };

  return (
    <div className="topic-container">
      {/* 画面ヘッダー */}
      <header className="topic-header">
        <button
          type="button"
          onClick={() =>
            router.push('/home')
          }
          className="topic-back-button"
          aria-label="もどる"
        >
          <span className="back-arrow">
            ▲
          </span>

          <span className="back-text">
            もどる
          </span>
        </button>

        <h1 className="topic-title">
          お題設定
        </h1>
      </header>

      {/* メインレイアウト */}
      <div className="topic-content-wrapper">
        {/* 左側: ジャンル選択ボタン群 */}
        <div className="genre-button-group">
          {GENRES.map((genre) => {
            const isSelected =
              genre === selectedGenre;

            return (
              <button
                key={genre}
                type="button"
                onClick={() =>
                  handleGenreSelect(
                    genre
                  )
                }
                className={`genre-button ${
                  isSelected
                    ? 'active'
                    : ''
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>

        {/* 右側: テキストエリア ＋ ドロップダウン ＋ 確定ボタン */}
        <div className="topic-input-section">
          <div className="input-block">
            <label className="input-label">
              お題テキスト
            </label>

            <textarea
              value={topicText}
              onChange={(e) => {
                setTopicText(
                  e.target.value
                );

                if (
                  selectedTemplate &&
                  e.target.value !==
                    selectedTemplate.template_topic_content
                ) {
                  setSelectedTemplate(
                    null
                  );
                }
              }}
              placeholder="お題を自由に入力するか、下のテンプレートから選択してください..."
              className="topic-custom-textarea"
            />
          </div>

          <div className="input-block">
            <label className="input-label">
              【{selectedGenre}】のテンプレートお題
            </label>

            <div
              className="custom-dropdown-container"
              ref={dropdownRef}
            >
              <button
                type="button"
                className={`custom-dropdown-trigger ${
                  isDropdownOpen
                    ? 'open'
                    : ''
                }`}
                onClick={() =>
                  setIsDropdownOpen(
                    !isDropdownOpen
                  )
                }
                disabled={
                  loadingTemplates
                }
              >
                <span
                  className={`trigger-text ${
                    !selectedTemplate
                      ? 'placeholder'
                      : ''
                  }`}
                >
                  {loadingTemplates
                    ? '読み込み中...'
                    : selectedTemplate
                    ? selectedTemplate.template_topic_content
                    : SELECT_PLACEHOLDER}
                </span>

                <span className="dropdown-big-arrow">
                  ▼
                </span>
              </button>

              {isDropdownOpen && (
                <ul className="custom-dropdown-menu">
                  {templates.length === 0 ? (
                    <li
                      className="dropdown-option"
                      style={{
                        color: '#888',
                        cursor: 'default',
                      }}
                    >
                      テンプレートがありません
                    </li>
                  ) : (
                    templates.map(
                      (item) => (
                        <li
                          key={
                            item.template_topic_id
                          }
                          className={`dropdown-option ${
                            selectedTemplate?.template_topic_id ===
                            item.template_topic_id
                              ? 'selected'
                              : ''
                          }`}
                          onClick={() =>
                            handleTemplateSelect(
                              item
                            )
                          }
                        >
                          {
                            item.template_topic_content
                          }
                        </li>
                      )
                    )
                  )}
                </ul>
              )}
            </div>
          </div>

          <div className="topic-footer">
            <Button
              onClick={
                handleOpenConfirmModal
              }
              className="topic-confirm-button"
            >
              確定
            </Button>
          </div>
        </div>
      </div>

      {/* モーダルダイアログ */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <p className="modal-message">
              お題
            </p>

            <p className="modal-message-topic">
              「
              <span className="modal-topic-highlight">
                {topicText}
              </span>
              」
            </p>

            <p className="modal-subtext">
              「始める」を押すと、児童全員とあなたの端末で
              <br />
              このお題でのワークがスタートします。
            </p>

            <div className="modal-buttons-row">
              <button
                type="button"
                onClick={() =>
                  setIsModalOpen(
                    false
                  )
                }
                className="modal-btn modal-btn-cancel"
                disabled={isSubmitting}
              >
                いいえ
              </button>

              <button
                type="button"
                onClick={
                  handleModalSubmit
                }
                className="modal-btn modal-btn-confirm"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? '処理中...'
                  : '始める'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
