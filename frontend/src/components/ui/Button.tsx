import React from 'react';
import './Button.css';

type ButtonProps = {
  children: React.ReactNode;          // ボタンのテキスト（表示文字列）
  onClick?: () => void;                // 押したときのアクション（関数）
  type?: 'button' | 'submit' | 'reset'; // フォーム送信か通常のボタンか
  disabled?: boolean;                  // ローディング時などの非活性状態
  className?: string;      // 呼び出し側からの位置調整用CSSクラス
};

export function Button({
  children,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`common-button ${className}`}
    >
      {children}
    </button>
  );
}